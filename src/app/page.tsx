"use client";
import { useSession } from "next-auth/react";
import { Container, Card, CardActionArea, CardContent, Typography, CardHeader, Box } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user?.email;
  const [stats, setStats] = useState<{ total: number; positive: number; later: number; rate: number } | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!isAuthed) return setStats(null);
      const res = await fetch("/api/notes?stats=1");
      if (res.ok) {
        const data = await res.json();
        if (active) setStats(data);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthed]);

  return (
    <Container maxWidth="md" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <Typography variant="h5" gutterBottom>Smart Sales Dashboard</Typography>
      <Typography color="text.secondary" paragraph>
        Hızlı hareket etmek için aşağıdaki aksiyonlardan birini seçin.
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        {isAuthed && (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Card>
              <CardHeader title="Özet" />
              <CardContent>
                <Typography>Toplam Görüşme: {stats?.total ?? "-"}</Typography>
                <Typography>Başarılı Görüşme: {stats?.positive ?? "-"}</Typography>
                <Typography>Sonraya Randevu: {stats?.later ?? "-"}</Typography>
                <Typography>Başarı Oranı: {stats?.rate != null ? `${Math.round(stats.rate * 100)}%` : "-"}</Typography>
              </CardContent>
            </Card>
          </Box>
        )}
        <Card>
          <CardActionArea component={Link} href="/new-note" disabled={!isAuthed}>
            <CardContent>
              <Typography variant="h6">Yeni Not</Typography>
              <Typography color="text.secondary">Görüşme notu ekleyin ve takvime alın.</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card>
          <CardActionArea component={Link} href="/notes" disabled={!isAuthed}>
            <CardContent>
              <Typography variant="h6">Notlar</Typography>
              <Typography color="text.secondary">Kayıtları filtreleyin, arayın ve inceleyin.</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
      {!isAuthed && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>Devam etmek için giriş yapın.</Typography>
      )}
    </Container>
  );
}
