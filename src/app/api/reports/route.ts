import { NextResponse, connection } from "next/server";
import { createReport, listReports } from "@/lib/db";
import { ZONES, type ZoneId } from "@/lib/reports";

export async function GET() {
  await connection();
  return NextResponse.json(await listReports(), { headers: { "cache-control": "no-store" } });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const zone = body.zone as ZoneId;
  const title = str(body.title, 70);
  const name = str(body.author?.name, 40);
  const unit = str(body.author?.unit, 20);
  const deviceId = str(body.deviceId, 64);
  if (!ZONES.some((z) => z.id === zone)) return NextResponse.json({ error: "Elige dónde está el daño" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Cuéntanos qué pasa" }, { status: 400 });
  if (!name || !unit) return NextResponse.json({ error: "Agrega tu nombre y piso" }, { status: 400 });
  const photo = typeof body.photo === "string" && body.photo.length < 1_500_000 ? body.photo : null;

  const report = await createReport({
    zone,
    title,
    description: str(body.description, 280),
    photo,
    author: { name, unit },
    deviceId,
  });
  return NextResponse.json(report, { status: 201 });
}
