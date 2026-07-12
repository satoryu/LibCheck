/**
 * デザイントークン "Knowledge Cartography"（#138）。
 *
 * 由来はブランド哲学（screenshots/feature_graphic_philosophy.md）。LP（#113）で
 * 確立した値をアプリ全体の正本としてここに昇格した。フォントはすべて system
 * フォント（追加読み込みなし・CSP 変更不要）。
 */
export const KC_COLORS = {
  /** 深い緑青（AppBar・フッター等の濃色面）。 */
  verdigris: '#0E3B36',
  /** ブランドのティール（primary）。 */
  teal: '#00796B',
  /** 羊皮紙（アプリ背景）。 */
  parchment: '#F4F1E8',
  /** カード面（やや明るい羊皮紙）。 */
  card: '#FBF8F0',
  /** 真鍮（罫・ラベル等の細部）。 */
  brass: '#B8894B',
  /** スタンプの赤（唯一の大胆な差し色）。 */
  stampRed: '#C0392B',
  /** 本文（濃インク）。 */
  ink: '#23302D',
  /** 補助テキスト。 */
  inkSoft: '#5A6360',
} as const;

/** 見出し用の明朝系 system フォントスタック。 */
export const KC_SERIF =
  "'Hiragino Mincho ProN','Yu Mincho','YuMincho','Noto Serif JP',serif";

/** 請求記号 / ISBN ラベル用のモノスペース system フォントスタック。 */
export const KC_MONO =
  "'SFMono-Regular','Menlo','Consolas','BIZ UDGothic',monospace";
