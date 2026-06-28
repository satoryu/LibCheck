import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#00796B",
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
  },
});
