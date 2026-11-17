export type ZoneId =
  | "ascensor"
  | "agua"
  | "luz"
  | "comunes"
  | "parqueadero"
  | "porteria"
  | "fachada"
  | "otro";

export const ZONES: { id: ZoneId; label: string }[] = [
  { id: "ascensor", label: "Ascensor" },
  { id: "agua", label: "Agua" },
  { id: "luz", label: "Luz" },
  { id: "comunes", label: "Zonas comunes" },
  { id: "parqueadero", label: "Parqueadero" },
  { id: "porteria", label: "Portería" },
  { id: "fachada", label: "Fachada" },
  { id: "otro", label: "Otro" },
];

export type Status = "pendiente" | "en_arreglo" | "resuelto";

export const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  en_arreglo: "En arreglo",
  resuelto: "Resuelto",
};

export type Report = {
  id: string; // CV-261117-K3P9
  zone: ZoneId;
  title: string;
  description: string;
  photo: string | null; // URL
  author: { name: string; unit: string };
  authorDevice?: string;
  createdAt: number;
  status: Status;
  confirmations: string[]; // device ids
};

export type Me = { deviceId: string; name: string; unit: string };

const KEY_ME = "convibe.me.v1";

export function zoneLabel(id: ZoneId) {
  return ZONES.find((z) => z.id === id)?.label ?? "Otro";
}

export function loadMe(): Me {
  try {
    const raw = localStorage.getItem(KEY_ME);
    if (raw) return JSON.parse(raw);
  } catch {}
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const me: Me = { deviceId: id, name: "", unit: "" };
  saveMe(me);
  return me;
}

export function saveMe(me: Me) {
  try {
    localStorage.setItem(KEY_ME, JSON.stringify(me));
  } catch {}
}

export function timeAgo(ts: number, now = Date.now()) {
  const min = Math.round((now - ts) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

/* ---------- API client ---------- */

export async function apiList(): Promise<Report[]> {
  const res = await fetch("/api/reports", { cache: "no-store" });
  if (!res.ok) throw new Error("list");
  return res.json();
}

export async function apiCreate(body: {
  zone: ZoneId;
  title: string;
  description: string;
  photo: string | null;
  author: { name: string; unit: string };
  deviceId: string;
}): Promise<Report> {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "No se pudo enviar");
  return res.json();
}

export async function apiConfirm(id: string, deviceId: string): Promise<Report> {
  const res = await fetch(`/api/reports/${encodeURIComponent(id)}/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) throw new Error("confirm");
  return res.json();
}

/** Resize a photo to max 1000px and JPEG-encode it. */
export function compressPhoto(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = reject;
    img.src = url;
  });
}
