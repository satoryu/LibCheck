import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';

import { theme } from '@/theme';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { AuthGate } from '@/presentation/auth/AuthGate';
import type { User } from '@/domain/models/user';

function renderGate(user: User | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider initialUser={user}>
          <AuthGate>
            <div>APP CONTENT</div>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('AuthGate', () => {
  it('未ログインはログイン画面を表示する', () => {
    renderGate(null);
    expect(screen.getByText(/ログインすると/)).toBeInTheDocument();
    expect(screen.queryByText('APP CONTENT')).not.toBeInTheDocument();
  });

  it('ログイン済みは子を表示する', () => {
    renderGate({ id: 'u1', name: 'Alice' });
    expect(screen.getByText('APP CONTENT')).toBeInTheDocument();
    expect(screen.queryByText(/ログインすると/)).not.toBeInTheDocument();
  });
});
