"use client";
import { useSession } from "next-auth/react";
import { Container, Grid, Card, CardActionArea, CardContent, Typography, CardHeader } from "@mui/material";
import Link from "next/link";
import useSWR from "swr";

export default function Home() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user?.email;
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data: stats } = useSWR(isAuthed ? "/api/notes?stats=1" : null, fetcher);

  return (
    <Container maxWidth="md" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <Typography variant="h5" gutterBottom>Smart Sales Dashboard</Typography>
      <Typography color="text.secondary" paragraph>
        Hızlı hareket etmek için aşağıdaki aksiyonlardan birini seçin.
      </Typography>
      <Grid container spacing={2}>
        {isAuthed && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Özet" />
              <CardContent>
                <Typography>Toplam Görüşme: {stats?.total ?? "-"}</Typography>
                <Typography>Başarılı Görüşme: {stats?.positive ?? "-"}</Typography>
                <Typography>Sonraya Randevu: {stats?.later ?? "-"}</Typography>
                <Typography>Başarı Oranı: {stats?.rate != null ? `${Math.round(stats.rate * 100)}%` : "-"}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea component={Link} href="/new-note" disabled={!isAuthed}>
              <CardContent>
                <Typography variant="h6">Yeni Not</Typography>
                <Typography color="text.secondary">Görüşme notu ekleyin ve takvime alın.</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea component={Link} href="/notes" disabled={!isAuthed}>
              <CardContent>
                <Typography variant="h6">Notlar</Typography>
                <Typography color="text.secondary">Kayıtları filtreleyin, arayın ve inceleyin.</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
      {!isAuthed && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>Devam etmek için giriş yapın.</Typography>
      )}
    </Container>
  );
}
