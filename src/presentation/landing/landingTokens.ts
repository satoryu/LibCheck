/**
 * ランディングページ専用のデザイントークン（"Knowledge Cartography"）。
 *
 * アプリ本体は素の MUI テーマだが、未ログイン時の LP は独自の世界観を持たせる。
 * フォントはすべて system フォント（明朝・モノ）で self-host 不要 ＝ 追加読み込み
 * なし・CSP（font-src 'self'）も変更不要。
 */
export const LANDING_COLORS = {
  /** 深い緑青（土台・濃色面）。 */
  verdigris: '#0E3B36',
  /** ブランドのティール。 */
  teal: '#00796B',
  /** 羊皮紙（背景）。 */
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
export const LANDING_SERIF =
  "'Hiragino Mincho ProN','Yu Mincho','YuMincho','Noto Serif JP',serif";

/** 請求記号 / ISBN ラベル用のモノスペース system フォントスタック。 */
export const LANDING_MONO =
  "'SFMono-Regular','Menlo','Consolas','BIZ UDGothic',monospace";
