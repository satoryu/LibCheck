import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * アプリ全体の描画例外を受け止めるフォールバック（#117）。
 *
 * これが無いと描画クラッシュ時に無言の白画面になる。エラー境界は
 * クラスコンポーネントでのみ実装できるため class で書く。
 * 復帰手段は「再読み込み」（SPA 全体を初期化するのが最も確実）。
 */
/** react-router の errorElement 用フォールバック（見た目は境界と共通）。 */
export function RouteErrorFallback(): JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
      <Typography variant="h6" component="h1">
        問題が発生しました
      </Typography>
      <Typography color="text.secondary" variant="body2">
        ご不便をおかけしています。再読み込みで復帰できることがあります。
      </Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>
        再読み込み
      </Button>
    </Box>
  );
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 監視サービス導入（#118）まではコンソールに記録するのみ。
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography variant="h6" component="h1">
          問題が発生しました
        </Typography>
        <Typography color="text.secondary" variant="body2">
          ご不便をおかけしています。再読み込みで復帰できることがあります。
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </Box>
    );
  }
}
