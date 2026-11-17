import { promises as fs } from "node:fs";
import path from "node:path";
import { PHOTOS } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[A-Z0-9-]+\.jpg$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(PHOTOS, name));
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
