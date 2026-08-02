import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';

import type { PendingScan } from '@/domain/models/pendingScan';
import { KC_MONO, KC_COLORS } from '@/presentation/theme/tokens';

const scannedAtFormat = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * オフライン中にスキャンして保留中の ISBN の一覧カード（#144）。
 *
 * オンライン復帰時に自動検索されるまでの「待ち」をユーザーに見せる。
 * 0件のときは呼び出し側（HomePage）が表示自体を省略する。
 */
export function PendingScansCard({
  scans,
  onRemove,
}: {
  scans: PendingScan[];
  onRemove: (isbn: string) => void;
}): JSX.Element {
  return (
    <Card sx={{ width: '100%', mt: 4, borderTop: `3px solid ${KC_COLORS.brass}` }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon sx={{ fontSize: 20, color: KC_COLORS.brass }} />
          <Typography variant="subtitle2">
            {`保留中の検索（${scans.length}件）`}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          接続が回復すると自動的に検索されます
        </Typography>
        {scans.map((scan) => (
          <Box
            key={scan.isbn}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1,
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{ fontFamily: KC_MONO, letterSpacing: '0.06em' }}
              >
                {scan.isbn}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {scannedAtFormat.format(scan.scannedAt)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label={`保留中の${scan.isbn}を削除`}
              onClick={() => onRemove(scan.isbn)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
