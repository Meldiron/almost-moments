import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import sharp from "sharp";
import { encode } from "blurhash";
import { tablesDB, storage, Query } from "@/lib/appwrite-server";
import { galleryIdParamsSchema, filesBodySchema } from "@/lib/api-schemas";
import type { Galleries } from "@/lib/generated/appwrite";

const MAX_FILES = 1000;
const BLURHASH_WIDTH = 32;
const BLURHASH_COMPONENTS_X = 4;
const BLURHASH_COMPONENTS_Y = 3;

async function generateBlurhash(buffer: ArrayBuffer): Promise<string> {
  const { data, info } = await sharp(Buffer.from(buffer))
    .resize(BLURHASH_WIDTH, undefined, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    BLURHASH_COMPONENTS_X,
    BLURHASH_COMPONENTS_Y,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  // 1. Validate galleryId
  const paramsParsed = galleryIdParamsSchema.safeParse(await params);
  if (!paramsParsed.success) {
    return NextResponse.json(
      {
        error: "Invalid gallery ID format.",
        issues: paramsParsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { galleryId } = paramsParsed.data;

  // 2. Get gallery document
  let gallery: Galleries;
  try {
    gallery = await tablesDB.getRow<Galleries>({
      databaseId: "main",
      tableId: "galleries",
      rowId: galleryId,
    });
  } catch {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }

  // 3. Ensure gallery hasn't expired
  if (gallery.expiryAt && new Date(gallery.expiryAt) < new Date()) {
    return NextResponse.json(
      { error: "Gallery has expired." },
      { status: 410 },
    );
  }

  // 4. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bodyParsed = filesBodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: bodyParsed.error.issues },
      { status: 400 },
    );
  }

  const { files: fileIds } = bodyParsed.data;

  // 5. Deduplicate file IDs
  const uniqueFileIds = [...new Set(fileIds)];

  // 6. Ensure all files exist in storage
  const { files: existingFiles } = await storage.listFiles({
    bucketId: "assets",
    queries: [Query.equal("$id", uniqueFileIds), Query.limit(MAX_FILES)],
  });

  const existingIds = new Set(existingFiles.map((f) => f.$id));
  const missingIds = uniqueFileIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: "Some file IDs were not found.", missingIds },
      { status: 404 },
    );
  }

  // 7. Generate blurhash for each file
  const blurhashes = new Map<string, string>();
  await Promise.all(
    uniqueFileIds.map(async (fileId) => {
      try {
        const buffer = await storage.getFileDownload({
          bucketId: "assets",
          fileId,
        });
        const hash = await generateBlurhash(buffer);
        blurhashes.set(fileId, hash);
      } catch {
        // Use a minimal fallback blurhash if generation fails (e.g. for videos)
        blurhashes.set(fileId, "LEHV6nWB2yk8pyo0adR*.7kCMdnj");
      }
    }),
  );

  // 8. Create gallery-asset rows in chunks of 100
  const CHUNK_SIZE = 100;
  const rows = uniqueFileIds.map((fileId) => ({
    $id: ID.unique(),
    fileId,
    blurhash: blurhashes.get(fileId)!,
    galleryId: galleryId,
  }));

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await tablesDB.createRows({
      databaseId: "main",
      tableId: "gallery-assets",
      rows: chunk,
    });
  }

  await tablesDB.incrementRowColumn({
    databaseId: "main",
    tableId: "galleries",
    rowId: galleryId,
    column: "totalAssets",
    value: uniqueFileIds.length,
  });

  return NextResponse.json({ created: uniqueFileIds.length }, { status: 201 });
}
