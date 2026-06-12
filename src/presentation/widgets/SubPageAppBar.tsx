import type { ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useBackNavigation } from '@/presentation/hooks/useBackNavigation';

export interface SubPageAppBarProps {
  title: string;
  /** AppBar 右端に表示する要素（フラッシュボタン等）。 */
  trailing?: ReactNode;
}

/**
 * サブページ共通の AppBar。
 *
 * Flutter の AppBar が自動表示していた戻るボタンを再現する。
 * 履歴が無い場合はホームへフォールバックする（useBackNavigation 参照）。
 */
export function SubPageAppBar({
  title,
  trailing,
}: SubPageAppBarProps): JSX.Element {
  const goBack = useBackNavigation();

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="戻る"
          onClick={goBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {trailing}
      </Toolbar>
    </AppBar>
  );
}
