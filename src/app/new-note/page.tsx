"use client";
import { useRef, useState } from "react";
import { Stack, TextField, Button, MenuItem, Grid, Typography, Snackbar, Alert, FormControlLabel, Switch, Link as MLink } from "@mui/material";
import Section from "@/components/Section";
// removed unused DateTime import

type ResultType = "Olumlu" | "Olumsuz" | "Sonraya Randevu";

export default function NewNotePage() {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<ResultType | "">("");
  const [reminderIso, setReminderIso] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [open, setOpen] = useState<{type: "success" | "error"; msg: string} | null>(null);
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);

  const canSubmit = company.trim().length > 0 && (!!result && (result !== "Sonraya Randevu" || !!reminderIso));

  // Basit Web Speech API entegrasyonu
  let recognition: SpeechRecognition | null = null;
  if (typeof window !== "undefined" && (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition) {
    const Ctor = (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
    recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "tr-TR";
  }

  const handleStartStop = () => {
    if (!recognition) return;
    if (!isRecording) {
      setIsRecording(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRawNote(prev => (prev ? prev + " " : "") + transcript);
      };
      recognition.onend = () => setIsRecording(false);
    } else {
      recognition.stop();
      setIsRecording(false);
    }
  };

  // Ham ses kaydı (MediaRecorder) - otomatik Drive yükleme
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      setIsRecordingAudio(true);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsRecordingAudio(false);
        // Otomatik Drive yükleme
        await uploadAudioToDrive(blob);
      };
      rec.start();
      mediaRecorderRef.current = rec;
    } catch (e) {
      setOpen({ type: "error", msg: "Mikrofon erişimi alınamadı" });
      setIsRecordingAudio(false);
    }
  };

  const stopAudioRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    mediaRecorderRef.current = null;
  };

  const uploadAudioToDrive = async (blob?: Blob) => {
    try {
      const audioToUpload = blob || audioBlob;
      if (!audioToUpload) return setOpen({ type: "error", msg: "Yüklenecek ses yok" });
      const arrayBuffer = await audioToUpload.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const fileName = `voice-note_${company || "firma"}_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, mimeType: "audio/webm", dataBase64: base64 }),
      });
      if (!res.ok) throw new Error("Drive yükleme hatası");
      const data = await res.json();
      setOpen({ type: "success", msg: "Ses kaydı Drive'a yüklendi" });
      if (data?.webViewLink) setAudioUrl(data.webViewLink);
    } catch (e: any) {
      setOpen({ type: "error", msg: e.message || "Yükleme hatası" });
    }
  };

  const onSubmit = async () => {
    try {
      // Konum al
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Geolocation desteklenmiyor"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });

      const payload = {
        company,
        contact,
        result,
        reminderIso: reminderIso || null,
        rawNote,
        coords: { lat: position.coords.latitude, lng: position.coords.longitude },
        addToCalendar,
      };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydetme sırasında hata oluştu");

      // Takvim entegrasyonu (opsiyonel)
      if (addToCalendar && reminderIso) {
        try {
          // Varsayılan olarak ICS indir
          const icsResp = await fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "ics", title: `Randevu: ${company}`, description: rawNote || "", startIso: reminderIso, durationMinutes: 30 }),
          });
          const blob = await icsResp.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "event.ics";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (e) {
          // Sessiz geç
        }
      }

      setOpen({ type: "success", msg: "Not başarıyla eklendi" });
      setCompany(""); setContact(""); setResult(""); setReminderIso(""); setRawNote(""); setAddToCalendar(false);
    } catch (e: any) {
      setOpen({ type: "error", msg: e.message || "Hata" });
    }
  };

  return (
    <Stack spacing={3} p={3}>
      <Typography variant="h5">Yeni Not Ekle</Typography>

      <Section title="Görüşme Bilgileri">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField required label="Firma Adı" fullWidth value={company} onChange={(e) => setCompany(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Görüşülen Kişi" fullWidth value={contact} onChange={(e) => setContact(e.target.value)} />
          </Grid>
        </Grid>
      </Section>

      <Section title="Sonuç ve Hatırlatma">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Görüşme Sonucu" fullWidth size="large" SelectProps={{ native: false }} value={result} onChange={(e) => setResult(e.target.value as ResultType)} helperText="Görüşmenin sonucunu seçin">
              {["Olumlu","Olumsuz","Sonraya Randevu"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </TextField>
          </Grid>
          {result === "Sonraya Randevu" && (
            <Grid item xs={12} sm={6}>
              <TextField type="datetime-local" label="Hatırlatma Tarihi" fullWidth size="medium" InputLabelProps={{ shrink: true }} value={reminderIso} onChange={(e) => setReminderIso(e.target.value)} helperText="Randevu tarihi ve saati" />
            </Grid>
          )}
          {result === "Sonraya Randevu" && (
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={addToCalendar} onChange={(e) => setAddToCalendar(e.target.checked)} />} label="Takvime ekle" />
            </Grid>
          )}
          {result === "Sonraya Randevu" && addToCalendar && reminderIso && (
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    const r = await fetch("/api/calendar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "ics", title: `Randevu: ${company}`, description: rawNote || "", startIso: reminderIso, durationMinutes: 30 }),
                    });
                    const blob = await r.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "event.ics";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  }}
                >.ics indir</Button>
                <Button
                  variant="text"
                  onClick={async () => {
                    const r = await fetch("/api/calendar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "google", title: `Randevu: ${company}`, description: rawNote || "", startIso: reminderIso, durationMinutes: 30 }),
                    });
                    const data = await r.json();
                    if (data?.url) window.open(data.url, "_blank");
                  }}
                >Google Calendar</Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Section>

      <Section title="Notlar">
        <Stack spacing={2}>
          <Button variant="outlined" onClick={handleStartStop} sx={{ alignSelf: "flex-start" }}>{isRecording ? "Kaydı Durdur" : "Kaydı Başlat"}</Button>
          <TextField label="Ham Not" fullWidth multiline minRows={6} value={rawNote} onChange={(e) => setRawNote(e.target.value)} />
        </Stack>
      </Section>

      <Section title="Ses Kaydı (Otomatik Drive Yükleme)">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Button variant="outlined" onClick={startAudioRecording} disabled={isRecordingAudio}>
            {isRecordingAudio ? "Kaydediliyor..." : "Ses Kaydı Başlat"}
          </Button>
          <Button variant="outlined" onClick={stopAudioRecording} disabled={!isRecordingAudio}>
            Ses Kaydı Durdur
          </Button>
          {audioUrl && (
            <MLink href={audioUrl} target="_blank" rel="noopener">Drive'da Görüntüle</MLink>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Ses kaydı otomatik olarak Google Drive'a yüklenir
        </Typography>
      </Section>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button variant="contained" disabled={!canSubmit} onClick={onSubmit}>Kaydet</Button>
      </Stack>

      <Snackbar open={!!open} autoHideDuration={3000} onClose={() => setOpen(null)}>
        {open && <Alert severity={open.type}>{open.msg}</Alert>}
      </Snackbar>
    </Stack>
  );
}


