/**
 * オフライン中にスキャンして保留中の1件（#144）。
 *
 * 蔵書検索が実行できるようになるまで ISBN を端末ローカルに貯めるための
 * 一時データ。検索が完了した時点でキューから削除され、結果は検索履歴
 * （SearchHistoryEntry）側に残る。
 */
export interface PendingScan {
  isbn: string;
  scannedAt: Date;
}

export function pendingScanFromJson(
  json: Record<string, unknown>,
): PendingScan {
  const isbn = json['isbn'];
  if (typeof isbn !== 'string') {
    throw new Error('PendingScan.fromJson: missing or invalid "isbn"');
  }
  const scannedAt = json['scannedAt'];
  if (typeof scannedAt !== 'string') {
    throw new Error('PendingScan.fromJson: missing or invalid "scannedAt"');
  }
  return {
    isbn,
    scannedAt: new Date(scannedAt),
  };
}

export function pendingScanToJson(scan: PendingScan): Record<string, unknown> {
  return {
    isbn: scan.isbn,
    scannedAt: scan.scannedAt.toISOString(),
  };
}
