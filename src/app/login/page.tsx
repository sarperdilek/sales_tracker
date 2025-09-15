"use client";
import { signIn } from "next-auth/react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  if (session?.user?.email) {
    router.replace("/");
  }
  return (
    <Container maxWidth="sm" style={{ display: "flex", minHeight: "100vh", alignItems: "center" }}>
      <Box width="100%" textAlign="center">
        <Typography variant="h4" gutterBottom>
          Giriş Yap
        </Typography>
        <Typography color="text.secondary" paragraph>
          Google ile hızlıca giriş yapın.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => signIn("google")}>Google ile Giriş Yap</Button>
      </Box>
    </Container>
  );
}


