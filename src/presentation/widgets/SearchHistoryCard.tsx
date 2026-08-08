import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';

import {
  AvailabilityStatus,
  aggregateAvailability,
  availabilityFromName,
} from '@/domain/models/availabilityStatus';
import type { BookMetadata } from '@/domain/models/bookMetadata';
import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import { BookCoverThumbnail } from '@/presentation/widgets/BookCoverThumbnail';
import { KC_MONO } from '@/presentation/theme/tokens';
import { AvailabilityStatusBadge } from '@/presentation/widgets/AvailabilityStatusBadge';

export interface SearchHistoryCardProps {
  entry: SearchHistoryEntry;
  onTap: () => void;
  now?: Date;
  /** 書誌メタデータ（#141）。未取得（undefined/null）なら ISBN を主表記にする。 */
  metadata?: BookMetadata | null;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatDate(dateTime: Date, now?: Date): string {
  const currentTime = now ?? new Date();
  const today = new Date(
    currentTime.getFullYear(),
    currentTime.getMonth(),
    currentTime.getDate(),
  );
  const entryDate = new Date(
    dateTime.getFullYear(),
    dateTime.getMonth(),
    dateTime.getDate(),
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  const difference = Math.round((today.getTime() - entryDate.getTime()) / msPerDay);

  if (difference === 0) {
    return `${pad2(dateTime.getHours())}:${pad2(dateTime.getMinutes())}`;
  } else if (difference === 1) {
    return '昨日';
  } else if (difference <= 7) {
    return `${difference}日前`;
  } else {
    return `${dateTime.getFullYear()}/${pad2(dateTime.getMonth() + 1)}/${pad2(
      dateTime.getDate(),
    )}`;
  }
}

function bestStatus(entry: SearchHistoryEntry): AvailabilityStatus {
  const values = Object.values(entry.libraryStatuses);
  if (values.length === 0) return AvailabilityStatus.notFound;
  const statuses = values.map((s) => availabilityFromName(s));
  return aggregateAvailability(statuses);
}

export function SearchHistoryCard({
  entry,
  onTap,
  now,
  metadata,
}: SearchHistoryCardProps): JSX.Element {
  const title = metadata?.title;
  return (
    <Card sx={{ my: 0.5 }}>
      <CardActionArea onClick={onTap} sx={{ borderRadius: 3 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <BookCoverThumbnail
            isbn={entry.isbn}
            openBdCoverUrl={metadata?.coverImageUrl}
            width={44}
            height={62}
            alt={title ?? '書影'}
          />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: 1.5, minWidth: 0 }}>
            {title !== undefined && title.length > 0 ? (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontFamily: KC_MONO,
                    letterSpacing: '0.06em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {`ISBN: ${entry.isbn}`}
                </Typography>
              </>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  fontFamily: KC_MONO,
                  letterSpacing: '0.06em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {`ISBN: ${entry.isbn}`}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatDate(entry.searchedAt, now)}
            </Typography>
          </Box>
          <Box sx={{ ml: 1 }}>
            <AvailabilityStatusBadge status={bestStatus(entry)} />
          </Box>
          <ChevronRightIcon sx={{ color: 'text.secondary', ml: 0.5 }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
