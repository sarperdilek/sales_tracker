"use client";
import { signIn } from "next-auth/react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";

export default function LoginPage() {
  // URL'de kalan callbackUrl parametresini temizle
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("callbackUrl")) {
      url.searchParams.delete("callbackUrl");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return (
    <Container maxWidth="sm" style={{ display: "flex", minHeight: "100vh", alignItems: "center" }}>
      <Box width="100%" textAlign="center">
        <Typography variant="h4" gutterBottom>
          Giriş Yap
        </Typography>
        <Typography color="text.secondary" paragraph>
          Google ile hızlıca giriş yapın.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => signIn("google", { callbackUrl: "/" })}>Google ile Giriş Yap</Button>
      </Box>
    </Container>
  );
}


