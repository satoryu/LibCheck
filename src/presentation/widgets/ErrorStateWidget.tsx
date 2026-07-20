import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useOnlineStatus } from '@/presentation/hooks/useOnlineStatus';
import { resolveErrorMessage } from '@/presentation/utils/errorMessageResolver';

export interface ErrorStateWidgetProps {
  error: unknown;
  onRetry: () => void;
}

export function ErrorStateWidget({
  error,
  onRetry,
}: ErrorStateWidgetProps): JSX.Element {
  // オンライン状態を購読することで、表示中に接続が切れてもメッセージが
  // 追従する（#145）。
  const isOnline = useOnlineStatus();
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          {resolveErrorMessage(error, isOnline)}
        </Typography>
        <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
          再試行
        </Button>
      </Box>
    </Box>
  );
}
