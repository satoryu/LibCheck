import { createTheme } from "@mui/material/styles";

import {
  KC_COLORS,
  KC_SERIF,
} from "@/presentation/theme/tokens";

// 見出し（明朝）の共通スタイル。本文は BIZ UDGothic のまま、見出しだけ
// 書物の品位を持たせる（Knowledge Cartography。#138）。
const serifHeading = {
  fontFamily: KC_SERIF,
  fontWeight: 600,
} as const;

export const theme = createTheme({
  palette: {
    primary: {
      main: KC_COLORS.teal,
    },
    background: {
      // 羊皮紙の地にカード面が浮かぶ、LP（#113）と同じ佇まい。
      default: KC_COLORS.parchment,
      paper: KC_COLORS.card,
    },
    text: {
      primary: KC_COLORS.ink,
      secondary: KC_COLORS.inkSoft,
    },
    // 蔵書状況バッジ等で使う状態色。MUI 既定とほぼ同値だが、従来 APP_COLORS で
    // 持っていた値を明示してテーマに一本化する（#95 P1-3）。「非アクティブ」色は
    // grey[500](=#9E9E9E) を用いる。
    success: {
      main: "#2E7D32",
    },
    warning: {
      main: "#EF6C00",
    },
    error: {
      main: "#D32F2F",
    },
  },
  typography: {
    fontFamily: [
      '"BIZ UDGothic"',
      "BIZUDGothic",
      '"Hiragino Sans"',
      '"Noto Sans JP"',
      "sans-serif",
    ].join(", "),
    h5: serifHeading,
    h6: serifHeading,
    subtitle1: serifHeading,
  },
  components: {
    // 上部バーは LP フッターと同じ深い緑青の帯（#138）。
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: KC_COLORS.verdigris,
        },
      },
    },
    // カードは真鍮の細罫＋控えめな影（LP のカードと同じ語彙）。
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${KC_COLORS.brass}55`,
          boxShadow: "0 8px 20px -16px rgba(14,59,54,0.4)",
        },
      },
    },
  },
});
