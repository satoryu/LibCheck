import type { SvgIconComponent } from '@mui/icons-material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';

interface StatusInfo {
  label: string;
  /** MUI テーマのカラートークン（sx の color に渡す）。 */
  color: string;
  Icon: SvgIconComponent;
}

const INACTIVE_COLOR = 'grey.500';

function statusInfo(status: AvailabilityStatus): StatusInfo {
  switch (status) {
    case AvailabilityStatus.available:
      return { label: '貸出可能', color: 'success.main', Icon: CheckCircleIcon };
    case AvailabilityStatus.inLibraryOnly:
      return { label: '館内のみ', color: 'success.main', Icon: CheckCircleIcon };
    case AvailabilityStatus.checkedOut:
      return { label: '貸出中', color: 'warning.main', Icon: ScheduleIcon };
    case AvailabilityStatus.reserved:
      return { label: '予約中', color: 'warning.main', Icon: ScheduleIcon };
    case AvailabilityStatus.preparing:
      return { label: '準備中', color: 'warning.main', Icon: ScheduleIcon };
    case AvailabilityStatus.closed:
      return { label: '休館中', color: INACTIVE_COLOR, Icon: BlockIcon };
    case AvailabilityStatus.notFound:
      return {
        label: '蔵書なし',
        color: INACTIVE_COLOR,
        Icon: RemoveCircleOutlineIcon,
      };
    case AvailabilityStatus.error:
      return { label: 'エラー', color: 'error.main', Icon: ErrorOutlineIcon };
    case AvailabilityStatus.unknown:
      return { label: '不明', color: INACTIVE_COLOR, Icon: HelpOutlineIcon };
  }
}

export interface AvailabilityStatusBadgeProps {
  status: AvailabilityStatus;
}

export function AvailabilityStatusBadge({
  status,
}: AvailabilityStatusBadgeProps): JSX.Element {
  const { label, color, Icon } = statusInfo(status);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Icon sx={{ color, fontSize: 20 }} />
      <Typography component="span" sx={{ color, fontWeight: 'bold' }}>
        {label}
      </Typography>
    </Box>
  );
}
