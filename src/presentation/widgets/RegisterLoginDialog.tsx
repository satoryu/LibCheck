import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';

import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';
import { GoogleSignInControl } from '@/presentation/auth/GoogleSignInControl';

export interface RegisterLoginDialogProps {
  open: boolean;
  /** 選択中の図書館（登録内容をログイン前に明示する）。 */
  libraries: Library[];
  onClose: () => void;
}

/**
 * 未ログインで図書館の登録を試みたときに開く、その場でログインするための
 * ダイアログ（#167）。
 *
 * `LibraryListPage` の選択状態（`useSelectedLibraries`）はページ内 Context の
 * ため、このダイアログを開いている間もアンマウントされず保持される。ログイン
 * 成功後にどの図書館を登録するかは呼び出し元（`LibraryListPage`）が
 * `useAuth().user` の変化を見て行う — このコンポーネントは表示のみを担当する。
 */
export function RegisterLoginDialog({
  open,
  libraries,
  onClose,
}: RegisterLoginDialogProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>ログインして図書館を登録</DialogTitle>
      <DialogContent>
        <DialogContentText>
          選択した{libraries.length}件の図書館を登録するにはログインが必要です。ログインすると、選択は保持されたまま登録が続行されます。
        </DialogContentText>
        <Box component="ul" sx={{ mt: 1.5, pl: 2.5, mb: 0 }}>
          {/* formalName は図書館間で重複しうるため、一覧描画と同じ libraryKey を key に使う（#167 レビュー指摘）。 */}
          {libraries.map((library) => (
            <li key={libraryKey(library)}>{library.formalName}</li>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose}>キャンセル</Button>
        <GoogleSignInControl />
      </DialogActions>
    </Dialog>
  );
}
