// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * PWA 設定の回帰ガード（#72）。manifest が standalone で必須アイコンを持ち、
 * SW が /api（個人データ）を precache しないことを vite.config から確認する。
 * 生成物（dist/sw.js）はビルド後のみ存在するため、設定ソースを検証する。
 */
const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

describe('PWA 設定', () => {
  it('manifest は standalone・テーマ色・192/512/maskable アイコンを持つ', () => {
    expect(viteConfig).toContain('display: "standalone"');
    expect(viteConfig).toContain('theme_color: "#00796B"');
    expect(viteConfig).toContain('pwa-192x192.png');
    expect(viteConfig).toContain('pwa-512x512.png');
    expect(viteConfig).toContain('purpose: "maskable"');
  });

  it('SW は /api をナビゲーションフォールバックから除外し、ランタイムキャッシュを定義しない', () => {
    expect(viteConfig).toMatch(/navigateFallbackDenylist:\s*\[\/\^\\\/api\\\//);
    expect(viteConfig).not.toContain('runtimeCaching');
  });

  it('SW 登録は外部スクリプト（CSP script-src self 適合・inline 不使用）', () => {
    expect(viteConfig).toContain('injectRegister: "script"');
    expect(viteConfig).toContain('registerType: "autoUpdate"');
  });

  it('PWA アイコン素材が public に存在する', () => {
    for (const f of ['pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png', 'apple-touch-icon.png']) {
      expect(existsSync(resolve(process.cwd(), 'public', f)), f).toBe(true);
    }
  });
});
