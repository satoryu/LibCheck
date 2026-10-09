import { useState } from 'react';
import type { FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  trackLibraryReservationLinkClick,
  trackTrialCheckResult,
  trackTrialCheckSubmit,
} from '@/analytics/events';
import { isReservable } from '@/domain/models/availabilityStatus';
import type { TrialCheckResult, TrialLibraryResult } from '@/domain/models/trialCheckResult';
import { TrialRateLimitedError } from '@/domain/models/trialCheckResult';
import { calilLibraryUrl } from '@/domain/utils/calilUrls';
import { isbnValidator } from '@/domain/utils/isbnValidator';
import { useAuth } from '@/presentation/auth/AuthProvider';
import { GoogleSignInControl } from '@/presentation/auth/GoogleSignInControl';
import { useBookMetadata } from '@/presentation/hooks/useBookMetadata';
import { useTrialCheck } from '@/presentation/hooks/useTrialCheck';
import { countTrialAvailability } from '@/presentation/utils/availabilityCounts';
import { AvailabilityStatusBadge } from '@/presentation/widgets/AvailabilityStatusBadge';

/** 登録一覧（LibraryListPage）の見出しに付ける id。結果の下の誘導リンクの飛び先。 */
export const REGISTER_LIBRARIES_ANCHOR = 'register-libraries';

export interface TrialCheckSectionProps {
  pref: string;
  city: string;
  /** 見出し・説明は配信 HTML と同じ文言（regionPageContent.ts の `trial`）を渡す。 */
  heading: string;
  description: string;
}

/**
 * 地域ページのログインなしの体験版（#183）。ISBN を1件入力すると、その市区町村の
 * 図書館で借りられるか・予約できるかを表示し、図書館の登録へ誘導する。
 *
 * 上限（接続元ごと・体験版全体）に達した場合はエラーではなく案内として扱い、
 * ログインして図書館を登録する導線を出す。
 */
export function TrialCheckSection({
  pref,
  city,
  heading,
  description,
}: TrialCheckSectionProps): JSX.Element {
  const [input, setInput] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const trial = useTrialCheck(pref, city);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const isbn = input.replace(/[-\s]/g, '');
    if (!isbnValidator.isValidIsbn(isbn)) {
      setValidationMessage(
        isbnValidator.getValidationMessage(isbn) ?? 'ISBNは10桁または13桁で入力してください',
      );
      return;
    }
    setValidationMessage(null);
    trackTrialCheckSubmit();
    trial.mutate(isbn, {
      onSuccess: (result) => {
        const counts = countTrialAvailability(result);
        trackTrialCheckResult(counts.holdingLibraryCount > 0 ? 'found' : 'not_found', counts);
      },
      onError: (error) => {
        trackTrialCheckResult(error instanceof TrialRateLimitedError ? 'rate_limited' : 'error');
      },
    });
  };

  return (
    <Box component="section" aria-labelledby="trial-check-heading" sx={{ px: 2, pt: 2 }}>
      <Typography id="trial-check-heading" component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
        {heading}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'flex-start' }}
      >
        <TextField
          label="ISBN"
          size="small"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="978…"
          error={validationMessage !== null}
          helperText={validationMessage ?? undefined}
          inputProps={{ inputMode: 'numeric', autoComplete: 'off', maxLength: 17 }}
          sx={{ flex: 1 }}
        />
        <Button type="submit" variant="contained" disabled={trial.isPending} sx={{ whiteSpace: 'nowrap' }}>
          この地域の図書館で調べる
        </Button>
      </Box>

      {trial.isPending && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }} role="status">
          <CircularProgress size={20} />
          <Typography variant="body2">図書館に問い合わせています（20秒ほどかかることがあります）</Typography>
        </Box>
      )}
      {trial.isError && <TrialError error={trial.error} />}
      {trial.isSuccess && <TrialResult result={trial.data} city={city} />}
    </Box>
  );
}

function TrialResult({ result, city }: { result: TrialCheckResult; city: string }): JSX.Element {
  const metadata = useBookMetadata(result.isbn);
  const title = metadata.data?.title;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {title ? `「${title}」の${city}の図書館での状況` : `ISBN ${result.isbn} の${city}の図書館での状況`}
      </Typography>
      <Box component="ul" aria-label="調べた結果" sx={{ listStyle: 'none', p: 0, m: 0, mt: 1 }}>
        {result.libraries.map((library) => (
          <TrialLibraryRow key={`${library.systemId}:${library.libKey}`} library={library} />
        ))}
      </Box>
      {!result.complete && (
        <Typography variant="caption" color="text.secondary" component="p">
          まだ確認中の図書館があります。少し時間をおいてもう一度調べると表示されます。
        </Typography>
      )}
      {result.omittedLibraryCount > 0 && (
        <Typography variant="caption" color="text.secondary" component="p">
          {`ほか${result.omittedLibraryCount}館は、図書館を登録すると調べられます。`}
        </Typography>
      )}
      <Alert severity="info" sx={{ mt: 1.5 }}>
        {`${city}の図書館を登録すると、本のバーコードを読み取るだけで毎回調べられます。`}
        <Link href={`#${REGISTER_LIBRARIES_ANCHOR}`} sx={{ display: 'block', mt: 0.5 }}>
          下の一覧から図書館を登録する
        </Link>
      </Alert>
    </Box>
  );
}

function TrialLibraryRow({ library }: { library: TrialLibraryResult }): JSX.Element {
  const showReserve = library.reserveUrl !== null && isReservable(library.status);
  return (
    <Box
      component="li"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: 1, borderColor: 'divider' }}
    >
      {/* カーリルAPIの規約上、APIで取得した図書館名・貸出状況を表示する際は
          カーリルのページへのリンクが必須（#156）。図書館名をリンクにする。 */}
      <Link
        variant="body2"
        href={calilLibraryUrl({ ...library, formalName: library.name })}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ flex: 1, minWidth: 0 }}
      >
        {library.name}
      </Link>
      {library.checking ? (
        <Typography variant="body2" color="text.secondary">
          確認中
        </Typography>
      ) : (
        <AvailabilityStatusBadge status={library.status} />
      )}
      {showReserve && library.reserveUrl !== null && (
        <Button
          size="small"
          href={library.reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackLibraryReservationLinkClick}
        >
          予約する
        </Button>
      )}
    </Box>
  );
}

function TrialError({ error }: { error: Error }): JSX.Element {
  const { user } = useAuth();

  if (!(error instanceof TrialRateLimitedError)) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        調べられませんでした。時間をおいてもう一度お試しください。
      </Alert>
    );
  }
  return (
    <Alert severity="info" sx={{ mt: 2 }}>
      {error.reason === 'ip'
        ? '体験版は1時間に5回まで使えます。'
        : '体験版は混み合っています。しばらくしてからお試しください。'}
      <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
        ログインして図書館を登録すると、回数の制限なく調べられます。
      </Box>
      {user === null && (
        <Box sx={{ mt: 1 }}>
          <GoogleSignInControl />
        </Box>
      )}
    </Alert>
  );
}
