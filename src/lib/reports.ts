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
  { id: "comunes", label: "Áreas comunes" },
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
  id: string; // RF-251117-K3P9
  zone: ZoneId;
  title: string;
  description: string;
  photo: string | null; // compressed data URL
  author: { name: string; unit: string };
  createdAt: number;
  status: Status;
  confirmations: string[]; // device ids
};

export type Me = { deviceId: string; name: string; unit: string };

const KEY_REPORTS = "rf.reports.v1";
const KEY_ME = "rf.me.v1";

export function zoneLabel(id: ZoneId) {
  return ZONES.find((z) => z.id === id)?.label ?? "Otro";
}

export function newReportId(date = new Date()) {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => alphabet[b % alphabet.length]).join("");
  return `RF-${y}${m}${d}-${rand}`;
}

function fakeIds(n: number) {
  return Array.from({ length: n }, (_, i) => `seed-${i}`);
}

function seed(): Report[] {
  const now = Date.now();
  return [
    {
      id: newReportId(new Date(now - 12 * 60e3)),
      zone: "ascensor",
      title: "El ascensor se queda atascado",
      description: "Se detiene unos segundos entre el tercer y cuarto piso.",
      photo: null,
      author: { name: "María G.", unit: "Piso 4" },
      createdAt: now - 12 * 60e3,
      status: "pendiente",
      confirmations: fakeIds(8),
    },
    {
      id: newReportId(new Date(now - 40 * 60e3)),
      zone: "agua",
      title: "Fuga de agua en el pasillo",
      description: "Hay agua acumulada cerca de la escalera principal.",
      photo: null,
      author: { name: "Carlos R.", unit: "Piso 2" },
      createdAt: now - 40 * 60e3,
      status: "en_arreglo",
      confirmations: fakeIds(5),
    },
    {
      id: newReportId(new Date(now - 26 * 3600e3)),
      zone: "luz",
      title: "Luz del pasillo no funciona",
      description: "El pasillo del sexto piso está completamente oscuro.",
      photo: null,
      author: { name: "Lucía P.", unit: "Piso 6" },
      createdAt: now - 26 * 3600e3,
      status: "pendiente",
      confirmations: fakeIds(3),
    },
  ];
}

export function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(KEY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s = seed();
  saveReports(s);
  return s;
}

export function saveReports(reports: Report[]) {
  try {
    localStorage.setItem(KEY_REPORTS, JSON.stringify(reports));
  } catch {
    // Storage full (photos): drop photos from oldest reports and retry once.
    try {
      const slim = reports.map((r, i) => (i > 5 ? { ...r, photo: null } : r));
      localStorage.setItem(KEY_REPORTS, JSON.stringify(slim));
    } catch {}
  }
}

export function loadMe(): Me {
  try {
    const raw = localStorage.getItem(KEY_ME);
    if (raw) return JSON.parse(raw);
  } catch {}
  const me: Me = { deviceId: crypto.randomUUID(), name: "", unit: "" };
  saveMe(me);
  return me;
}

export function saveMe(me: Me) {
  try {
    localStorage.setItem(KEY_ME, JSON.stringify(me));
  } catch {}
}

export function timeAgo(ts: number) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

/** Resize a photo to max 900px and JPEG-encode it so it fits in storage. */
export function compressPhoto(file: File, max = 900): Promise<string> {
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
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = reject;
    img.src = url;
  });
}
