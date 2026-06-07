import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#00796B",
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
