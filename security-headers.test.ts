// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * public/_headers の主要セキュリティディレクティブが欠落・弱化しないことを守る
 * regression ガード（#87 M-2）。CSP の正否そのものはブラウザ確認で担保する。
 * （テスト本体を public/ に置くと dist へ公開されてしまうためリポジトリ直下に置く）
 */
const headers = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8');
// enforce / Report-Only どちらの段階でも CSP 本体を取得する。
const csp =
  /Content-Security-Policy(?:-Report-Only)?:\s*(.+)/.exec(headers)?.[1]?.trim() ??
  '';

describe('public/_headers', () => {
  it('クリックジャッキング/危険シンクを塞ぐ基本ヘッダがある', () => {
    expect(headers).toMatch(/X-Content-Type-Options:\s*nosniff/);
    expect(headers).toMatch(/Referrer-Policy:\s*strict-origin-when-cross-origin/);
    expect(headers).toMatch(/X-Frame-Options:\s*DENY/);
    expect(headers).toMatch(/Permissions-Policy:.*camera=\(self\)/);
  });

  it('CSP は enforce（Report-Only ではない）で配信する（#93）', () => {
    expect(headers).toMatch(/^\s*Content-Security-Policy:/m);
    expect(headers).not.toMatch(/Content-Security-Policy-Report-Only:/);
  });

  it('CSP に防御の要となるディレクティブを含む', () => {
    expect(csp).not.toBe('');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("default-src 'self'");
  });

  it('CSP の script-src にインライン許可を入れない', () => {
    const scriptSrc = /script-src([^;]*)/.exec(csp)?.[1] ?? '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('実依存（GIS / OpenBD）を許可している', () => {
    expect(csp).toMatch(/script-src[^;]*https:\/\/accounts\.google\.com\/gsi\/client/);
    expect(csp).toMatch(/frame-src[^;]*https:\/\/accounts\.google\.com\/gsi\//);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/api\.openbd\.jp/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/accounts\.google\.com\/gsi\//);
  });
});
