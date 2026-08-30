import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RegisterLoginDialog } from '@/presentation/widgets/RegisterLoginDialog';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { DependenciesProvider } from '@/app/dependencies';
import { makeFakeDeps } from '@/test/testUtils';

function renderDialog(props: {
  open: boolean;
  libraryNames: string[];
  onClose?: () => void;
}) {
  return render(
    <DependenciesProvider value={makeFakeDeps()}>
      <AuthProvider initialUser={null}>
        <RegisterLoginDialog
          open={props.open}
          libraryNames={props.libraryNames}
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
    renderDialog({ open: false, libraryNames: ['図書館1'] });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('open=true のとき選択中の図書館名を表示する', () => {
    renderDialog({ open: true, libraryNames: ['図書館1', '図書館2'] });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('図書館1');
    expect(dialog).toHaveTextContent('図書館2');
  });

  it('モック有効時はその場でログインできる操作を表示する', () => {
    vi.stubEnv('VITE_AUTH_MOCK', 'true');
    renderDialog({ open: true, libraryNames: ['図書館1'] });

    expect(
      screen.getByRole('button', { name: 'Dev ログイン（モック）' }),
    ).toBeInTheDocument();
  });

  it('キャンセルで onClose が呼ばれる', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ open: true, libraryNames: ['図書館1'], onClose });

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onClose).toHaveBeenCalled();
  });
});
