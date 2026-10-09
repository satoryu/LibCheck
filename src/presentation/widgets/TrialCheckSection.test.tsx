import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import { trackTrialCheckResult, trackTrialCheckSubmit } from '@/analytics/events';
import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { TrialCheckResult, TrialLibraryResult } from '@/domain/models/trialCheckResult';
import { TrialRateLimitedError } from '@/domain/models/trialCheckResult';
import { FakeTrialCheckRepository, makeFakeDeps, renderWithProviders } from '@/test/testUtils';
import { TrialCheckSection } from '@/presentation/widgets/TrialCheckSection';

vi.mock('@/analytics/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/analytics/events')>()),
  trackTrialCheckSubmit: vi.fn(),
  trackTrialCheckResult: vi.fn(),
}));

const ISBN = '9784003101018';

function library(overrides: Partial<TrialLibraryResult> & Pick<TrialLibraryResult, 'name'>): TrialLibraryResult {
  return {
    systemId: 'Shiga_Yasu',
    libKey: overrides.name,
    libId: '100',
    status: AvailabilityStatus.notFound,
    checking: false,
    reserveUrl: null,
    ...overrides,
  };
}

function result(overrides: Partial<TrialCheckResult> = {}): TrialCheckResult {
  return {
    isbn: ISBN,
    complete: true,
    omittedLibraryCount: 0,
    libraries: [
      library({ name: '野洲市野洲図書館', libId: '103', status: AvailabilityStatus.available, reserveUrl: 'https://lib.example/r' }),
      library({ name: '野洲市野洲図書館中主分館', libId: '104', status: AvailabilityStatus.checkedOut, reserveUrl: 'https://lib.example/r' }),
      library({ name: '滋賀県総合教育センター図書資料室', libId: '105' }),
    ],
    ...overrides,
  };
}

function renderSection(
  respond: () => Promise<TrialCheckResult>,
  authUser: { id: string; name: string } | null = null,
) {
  const repository = new FakeTrialCheckRepository(respond);
  const view = renderWithProviders(
    <TrialCheckSection
      pref="滋賀県"
      city="野洲市"
      heading="この本、野洲市の図書館で借りられる？"
      description="ISBN を入力すると調べられます。"
    />,
    { deps: makeFakeDeps({ trialCheckRepository: repository }), authUser },
  );
  return { ...view, repository };
}

async function submit(user: ReturnType<typeof renderSection>['user'], isbn: string) {
  await user.type(screen.getByRole('textbox', { name: 'ISBN' }), isbn);
  await user.click(screen.getByRole('button', { name: 'この地域の図書館で調べる' }));
}

afterEach(() => {
  vi.mocked(trackTrialCheckSubmit).mockClear();
  vi.mocked(trackTrialCheckResult).mockClear();
});

describe('TrialCheckSection（#183）', () => {
  it('見出し・説明・ISBN 入力欄を表示する', () => {
    renderSection(async () => result());

    expect(screen.getByRole('heading', { level: 2, name: 'この本、野洲市の図書館で借りられる？' })).toBeInTheDocument();
    expect(screen.getByText('ISBN を入力すると調べられます。')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'ISBN' })).toBeInTheDocument();
  });

  it('不正な ISBN は送信せずにメッセージを出す', async () => {
    const { user, repository } = renderSection(async () => result());

    await submit(user, '9784003101019');

    expect(await screen.findByText('ISBN-13 のチェックディジットが正しくありません')).toBeInTheDocument();
    expect(repository.calls).toEqual([]);
  });

  it('ISBN（ハイフン付き可）を送り、館ごとの状態・カーリルへのリンク・予約リンクを表示する', async () => {
    const { user, repository } = renderSection(async () => result());

    await submit(user, '978-4-00-310101-8');

    const list = await screen.findByRole('list', { name: '調べた結果' });
    expect(repository.calls).toEqual([{ isbn: ISBN, pref: '滋賀県', city: '野洲市' }]);
    // 図書館名はカーリルの図書館ページへのリンク（API 利用規約のクレジット表示、#156）。
    expect(within(list).getByRole('link', { name: '野洲市野洲図書館' })).toHaveAttribute(
      'href',
      `https://calil.jp/library/103/${encodeURIComponent('野洲市野洲図書館')}`,
    );
    expect(within(list).getByText('貸出可能')).toBeInTheDocument();
    expect(within(list).getByText('貸出中')).toBeInTheDocument();
    expect(within(list).getByText('蔵書なし')).toBeInTheDocument();
    // 予約リンクは予約できる状態の館だけ。
    expect(within(list).getAllByRole('link', { name: /予約する/ })).toHaveLength(2);
    expect(trackTrialCheckSubmit).toHaveBeenCalledOnce();
    expect(trackTrialCheckResult).toHaveBeenCalledWith('found', {
      searchedLibraryCount: 3,
      holdingLibraryCount: 2,
      availableLibraryCount: 1,
    });
  });

  it('結果の下に、図書館の登録への誘導を出す', async () => {
    const { user } = renderSection(async () => result());

    await submit(user, ISBN);

    expect(await screen.findByRole('link', { name: '下の一覧から図書館を登録する' })).toHaveAttribute(
      'href',
      '#register-libraries',
    );
  });

  it('対象外の館数・確認中の館を伝える', async () => {
    const { user } = renderSection(async () =>
      result({
        complete: false,
        omittedLibraryCount: 4,
        libraries: [library({ name: 'A館', checking: true, status: AvailabilityStatus.unknown })],
      }),
    );

    await submit(user, ISBN);

    expect(await screen.findByText('確認中')).toBeInTheDocument();
    expect(screen.getByText(/ほか4館は、図書館を登録すると調べられます/)).toBeInTheDocument();
    expect(screen.getByText(/まだ確認中の図書館があります/)).toBeInTheDocument();
  });

  it('どの館にも蔵書が無ければ not_found として計測する', async () => {
    const { user } = renderSection(async () => result({ libraries: [library({ name: 'A館' })] }));

    await submit(user, ISBN);

    await screen.findByRole('list', { name: '調べた結果' });
    expect(trackTrialCheckResult).toHaveBeenCalledWith('not_found', expect.anything());
  });

  it('体験版全体の上限: 混雑の案内とログインの導線を出す（エラー扱いにしない）', async () => {
    const { user } = renderSection(async () => {
      throw new TrialRateLimitedError('global', 1200);
    });

    await submit(user, ISBN);

    expect(await screen.findByText(/体験版は混み合っています/)).toBeInTheDocument();
    expect(screen.getByText(/ログインして図書館を登録すると、回数の制限なく調べられます/)).toBeInTheDocument();
    expect(trackTrialCheckResult).toHaveBeenCalledWith('rate_limited');
  });

  it('接続元の上限: 回数の上限を案内する', async () => {
    const { user } = renderSection(async () => {
      throw new TrialRateLimitedError('ip', 600);
    });

    await submit(user, ISBN);

    expect(await screen.findByText(/体験版は1時間に5回まで使えます/)).toBeInTheDocument();
  });

  it('その他の失敗: 時間をおいて試すよう案内する', async () => {
    const { user } = renderSection(async () => {
      throw new Error('HTTP 502');
    });

    await submit(user, ISBN);

    expect(await screen.findByText(/調べられませんでした/)).toBeInTheDocument();
    expect(trackTrialCheckResult).toHaveBeenCalledWith('error');
  });
});
