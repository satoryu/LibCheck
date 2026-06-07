import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { isReservable } from '@/domain/models/availabilityStatus';
import type { Library } from '@/domain/models/library';
import { statusForLibKey, type LibraryStatus } from '@/domain/models/libraryStatus';
import { AvailabilityStatusBadge } from '@/presentation/widgets/AvailabilityStatusBadge';

export interface LibraryAvailabilityCardProps {
  library: Library;
  status: LibraryStatus;
}

/**
 * Parses `status.reserveUrl` and returns the URL string only if the scheme is
 * http or https. Returns null for empty, null, or unsafe URLs.
 */
function safeReserveUrl(status: LibraryStatus): string | null {
  const raw = status.reserveUrl;
  if (raw === null || raw === undefined || raw.length === 0) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return raw;
}

export function LibraryAvailabilityCard({
  library,
  status,
}: LibraryAvailabilityCardProps): JSX.Element {
  const reserveUrl = safeReserveUrl(status);
  const libKeyStatus = statusForLibKey(status, library.libKey);
  const showReserve = reserveUrl !== null && isReservable(libKeyStatus);

  return (
    <Card sx={{ my: 1 }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <LocalLibraryIcon sx={{ fontSize: 20 }} />
          <Box sx={{ width: 8 }} />
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {library.formalName}
          </Typography>
        </Box>
        <Box sx={{ height: 4 }} />
        <Typography variant="body2" color="text.secondary">
          {`${library.pref}${library.city}`}
        </Typography>
        <Box sx={{ height: 12 }} />
        <AvailabilityStatusBadge status={libKeyStatus} />
        {showReserve && (
          <>
            <Box sx={{ height: 8 }} />
            <Button
              variant="text"
              onClick={() => {
                window.open(reserveUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              予約する
            </Button>
          </>
        )}
      </Box>
    </Card>
  );
}
