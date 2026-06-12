import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { renderWithProviders } from '@/test/testUtils';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/** 現在のパスを表示するテスト用コンポーネント。 */
function LocationDisplay(): JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

/** ボタンクリックで遷移して履歴を1件積むテスト用コンポーネント。 */
function PrevPage({ to }: { to: string }): JSX.Element {
  const navigate = useNavigate();
  return (
    <div>
      <p>前の画面</p>
      <button type="button" onClick={() => navigate(to)}>
        進む
      </button>
    </div>
  );
}

describe('SubPageAppBar', () => {
  afterEach(() => {
    // テストで模擬した履歴インデックスをリセットする。
    window.history.replaceState(null, '');
  });

  it('タイトルと戻るボタンが表示される', () => {
    renderWithProviders(<SubPageAppBar title="テストタイトル" />);

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
  });

  it('trailing が AppBar 内に表示される', () => {
    renderWithProviders(
      <SubPageAppBar
        title="テストタイトル"
        trailing={<button type="button">フラッシュ</button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'フラッシュ' }),
    ).toBeInTheDocument();
  });

  it('履歴があるとき戻るボタンで前の画面へ戻る', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/prev" element={<PrevPage to="/current" />} />
        <Route
          path="/current"
          element={<SubPageAppBar title="現在の画面" />}
        />
      </Routes>,
      { route: '/prev' },
    );

    await user.click(screen.getByRole('button', { name: '進む' }));
    expect(await screen.findByText('現在の画面')).toBeInTheDocument();

    // MemoryRouter は window.history を更新しないため、遷移済みの
    // 履歴インデックスを模擬する。
    window.history.replaceState({ idx: 1 }, '');
    await user.click(screen.getByRole('button', { name: '戻る' }));

    expect(await screen.findByText('前の画面')).toBeInTheDocument();
  });

  it('履歴が無いとき戻るボタンでホームへ遷移する', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/" element={<LocationDisplay />} />
        <Route
          path="/sub"
          element={
            <>
              <SubPageAppBar title="サブページ" />
              <LocationDisplay />
            </>
          }
        />
      </Routes>,
      { route: '/sub' },
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/sub');

    await user.click(screen.getByRole('button', { name: '戻る' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
});
