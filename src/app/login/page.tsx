"use client";
import { signIn, useSession } from "next-auth/react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      router.replace("/");
    }
  }, [status, session, router]);
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


