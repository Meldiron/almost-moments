import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { tablesDB, storage } from "@/lib/appwrite-server";
import { galleryIdParamsSchema, filesBodySchema } from "@/lib/api-schemas";
import type { Galleries } from "@/lib/generated/appwrite";
import { SAMPLE_GALLERY_ID } from "@/lib/generated/appwrite/constants";

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

  if (gallery.$id === SAMPLE_GALLERY_ID) {
    return NextResponse.json(
      { error: "This is a sample gallery and uploading is forbidden." },
      { status: 400 },
    );
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

  const { fileId, blurhash, width, height, createdAt } = bodyParsed.data;

  // 5. Ensure file exists in storage
  try {
    await storage.getFile({ bucketId: "assets", fileId });
  } catch {
    return NextResponse.json(
      { error: "File not found.", fileId },
      { status: 404 },
    );
  }

  // 6. Create gallery-asset row
  await tablesDB.createRows({
    databaseId: "main",
    tableId: "gallery-assets",
    rows: [
      {
        $id: ID.unique(),
        fileId,
        blurhash,
        width,
        height,
        galleryId,
        ...(createdAt && { $createdAt: createdAt }),
      },
    ],
  });

  await tablesDB.incrementRowColumn({
    databaseId: "main",
    tableId: "galleries",
    rowId: galleryId,
    column: "totalAssets",
    value: 1,
  });

  return NextResponse.json({ created: 1 }, { status: 201 });
}
