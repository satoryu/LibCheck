import {
  type PendingScan,
  pendingScanFromJson,
  pendingScanToJson,
} from '@/domain/models/pendingScan';
import type { LocalStorageRepository } from '@/domain/repositories/localStorageRepository';
import type { PendingScanRepository } from '@/domain/repositories/pendingScanRepository';

const STORAGE_KEY = 'pending_scans';

export class PendingScanRepositoryImpl implements PendingScanRepository {
  private readonly localStorage: LocalStorageRepository;

  constructor(localStorage: LocalStorageRepository) {
    this.localStorage = localStorage;
  }

  async getAll(): Promise<PendingScan[]> {
    const scans = await this.getAllRaw();
    scans.sort((a, b) => a.scannedAt.getTime() - b.scannedAt.getTime());
    return scans;
  }

  async add(scan: PendingScan): Promise<PendingScan[]> {
    const scans = await this.getAll();
    // 同一 ISBN の2度読みは初回の読取時刻を維持する（FR-3）。
    if (scans.some((s) => s.isbn === scan.isbn)) {
      return scans;
    }
    scans.push(scan);
    scans.sort((a, b) => a.scannedAt.getTime() - b.scannedAt.getTime());
    await this.saveAll(scans);
    return scans;
  }

  async remove(isbn: string): Promise<PendingScan[]> {
    const scans = await this.getAll();
    const filtered = scans.filter((s) => s.isbn !== isbn);
    if (filtered.length !== scans.length) {
      await this.saveAll(filtered);
    }
    return filtered;
  }

  private async getAllRaw(): Promise<PendingScan[]> {
    const jsonString = await this.localStorage.getString(STORAGE_KEY);
    if (jsonString === null) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];

    // 壊れた1エントリで全キューを失わないよう、エントリ単位で変換を試みる
    // （SearchHistoryRepositoryImpl と同じ方針）。
    const scans: PendingScan[] = [];
    for (const s of parsed) {
      try {
        scans.push(pendingScanFromJson(s as Record<string, unknown>));
      } catch {
        // 破損エントリはスキップ。
      }
    }
    return scans;
  }

  private async saveAll(scans: PendingScan[]): Promise<void> {
    const jsonList = scans.map((s) => pendingScanToJson(s));
    await this.localStorage.setString(STORAGE_KEY, JSON.stringify(jsonList));
  }
}
