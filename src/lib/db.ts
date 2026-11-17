import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Report, ZoneId } from "@/lib/reports";

/**
 * Tiny file-backed store. Photos are stored inline (compressed data URLs).
 * - Local: ./data/db.json, survives restarts.
 * - Vercel: the project dir is read-only, so it lives in /tmp. It survives while
 *   the function instance stays warm and resets to the seed on a cold start.
 */
const DIR = process.env.VERCEL ? "/tmp/convibe" : path.join(process.cwd(), "data");
const DB = path.join(DIR, "db.json");

type Row = Report;

let queue: Promise<unknown> = Promise.resolve();
/** Serialize read-modify-write so concurrent taps never lose a confirmation. */
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function read(): Promise<Row[]> {
  try {
    return JSON.parse(await fs.readFile(DB, "utf8"));
  } catch {
    const rows = seed();
    await write(rows);
    return rows;
  }
}

async function write(rows: Row[]) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = DB + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
  await fs.rename(tmp, DB);
}

function toClient(r: Row): Report {
  return r;
}

export function newReportId(date = new Date()) {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("");
  return `CV-${y}${m}${d}-${rand}`;
}

export async function listReports(): Promise<Report[]> {
  const rows = await locked(read);
  return rows.sort((a, b) => b.createdAt - a.createdAt).map(toClient);
}

export type NewReport = {
  zone: ZoneId;
  title: string;
  description: string;
  photo: string | null; // data URL
  author: { name: string; unit: string };
  deviceId: string;
};

export async function createReport(input: NewReport): Promise<Report> {
  const now = new Date();
  const id = newReportId(now);
  const photo = input.photo?.startsWith("data:image/jpeg;base64,") ? input.photo : null;
  const row: Row = {
    id,
    zone: input.zone,
    title: input.title,
    description: input.description,
    photo,
    author: input.author,
    authorDevice: input.deviceId,
    createdAt: now.getTime(),
    status: "pendiente",
    confirmations: [],
  };
  await locked(async () => {
    const rows = await read();
    rows.push(row);
    await write(rows);
  });
  return toClient(row);
}

export async function toggleConfirmation(id: string, deviceId: string): Promise<Report | null> {
  return locked(async () => {
    const rows = await read();
    const r = rows.find((x) => x.id === id);
    if (!r) return null;
    if (r.authorDevice === deviceId) return toClient(r);
    r.confirmations = r.confirmations.includes(deviceId)
      ? r.confirmations.filter((c) => c !== deviceId)
      : [...r.confirmations, deviceId];
    await write(rows);
    return toClient(r);
  });
}

function seed(): Row[] {
  const now = Date.now();
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `seed-${i}`);
  const mk = (ago: number, rest: Omit<Row, "id" | "createdAt" | "photo" | "authorDevice">): Row => ({
    id: newReportId(new Date(now - ago)),
    createdAt: now - ago,
    photo: null,
    authorDevice: "seed",
    ...rest,
  });
  return [
    mk(12 * 60e3, {
      zone: "ascensor",
      title: "El ascensor se queda atascado",
      description: "Se detiene unos segundos entre el tercer y cuarto piso.",
      author: { name: "María G.", unit: "Piso 4" },
      status: "pendiente",
      confirmations: ids(8),
    }),
    mk(40 * 60e3, {
      zone: "agua",
      title: "Fuga de agua en el pasillo",
      description: "Hay agua acumulada cerca de la escalera principal.",
      author: { name: "Carlos R.", unit: "Piso 2" },
      status: "en_arreglo",
      confirmations: ids(5),
    }),
    mk(26 * 3600e3, {
      zone: "luz",
      title: "Luz del pasillo no funciona",
      description: "El pasillo del sexto piso está completamente oscuro.",
      author: { name: "Lucía P.", unit: "Piso 6" },
      status: "pendiente",
      confirmations: ids(3),
    }),
  ];
}
