"use client";
import { SessionProvider } from "next-auth/react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0F62FE" },
    secondary: { main: "#10B981" },
    text: { primary: "#212529" },
    background: { default: "#F5F7FA" },
  },
  typography: {
    fontFamily: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"].join(","),
    h5: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },
});

export default function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}


