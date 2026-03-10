import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    // Lire le manifest.json depuis le dossier public
    const manifestPath = join(process.cwd(), "public", "manifest.json");
    const manifestBuffer = await readFile(manifestPath);
    
    return new NextResponse(manifestBuffer, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
