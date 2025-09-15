import { createEvent } from "ics";

export function createIcsContent({ title, description, startIso, durationMinutes }: { title: string; description?: string; startIso: string; durationMinutes?: number; }) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + (durationMinutes ?? 30) * 60 * 1000);
  const toArray = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()] as [number, number, number, number, number];

  const { error, value } = createEvent({
    title,
    description,
    start: toArray(start),
    end: toArray(end),
  });
  if (error) throw error;
  return value;
}

export function buildGoogleCalendarLink({ title, details, startIso, durationMinutes }: { title: string; details?: string; startIso: string; durationMinutes?: number; }) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + (durationMinutes ?? 30) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details || "",
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}


