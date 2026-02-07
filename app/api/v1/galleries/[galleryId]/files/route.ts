import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { tablesDB, storage, Query } from "@/lib/appwrite-server";
import { galleryIdParamsSchema, filesBodySchema } from "@/lib/api-schemas";
import type { Galleries } from "@/lib/generated/appwrite";

const MAX_FILES = 1000;

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

  const { assets } = bodyParsed.data;

  // 5. Deduplicate by fileId (keep first occurrence)
  const seen = new Set<string>();
  const uniqueAssets = assets.filter((a) => {
    if (seen.has(a.fileId)) return false;
    seen.add(a.fileId);
    return true;
  });

  const uniqueFileIds = uniqueAssets.map((a) => a.fileId);

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

  // 7. Create gallery-asset rows in chunks of 100
  const CHUNK_SIZE = 100;
  const rows = uniqueAssets.map((asset) => ({
    $id: ID.unique(),
    fileId: asset.fileId,
    blurhash: asset.blurhash,
    width: 800,
    height: 800,
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
