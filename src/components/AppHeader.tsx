"use client";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
// removed unused Stack import
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AppHeader() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user?.email;

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
        <Button component={Link} href="/" color="inherit" sx={{ textTransform: "none", paddingLeft: 0 }}>
          <Typography variant="h6" color="inherit">Smart Sales Dashboard</Typography>
        </Button>
        {/* Header sade: yalnızca giriş/çıkış kontrolü */}
        {isAuthed ? (
          <Button onClick={() => signOut({ callbackUrl: "/login" })} color="inherit">Çıkış</Button>
        ) : (
          <Button onClick={() => signIn("google")} color="inherit">Giriş</Button>
        )}
      </Toolbar>
    </AppBar>
  );
}


