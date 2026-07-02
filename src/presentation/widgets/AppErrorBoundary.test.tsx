import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AppErrorBoundary } from '@/presentation/widgets/AppErrorBoundary';

function Bomb(): JSX.Element {
  throw new Error('boom');
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    // React が componentDidCatch 経由の例外を console.error に出すため黙らせる。
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('子が正常なら子をそのまま表示する', () => {
    render(
      <AppErrorBoundary>
        <div>APP OK</div>
      </AppErrorBoundary>,
    );
    expect(screen.getByText('APP OK')).toBeInTheDocument();
  });

  it('子が throw したらフォールバック（再読み込みボタン付き）を表示する', () => {
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText(/問題が発生しました/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /再読み込み/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('APP OK')).not.toBeInTheDocument();
  });
});
