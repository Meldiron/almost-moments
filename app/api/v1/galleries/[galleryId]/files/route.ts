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

type ImageMeta = { blurhash: string; width: number; height: number };

async function extractImageMeta(buffer: ArrayBuffer): Promise<ImageMeta> {
  const image = sharp(Buffer.from(buffer));
  const metadata = await image.metadata();
  const width = metadata.width ?? 800;
  const height = metadata.height ?? 800;

  const { data, info } = await image
    .resize(BLURHASH_WIDTH, undefined, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    BLURHASH_COMPONENTS_X,
    BLURHASH_COMPONENTS_Y,
  );

  return { blurhash, width, height };
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

  // 7. Extract blurhash and dimensions for each file
  const fileMeta = new Map<string, ImageMeta>();
  await Promise.all(
    uniqueFileIds.map(async (fileId) => {
      try {
        const buffer = await storage.getFileDownload({
          bucketId: "assets",
          fileId,
        });
        const meta = await extractImageMeta(buffer);
        fileMeta.set(fileId, meta);
      } catch {
        // Use a minimal fallback for files where extraction fails (e.g. videos)
        fileMeta.set(fileId, {
          blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
          width: 800,
          height: 800,
        });
      }
    }),
  );

  // 8. Create gallery-asset rows in chunks of 100
  const CHUNK_SIZE = 100;
  const rows = uniqueFileIds.map((fileId) => {
    const meta = fileMeta.get(fileId)!;
    return {
      $id: ID.unique(),
      fileId,
      blurhash: meta.blurhash,
      width: meta.width,
      height: meta.height,
      galleryId: galleryId,
    };
  });

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
