import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 戻るナビゲーション用フック。
 *
 * 遷移履歴があれば前の画面へ戻り、URL直アクセスやリロード直後など
 * 履歴が無い場合はホームへフォールバックする。
 * 履歴の有無は react-router の data router が設定する
 * `window.history.state.idx`（初期エントリは 0）で判定する。
 */
export function useBackNavigation(): () => void {
  const navigate = useNavigate();

  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);
}
