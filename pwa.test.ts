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
const mainTsx = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');

describe('PWA 設定', () => {
  it('manifest は standalone・テーマ色・192/512/maskable アイコンを持つ', () => {
    expect(viteConfig).toContain('display: "standalone"');
    expect(viteConfig).toContain('theme_color: "#00796B"');
    expect(viteConfig).toContain('pwa-192x192.png');
    expect(viteConfig).toContain('pwa-512x512.png');
    expect(viteConfig).toContain('purpose: "maskable"');
  });

  it('SW は /api をナビゲーションフォールバックから除外する', () => {
    expect(viteConfig).toMatch(/navigateFallbackDenylist:\s*\[\/\^\\\/api\\\//);
  });

  it('登録図書館・検索履歴の GET はオフライン閲覧用に NetworkFirst でキャッシュし、Calil は対象外にする（#143）', () => {
    // runtimeCaching は workbox 設定内（manifest 設定より前）にあるはず。
    const runtimeCachingIndex = viteConfig.indexOf('runtimeCaching');
    const manifestIndex = viteConfig.indexOf('manifest: {');
    expect(runtimeCachingIndex).toBeGreaterThan(-1);
    expect(manifestIndex).toBeGreaterThan(runtimeCachingIndex);
    const runtimeCachingBlock = viteConfig.slice(
      runtimeCachingIndex,
      manifestIndex,
    );
    expect(runtimeCachingBlock).toContain('"NetworkFirst"');
    expect(runtimeCachingBlock).toContain('/api/registered-libraries');
    expect(runtimeCachingBlock).toContain('/api/search-history');
    // Calil（蔵書状況）はリアルタイム性が命なのでキャッシュ対象に含めない。
    expect(runtimeCachingBlock).not.toContain('calil');
  });

  it('SW 登録はプラグインに自動注入させず、アプリ（main.tsx）から catch 付きで行う（#176）', () => {
    // 生成される registerSW.js は register() の reject を catch せず、
    // 未処理 rejection として Sentry に送られていた（LIBCHECK-4/8/9）。
    expect(viteConfig).toContain('injectRegister: false');
    expect(viteConfig).toContain('registerType: "autoUpdate"');
    expect(mainTsx).toContain('registerServiceWorker()');
  });

  it('SW 登録は本番ビルドでのみ行う（dev は SW を生成しないため。#176）', () => {
    expect(viteConfig).toContain('devOptions: { enabled: false }');
    expect(mainTsx).toMatch(
      /if \(import\.meta\.env\.PROD\) \{\s*registerServiceWorker\(\);\s*\}/,
    );
  });

  it('新 SW が即 activate する（skipWaiting/clientsClaim。無いと更新が永遠に届かない）', () => {
    expect(viteConfig).toContain('skipWaiting: true');
    expect(viteConfig).toContain('clientsClaim: true');
  });

  it('PWA アイコン素材が public に存在する', () => {
    for (const f of ['pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png', 'apple-touch-icon.png']) {
      expect(existsSync(resolve(process.cwd(), 'public', f)), f).toBe(true);
    }
  });
});
