import BookIcon from '@mui/icons-material/Book';
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
import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import { AvailabilityStatusBadge } from '@/presentation/widgets/AvailabilityStatusBadge';

export interface SearchHistoryCardProps {
  entry: SearchHistoryEntry;
  onTap: () => void;
  now?: Date;
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
}: SearchHistoryCardProps): JSX.Element {
  return (
    <Card sx={{ my: 0.5 }}>
      <CardActionArea onClick={onTap} sx={{ borderRadius: 3 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <BookIcon sx={{ fontSize: 24 }} />
          <Box sx={{ width: 12 }} />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body1">{`ISBN: ${entry.isbn}`}</Typography>
            <Box sx={{ height: 4 }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(entry.searchedAt, now)}
            </Typography>
          </Box>
          <Box sx={{ width: 8 }} />
          <AvailabilityStatusBadge status={bestStatus(entry)} />
          <Box sx={{ width: 4 }} />
          <ChevronRightIcon sx={{ color: 'text.secondary' }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
