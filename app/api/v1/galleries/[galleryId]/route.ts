import { NextResponse } from "next/server";
import { tablesDB } from "@/lib/appwrite-server";
import { galleryIdParamsSchema } from "@/lib/api-schemas";
import type { Galleries } from "@/lib/generated/appwrite";

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
