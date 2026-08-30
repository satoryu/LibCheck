import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RegisterLoginDialog } from '@/presentation/widgets/RegisterLoginDialog';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { DependenciesProvider } from '@/app/dependencies';
import { makeFakeDeps } from '@/test/testUtils';
import type { Library } from '@/domain/models/library';

function createLibrary(formalName: string, libId: string): Library {
  return {
    systemId: 'system1',
    systemName: 'テスト図書館システム',
    libKey: 'key1',
    libId,
    shortName: formalName,
    formalName,
    address: '住所',
    pref: '東京都',
    city: '港区',
    category: 'MEDIUM',
  };
}

function renderDialog(props: {
  open: boolean;
  libraries: Library[];
  onClose?: () => void;
}) {
  return render(
    <DependenciesProvider value={makeFakeDeps()}>
      <AuthProvider initialUser={null}>
        <RegisterLoginDialog
          open={props.open}
          libraries={props.libraries}
          onClose={props.onClose ?? (() => {})}
        />
      </AuthProvider>
    </DependenciesProvider>,
  );
}

describe('RegisterLoginDialog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('open=false のときは何も表示しない', () => {
    renderDialog({ open: false, libraries: [createLibrary('図書館1', '1')] });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('open=true のとき選択中の図書館名を表示する', () => {
    renderDialog({
      open: true,
      libraries: [createLibrary('図書館1', '1'), createLibrary('図書館2', '2')],
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('図書館1');
    expect(dialog).toHaveTextContent('図書館2');
  });

  it('図書館名が重複していても一意なキーで表示する', () => {
    // formalName は図書館間で重複しうる（例: 異なるシステムの同名分館）。
    // libraryKey ではなく formalName を key にすると React が警告・誤描画する
    // 回帰の防止（#167 レビュー指摘）。
    renderDialog({
      open: true,
      libraries: [
        createLibrary('中央図書館', '1'),
        createLibrary('中央図書館', '2'),
      ],
    });

    const items = screen.getAllByText('中央図書館');
    expect(items).toHaveLength(2);
  });

  it('モック有効時はその場でログインできる操作を表示する', () => {
    vi.stubEnv('VITE_AUTH_MOCK', 'true');
    renderDialog({ open: true, libraries: [createLibrary('図書館1', '1')] });

    expect(
      screen.getByRole('button', { name: 'Dev ログイン（モック）' }),
    ).toBeInTheDocument();
  });

  it('キャンセルで onClose が呼ばれる', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({
      open: true,
      libraries: [createLibrary('図書館1', '1')],
      onClose,
    });

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onClose).toHaveBeenCalled();
  });
});
