import { PendingScan } from '@/domain/models/pendingScan';

/**
 * オフライン中にスキャンした ISBN の保留キュー（#144）。
 *
 * 端末ローカル専用の一時データであり、サーバ（D1）には永続化しない。
 * 各メソッドは「更新後の全リスト」を返す（#100 P2-6 と同じ契約。
 * 呼び出し側が再取得なしにキャッシュを更新できる）。
 */
export interface PendingScanRepository {
  /** 全保留スキャン（読取順 = scannedAt 昇順）。 */
  getAll(): Promise<PendingScan[]>;
  /** 追加し、更新後リストを返す。同一 ISBN が既にあれば既存を維持する。 */
  add(scan: PendingScan): Promise<PendingScan[]>;
  /** 削除し、更新後リストを返す。 */
  remove(isbn: string): Promise<PendingScan[]>;
}
