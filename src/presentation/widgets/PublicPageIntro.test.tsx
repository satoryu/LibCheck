import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PublicPageIntro } from '@/presentation/widgets/PublicPageIntro';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { DependenciesProvider } from '@/app/dependencies';
import { makeFakeDeps } from '@/test/testUtils';
import type { User } from '@/domain/models/user';

const DESCRIPTION = 'ログインすると、登録した図書館をまとめて検索できます。';

function renderIntro(initialUser: User | null = null) {
  return render(
    <DependenciesProvider value={makeFakeDeps()}>
      <AuthProvider initialUser={initialUser}>
        <PublicPageIntro description={DESCRIPTION} />
      </AuthProvider>
    </DependenciesProvider>,
  );
}

describe('PublicPageIntro', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('未ログイン時はアプリ名と説明文を表示する', () => {
    renderIntro(null);

    expect(screen.getByText('LibCheck')).toBeInTheDocument();
    expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
  });

  it('ログイン中は何も表示しない', () => {
    const { container } = renderIntro({ id: 'u1', name: 'Alice' });

    expect(container).toBeEmptyDOMElement();
  });

  it('モック有効時はその場でログインできる操作を表示する', async () => {
    vi.stubEnv('VITE_AUTH_MOCK', 'true');
    renderIntro(null);

    expect(
      screen.getByRole('button', { name: 'Dev ログイン（モック）' }),
    ).toBeInTheDocument();
  });
});
