import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    // En mode standalone, les fichiers sont dans .next/standalone/.next/static/
    const filePath = join(process.cwd(), ".next/standalone/.next/static", ...params.path);
    
    // Vérifier que le fichier est dans le bon dossier
    if (!filePath.startsWith(join(process.cwd(), ".next/standalone/.next/static"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fileBuffer = await readFile(filePath);

    // Déterminer le type MIME
    const extension = params.path[params.path.length - 1]?.split(".").pop();
    let contentType = "application/octet-stream";

    if (extension === "js") {
      contentType = "application/javascript";
    } else if (extension === "css") {
      contentType = "text/css";
    } else if (extension === "json") {
      contentType = "application/json";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
