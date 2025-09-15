"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Stack, TextField, MenuItem, Typography, Skeleton, Card, CardContent, useMediaQuery, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

type NoteRow = {
  id: string;
  createdAt: string; // TR okunur
  createdAtIso?: string; // ISO
  company: string;
  contact?: string;
  result: string;
  reminderAt?: string | null;
  rawNote: string;
  summary: string;
  address: string;
  cityDistrict: string;
};

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tüm hook'ları en üstte tanımla
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [editRow, setEditRow] = useState<NoteRow | null>(null);
  const [editResult, setEditResult] = useState<string>("");
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "createdAt", headerName: "Görüşme Tarihi", flex: 1 },
      { field: "company", headerName: "Firma Adı", flex: 1 },
      { field: "contact", headerName: "Görüşülen Kişi", flex: 1 },
      {
        field: "result",
        headerName: "Görüşme Sonucu",
        flex: 1,
        renderCell: (params) => {
          const val = String(params.value || "");
          const color: "success" | "warning" | "error" = val === "Olumlu" ? "success" : val === "Sonraya Randevu" ? "warning" : "error";
          return <Chip size="small" color={color} label={val} />;
        },
      },
      { field: "reminderAt", headerName: "Hatırlatma", flex: 1 },
      { field: "summary", headerName: "Özet", flex: 2 },
      { field: "address", headerName: "Adres", flex: 2 },
      { field: "cityDistrict", headerName: "İl / İlçe", flex: 1 },
    ],
    []
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (resultFilter) params.set("result", resultFilter);
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.items);
      }
      setLoading(false);
    })();
  }, [query, resultFilter, startDate, endDate]);

  if (status === "loading") {
    return <div>Yükleniyor...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <Stack p={3} spacing={2}>
      <Typography variant="h5">Notlar</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <TextField label="Firma Adı" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth inputProps={{ "aria-label": "Firma Adı ara" }} />
        <TextField select label="Görüşme Sonucu" value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} fullWidth SelectProps={{ displayEmpty: true }} FormHelperTextProps={{ sx: { margin: 0 } }}>
          <MenuItem value="">Hepsi</MenuItem>
          <MenuItem value="Olumlu">Olumlu</MenuItem>
          <MenuItem value="Olumsuz">Olumsuz</MenuItem>
          <MenuItem value="Sonraya Randevu">Sonraya Randevu</MenuItem>
        </TextField>
        <TextField type="date" label="Başlangıç" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth inputProps={{ "aria-label": "Başlangıç tarihi" }} />
        <TextField type="date" label="Bitiş" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth inputProps={{ "aria-label": "Bitiş tarihi" }} />
      </Box>
      {loading ? (
        <Stack spacing={1}>
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={48} />
        </Stack>
      ) : isSmall ? (
        <Stack spacing={2}>
          {rows.map((r) => (
            <Card key={r.id} component="article" aria-label={`Not ${r.company}`}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">{r.createdAt}</Typography>
                <Typography variant="h6">{r.company}</Typography>
                {r.contact && <Typography color="text.secondary">{r.contact}</Typography>}
                <Typography><strong>Sonuç:</strong> {r.result}</Typography>
                {r.reminderAt && <Typography><strong>Hatırlatma:</strong> {r.reminderAt}</Typography>}
                {r.summary && <Typography sx={{ mt: 1 }}>{r.summary}</Typography>}
                {r.address && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{r.address}</Typography>}
                {r.cityDistrict && <Typography variant="body2" color="text.secondary">{r.cityDistrict}</Typography>}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <div style={{ width: "100%", background: "#fff" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            onRowDoubleClick={(p) => {
              setEditRow(p.row as NoteRow);
              setEditResult((p.row as NoteRow).result);
            }}
          />
        </div>
      )}

      <Dialog open={!!editRow} onClose={() => setEditRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Notu Düzenle</DialogTitle>
        <DialogContent>
          <TextField select label="Görüşme Sonucu" value={editResult} onChange={(e) => setEditResult(e.target.value)} fullWidth sx={{ mt: 2 }}>
            <MenuItem value="Olumlu">Olumlu</MenuItem>
            <MenuItem value="Olumsuz">Olumsuz</MenuItem>
            <MenuItem value="Sonraya Randevu">Sonraya Randevu</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)}>İptal</Button>
          <Button variant="contained" onClick={async () => {
            if (!editRow) return;
            await fetch("/api/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheetRow: (editRow as NoteRow & { sheetRow: number }).sheetRow, result: editResult }) });
            setEditRow(null);
            // Refresh rows
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (resultFilter) params.set("result", resultFilter);
            if (startDate) params.set("start", startDate);
            if (endDate) params.set("end", endDate);
            const res = await fetch(`/api/notes?${params.toString()}`);
            if (res.ok) {
              const data = await res.json();
              setRows(data.items);
            }
          }}>Kaydet</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}


