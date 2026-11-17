import { NextResponse } from "next/server";
import { toggleConfirmation } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.slice(0, 64) : "";
  if (!deviceId) return NextResponse.json({ error: "Falta el dispositivo" }, { status: 400 });
  const report = await toggleConfirmation(id, deviceId);
  if (!report) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  return NextResponse.json(report);
}
