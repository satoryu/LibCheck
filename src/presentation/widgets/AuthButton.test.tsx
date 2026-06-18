import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthButton } from '@/presentation/widgets/AuthButton';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import type { User } from '@/domain/models/user';

function renderButton(initialUser: User | null = null) {
  return render(
    <AuthProvider initialUser={initialUser}>
      <AuthButton />
    </AuthProvider>,
  );
}

describe('AuthButton', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ログイン中はユーザー名とサインアウトを表示し、サインアウトで消える', async () => {
    renderButton({ id: 'u1', name: 'Alice' });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'サインアウト' }));
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('モック有効時は Dev ログインボタンを表示し、クリックでログインする', async () => {
    vi.stubEnv('VITE_AUTH_MOCK', 'true');
    renderButton(null);

    await userEvent.click(
      screen.getByRole('button', { name: 'Dev ログイン（モック）' }),
    );
    // モックユーザー名が表示される
    expect(await screen.findByText('Dev User')).toBeInTheDocument();
  });

  it('クライアント ID 未設定かつ非モックでは何も表示しない', () => {
    const { container } = renderButton(null);
    expect(container).toBeEmptyDOMElement();
  });
});
