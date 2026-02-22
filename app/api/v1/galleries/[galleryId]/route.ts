import { NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { ENDPOINT, PROJECT_ID } from "@/lib/generated/appwrite/constants";
import { tablesDB, storage, Query } from "@/lib/appwrite-server";
import { galleryIdParamsSchema } from "@/lib/api-schemas";
import type { Galleries, GalleryAssets } from "@/lib/generated/appwrite";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const parsed = galleryIdParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid gallery ID format.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { galleryId } = parsed.data;

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

  if (gallery.expiryAt && new Date(gallery.expiryAt) < new Date()) {
    return NextResponse.json(
      { error: "Gallery has expired." },
      { status: 410 },
    );
  }

  return NextResponse.json(gallery);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const parsed = galleryIdParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid gallery ID format.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { galleryId } = parsed.data;

  // Authenticate user via JWT
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

  // Verify user has delete permission on the gallery
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

  // Bulk delete all gallery-asset rows
  try {
    await tablesDB.deleteRows<GalleryAssets>({
      databaseId: "main",
      tableId: "gallery-assets",
      queries: [Query.equal("galleryId", galleryId)],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete gallery assets." },
      { status: 500 },
    );
  }

  // Delete cover image if present
  if (gallery.coverFileId) {
    try {
      await storage.deleteFile({
        bucketId: "gallery-covers",
        fileId: gallery.coverFileId,
      });
    } catch {
      // Non-critical — cover may already be gone
    }
  }

  // Delete the gallery row
  try {
    await tablesDB.deleteRow({
      databaseId: "main",
      tableId: "galleries",
      rowId: galleryId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete gallery." },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
