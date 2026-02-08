import { NextResponse } from "next/server";
import { Client, Account, Query } from "node-appwrite";
import { ENDPOINT, PROJECT_ID } from "@/lib/generated/appwrite/constants";
import { tablesDB, storage } from "@/lib/appwrite-server";
import { fileParamsSchema } from "@/lib/api-schemas";
import type { Galleries, GalleryAssets } from "@/lib/generated/appwrite";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ galleryId: string; fileId: string }> },
) {
  // 1. Validate params
  const paramsParsed = fileParamsSchema.safeParse(await params);
  if (!paramsParsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters.", issues: paramsParsed.error.issues },
      { status: 400 },
    );
  }

  const { galleryId, fileId } = paramsParsed.data;

  // 2. Authenticate user via JWT
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing authorization." },
      { status: 401 },
    );
  }

  const jwt = authHeader.slice(7);
  const userClient = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setJWT(jwt);

  let userId: string;
  try {
    const userAccount = new Account(userClient);
    const user = await userAccount.get();
    userId = user.$id;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 },
    );
  }

  // 3. Verify user has delete permission on the gallery
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

  const hasDeletePermission = gallery.$permissions.some(
    (p) => p === `delete("user:${userId}")` || p === `write("user:${userId}")`,
  );

  if (!hasDeletePermission) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  // 4. Find the gallery-asset row linking this file to this gallery
  let assetRow: GalleryAssets | null = null;
  try {
    const result = await tablesDB.listRows<GalleryAssets>({
      databaseId: "main",
      tableId: "gallery-assets",
      queries: [
        Query.equal("galleryId", galleryId),
        Query.equal("fileId", fileId),
        Query.limit(1),
      ],
    });
    if (result.rows.length > 0) {
      assetRow = result.rows[0];
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to look up asset." },
      { status: 500 },
    );
  }

  if (!assetRow) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  // 5. Delete the file from storage
  try {
    await storage.deleteFile({ bucketId: "assets", fileId });
  } catch {
    // File may already be gone from storage — continue with DB cleanup
  }

  // 6. Delete the gallery-asset row
  try {
    await tablesDB.deleteRow({
      databaseId: "main",
      tableId: "gallery-assets",
      rowId: assetRow.$id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete asset record." },
      { status: 500 },
    );
  }

  // 7. Decrement gallery totalAssets
  try {
    await tablesDB.incrementRowColumn({
      databaseId: "main",
      tableId: "galleries",
      rowId: galleryId,
      column: "totalAssets",
      value: -1,
    });
  } catch {
    // Non-critical — counter may be slightly off but asset is deleted
  }

  return NextResponse.json({ deleted: 1 });
}
