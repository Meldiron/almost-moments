"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useViewTransitionRouter } from "@/lib/view-transitions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { SEO } from "@/components/seo";
import { RelativeExpiry } from "@/components/relative-expiry";
import {
  ArrowLeft,
  Info,
  Loader2,
  ImageIcon,
  Share2,
  QrCode,
  Copy,
  ExternalLink,
  Check,
  Star,
  CalendarDays,
  Download,
  Trash2,
  MoreHorizontal,
  Camera,
  AlertTriangle,
  FileVideo,
  Archive,
} from "lucide-react";
import QRCode from "qrcode";
import JSZip from "jszip";
import pLimit from "p-limit";
import {
  databases,
  type Galleries,
  type GalleryAssets,
} from "@/lib/generated/appwrite";
import { storage, account } from "@/lib/appwrite";
import { getJwt } from "@/lib/jwt";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";

const FILE_PAGE_SIZE = 25;
const galleriesTable = databases.use("main").use("galleries");
const galleryAssetsTable = databases.use("main").use("galleryAssets");

// ─── Helpers ────────────────────────────────────────────────────

function formatVerboseDate(date: Date): string {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day}${suffix} ${month} ${date.getFullYear()}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function computeExpiryDate(
  duration: string,
  customDate: Date | undefined,
): string | null {
  const now = new Date();
  switch (duration) {
    case "1-week":
      now.setDate(now.getDate() + 7);
      return now.toISOString();
    case "2-weeks":
      now.setDate(now.getDate() + 14);
      return now.toISOString();
    case "1-month":
      now.setMonth(now.getMonth() + 1);
      return now.toISOString();
    case "1-year":
      now.setFullYear(now.getFullYear() + 1);
      return now.toISOString();
    case "forever":
      return null;
    case "custom": {
      if (!customDate) return null;
      const date = new Date(customDate);
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    }
    default:
      return null;
  }
}

function getGalleryUrl(galleryId: string) {
  return `${window.location.origin}/g/${galleryId}`;
}

const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isVideoFile(name: string): boolean {
  return VIDEO_EXTENSIONS.has(getFileExtension(name));
}

type FileMeta = { name: string; sizeOriginal: number };

// ─── Page ───────────────────────────────────────────────────────

export default function GalleryManagePage() {
  const params = useParams();
  const router = useViewTransitionRouter();
  const { user, softRefresh } = useAuth();
  const galleryId = (params.galleryId as string) ?? "";

  // ─── Gallery state ──────────────────────────────────────────
  const [gallery, setGallery] = useState<Galleries | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ─── File list state ────────────────────────────────────────
  const [assets, setAssets] = useState<GalleryAssets[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsHasMore, setAssetsHasMore] = useState(false);
  const [assetsLoadingMore, setAssetsLoadingMore] = useState(false);

  // ─── File metadata cache ────────────────────────────────────
  const fileMetaCache = useRef<Map<string, FileMeta>>(new Map());
  const [fileMetaLoaded, setFileMetaLoaded] = useState(0); // trigger re-renders

  // ─── Selection state ────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Favourite state ────────────────────────────────────────
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  // ─── Share state ────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // ─── Edit form state ───────────────────────────────────────
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("forever");
  const [editCustomDate, setEditCustomDate] = useState<Date | undefined>(
    undefined,
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState("");
  const editRef = useRef<HTMLDivElement>(null);

  // ─── ZIP state ──────────────────────────────────────────────
  const [zipGenerating, setZipGenerating] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipError, setZipError] = useState<string | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  // ─── Delete state ───────────────────────────────────────────
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ─── Load gallery ──────────────────────────────────────────
  useEffect(() => {
    if (!galleryId) return;
    (async () => {
      try {
        const g = await galleriesTable.get(galleryId);
        setGallery(g);
        populateEditForm(g);
      } catch {
        setNotFound(true);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [galleryId]);

  function populateEditForm(g: Galleries) {
    setEditName(g.name);
    setEditDescription(g.description ?? "");
    if (g.expiryAt) {
      setEditDuration("custom");
      setEditCustomDate(new Date(g.expiryAt));
    } else {
      setEditDuration("forever");
      setEditCustomDate(undefined);
    }
  }

  // ─── Load favourites from user prefs ──────────────────────
  useEffect(() => {
    if (!user) return;
    const ids: string[] =
      ((user.prefs as Record<string, unknown>)?.favouriteGalleryIds as
        | string[]
        | undefined) ?? [];
    setFavouriteIds(new Set(ids));
  }, [user]);

  // ─── Fetch files (first page) ─────────────────────────────
  const fetchFiles = useCallback(
    async (cursor?: string) => {
      const result = await galleryAssetsTable.list({
        queries: (q) => {
          const queries = [
            q.equal("galleryId", galleryId),
            q.orderDesc("$createdAt"),
            q.limit(FILE_PAGE_SIZE),
          ];
          if (cursor) queries.push(q.cursorAfter(cursor));
          return queries;
        },
      });
      return result;
    },
    [galleryId],
  );

  useEffect(() => {
    if (pageLoading || notFound) return;
    (async () => {
      setAssetsLoading(true);
      try {
        const result = await fetchFiles();
        setAssets(result.rows);
        setAssetsHasMore(result.rows.length === FILE_PAGE_SIZE);
        loadFileMeta(result.rows);
      } catch {
        // ignore
      } finally {
        setAssetsLoading(false);
      }
    })();
  }, [pageLoading, notFound, fetchFiles]);

  async function loadMore() {
    if (!assets.length) return;
    setAssetsLoadingMore(true);
    const lastId = assets[assets.length - 1].$id;
    try {
      const result = await fetchFiles(lastId);
      setAssets((prev) => [...prev, ...result.rows]);
      setAssetsHasMore(result.rows.length === FILE_PAGE_SIZE);
      loadFileMeta(result.rows);
    } catch {
      // ignore
    } finally {
      setAssetsLoadingMore(false);
    }
  }

  // ─── Load file metadata (name, size) ──────────────────────
  function loadFileMeta(rows: GalleryAssets[]) {
    const limit = pLimit(10);
    const toLoad = rows.filter((r) => !fileMetaCache.current.has(r.fileId));
    if (!toLoad.length) return;

    Promise.all(
      toLoad.map((asset) =>
        limit(async () => {
          try {
            const file = await storage.getFile({
              bucketId: "assets",
              fileId: asset.fileId,
            });
            fileMetaCache.current.set(asset.fileId, {
              name: file.name,
              sizeOriginal: file.sizeOriginal,
            });
            setFileMetaLoaded((n) => n + 1);
          } catch {
            // ignore
          }
        }),
      ),
    );
  }

  // ─── Toggle favourite ─────────────────────────────────────
  async function toggleFavourite() {
    if (!gallery || !user) return;
    const wasFavourite = favouriteIds.has(gallery.$id);
    const next = new Set(favouriteIds);
    if (wasFavourite) {
      next.delete(gallery.$id);
    } else {
      next.add(gallery.$id);
    }
    setFavouriteIds(next);
    try {
      await account.updatePrefs({
        ...user.prefs,
        favouriteGalleryIds: Array.from(next),
      });
      await softRefresh();
    } catch {
      setFavouriteIds(favouriteIds);
    }
  }

  // ─── Share helpers ────────────────────────────────────────
  async function openQrModal() {
    if (!gallery) return;
    const url = getGalleryUrl(gallery.$id);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
    setQrOpen(true);
  }

  async function copyLink() {
    if (!gallery) return;
    await navigator.clipboard.writeText(getGalleryUrl(gallery.$id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openLink() {
    if (!gallery) return;
    window.open(getGalleryUrl(gallery.$id), "_blank");
  }

  // ─── Edit gallery ─────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!gallery || !editName.trim()) return;
    setSaving(true);
    setEditError("");
    setSaveSuccess(false);
    try {
      const expiryAt = computeExpiryDate(editDuration, editCustomDate);
      const updated = await galleriesTable.update(gallery.$id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        expiryAt,
      });
      setGallery(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes.";
      setEditError(message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Download single file ─────────────────────────────────
  async function downloadFile(fileId: string) {
    const url = storage.getFileDownload({
      bucketId: "assets",
      fileId,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ─── Delete single file ───────────────────────────────────
  async function confirmDeleteSingle() {
    if (!deleteAssetId || !gallery) return;
    setDeleting(true);
    try {
      const jwt = await getJwt();
      const asset = assets.find((a) => a.$id === deleteAssetId);
      if (asset) {
        const res = await fetch(
          `/api/v1/galleries/${gallery.$id}/files/${asset.fileId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${jwt}` },
          },
        );
        if (!res.ok) throw new Error("Delete failed");
        setGallery((prev) =>
          prev
            ? { ...prev, totalAssets: Math.max(0, prev.totalAssets - 1) }
            : prev,
        );
        setAssets((prev) => prev.filter((a) => a.$id !== deleteAssetId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteAssetId);
          return next;
        });
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteAssetId(null);
    }
  }

  // ─── Bulk delete ──────────────────────────────────────────
  async function confirmBulkDelete() {
    if (!gallery || selectedIds.size === 0) return;
    setBulkDeleting(true);
    const limit = pLimit(5);
    let deletedCount = 0;
    const idsToDelete = new Set(selectedIds);
    const jwt = await getJwt();

    await Promise.all(
      Array.from(idsToDelete).map((assetId) =>
        limit(async () => {
          try {
            const asset = assets.find((a) => a.$id === assetId);
            if (!asset) return;
            const res = await fetch(
              `/api/v1/galleries/${gallery.$id}/files/${asset.fileId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${jwt}` },
              },
            );
            if (res.ok) deletedCount++;
          } catch {
            // skip failed
          }
        }),
      ),
    );

    if (deletedCount > 0) {
      setGallery((prev) =>
        prev
          ? {
              ...prev,
              totalAssets: Math.max(0, prev.totalAssets - deletedCount),
            }
          : prev,
      );
    }

    setAssets((prev) => prev.filter((a) => !idsToDelete.has(a.$id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
  }

  // ─── ZIP download ─────────────────────────────────────────
  async function downloadAsZip(onlySelected = false) {
    if (zipGenerating || !gallery) return;
    setZipGenerating(true);
    setZipProgress(0);
    setZipError(null);

    try {
      let allAssets: GalleryAssets[];

      if (onlySelected) {
        allAssets = assets.filter((a) => selectedIds.has(a.$id));
      } else {
        // Fetch all asset rows by paginating
        const countResult = await galleryAssetsTable.list({
          queries: (q) => [q.equal("galleryId", galleryId), q.limit(1)],
        });
        const expectedTotal = countResult.total;
        if (expectedTotal === 0) {
          setZipGenerating(false);
          setDownloadMenuOpen(false);
          return;
        }

        allAssets = [];
        let cursor: string | null = null;
        for (;;) {
          const result = await galleryAssetsTable.list({
            queries: (q) => {
              const queries = [
                q.equal("galleryId", galleryId),
                q.orderDesc("$createdAt"),
                q.limit(100),
              ];
              if (cursor) queries.push(q.cursorAfter(cursor));
              return queries;
            },
          });
          allAssets.push(...result.rows);
          if (result.rows.length < 100) break;
          cursor = result.rows[result.rows.length - 1].$id;
        }
      }

      if (allAssets.length === 0) {
        setZipGenerating(false);
        setDownloadMenuOpen(false);
        return;
      }

      const expectedTotal = allAssets.length;
      const zip = new JSZip();
      const seen = new Set<string>();
      let filesAdded = 0;
      const limit = pLimit(15);

      await Promise.all(
        allAssets.map((asset) =>
          limit(async () => {
            try {
              const fileDetail = await storage.getFile({
                bucketId: "assets",
                fileId: asset.fileId,
              });
              const url = storage.getFileDownload({
                bucketId: "assets",
                fileId: asset.fileId,
              });
              const res = await fetch(url);
              if (!res.ok) return;
              const blob = await res.blob();

              let filename = fileDetail.name;
              const disposition = res.headers.get("content-disposition");
              if (disposition) {
                const match = disposition.match(
                  /filename\*?=(?:UTF-8''|"?)([^";]+)/i,
                );
                if (match) filename = decodeURIComponent(match[1]);
              }

              let uniqueName = filename;
              let counter = 1;
              while (seen.has(uniqueName)) {
                const dot = filename.lastIndexOf(".");
                if (dot > 0) {
                  uniqueName = `${filename.slice(0, dot)} (${counter})${filename.slice(dot)}`;
                } else {
                  uniqueName = `${filename} (${counter})`;
                }
                counter++;
              }
              seen.add(uniqueName);

              zip.file(uniqueName, blob);
              filesAdded++;
              setZipProgress(Math.round((filesAdded / expectedTotal) * 100));
            } catch {
              // skip failed
            }
          }),
        ),
      );

      if (filesAdded !== expectedTotal) {
        setZipError(
          `Only ${filesAdded} of ${expectedTotal} files could be added to the ZIP.`,
        );
        setZipGenerating(false);
        setDownloadMenuOpen(false);
        return;
      }

      const safeName = gallery.name
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 100);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setZipError("Something went wrong while generating the ZIP file.");
    } finally {
      setZipGenerating(false);
      setDownloadMenuOpen(false);
    }
  }

  // ─── Selection helpers ────────────────────────────────────
  const allSelected =
    assets.length > 0 && assets.every((a) => selectedIds.has(a.$id));
  const someSelected = assets.some((a) => selectedIds.has(a.$id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map((a) => a.$id)));
    }
  }

  function toggleSelect(assetId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }

  // ─── Expiry warning logic ─────────────────────────────────
  const expiryWarning = (() => {
    if (!gallery?.expiryAt) return null;
    const now = Date.now();
    const expiry = new Date(gallery.expiryAt).getTime();
    const diffMs = expiry - now;
    if (diffMs <= 0) return "expired" as const;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 3) return "expiring-soon" as const;
    return null;
  })();

  // ─── Render ───────────────────────────────────────────────

  // Loading state
  if (pageLoading) {
    return (
      <div>
        <SEO title="Gallery" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !gallery) {
    return (
      <div>
        <SEO title="Gallery Not Found" />
        <div className="text-center py-32">
          <Camera className="size-12 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="font-sans text-2xl font-bold mb-2">
            Gallery not found
          </h1>
          <p className="text-muted-foreground mb-6">
            This gallery may have been deleted or you don&apos;t have access to
            it.
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = gallery.expiryAt && new Date(gallery.expiryAt) < new Date();

  // Force re-read of cache when fileMetaLoaded changes
  void fileMetaLoaded;

  return (
    <div>
      <SEO title={gallery.name} />

      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to galleries
      </button>

      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-sans text-2xl font-bold truncate">
            {gallery.name}
          </h1>
          <button
            onClick={toggleFavourite}
            className="shrink-0 transition-colors"
          >
            <Star
              className={`size-5 ${
                favouriteIds.has(gallery.$id)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40 hover:text-amber-400"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Share dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="rounded-lg bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
              >
                <Share2 className="size-4 mr-1.5" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={openQrModal}
                className="cursor-pointer"
              >
                <QrCode className="size-4 mr-2" />
                QR code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
                {copied ? (
                  <Check className="size-4 mr-2 text-lime" />
                ) : (
                  <Copy className="size-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy link"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openLink} className="cursor-pointer">
                <ExternalLink className="size-4 mr-2" />
                Open link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Download all */}
          <DropdownMenu
            open={downloadMenuOpen}
            onOpenChange={(open) => {
              if (!zipGenerating) setDownloadMenuOpen(open);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={gallery.totalAssets === 0}
              >
                <Download className="size-4 mr-1.5" />
                Download all
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => downloadAsZip(false)}
                disabled={zipGenerating}
                className="cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                {zipGenerating ? (
                  <div className="flex flex-col gap-1.5 w-full py-0.5">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin shrink-0" />
                      <span>Generating… {zipProgress}%</span>
                    </div>
                    <Progress value={zipProgress} className="h-1.5" />
                  </div>
                ) : (
                  <>
                    <Archive className="size-4 mr-2" />
                    Download as ZIP
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {zipError && (
        <div className="flex gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 mb-6">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{zipError}</p>
        </div>
      )}

      {/* ─── Details badges ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-full bg-sky/10 border border-sky/20 px-3.5 py-1.5">
          <ImageIcon className="size-3.5 text-sky" />
          <span className="text-sm font-medium">
            {gallery.totalAssets} photo
            {gallery.totalAssets === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-lime/10 border border-lime/20 px-3.5 py-1.5">
          <CalendarDays className="size-3.5 text-lime" />
          <span className="text-sm font-medium">
            Created {formatVerboseDate(new Date(gallery.$createdAt))}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 ${
            isExpired
              ? "bg-destructive/10 border border-destructive/20"
              : "bg-amber/10 border border-amber/20"
          }`}
        >
          <AlertTriangle
            className={`size-3.5 ${isExpired ? "text-destructive" : "text-amber"}`}
          />
          <span className="text-sm font-medium">
            Expires <RelativeExpiry date={gallery.expiryAt!} />
          </span>
        </div>
      </div>

      {/* ─── Expiry warning ──────────────────────────────────── */}
      {expiryWarning === "expired" && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Gallery link has expired</p>
              <p className="text-sm text-muted-foreground">
                Guests can no longer upload, view, or download photos via the
                shared link.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() =>
              editRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Update expiry
          </Button>
        </div>
      )}
      {expiryWarning === "expiring-soon" && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-amber/10 border border-amber/20 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Gallery link expires soon</p>
              <p className="text-sm text-muted-foreground">
                The shared link will expire{" "}
                <RelativeExpiry date={gallery.expiryAt!} />. Consider extending
                it.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg shrink-0 border-amber/30 text-amber hover:bg-amber/10"
            onClick={() =>
              editRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Update expiry
          </Button>
        </div>
      )}

      {/* ─── Edit gallery ────────────────────────────────────── */}
      <div
        ref={editRef}
        className="rounded-2xl border border-border bg-card p-6 mb-8"
      >
        <h2 className="font-sans text-lg font-bold mb-4">Gallery settings</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Gallery name</Label>
              <Input
                id="edit-name"
                required
                placeholder="e.g. Sarah & Tom's Wedding"
                className="rounded-xl h-12"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="edit-description"
                placeholder="A short note about the event"
                className="rounded-xl h-12"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link duration</Label>
            <Select value={editDuration} onValueChange={setEditDuration}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-week">1 week</SelectItem>
                <SelectItem value="2-weeks">2 weeks</SelectItem>
                <SelectItem value="1-month">1 month</SelectItem>
                <SelectItem value="1-year">1 year</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
                <SelectItem value="custom">Specific date</SelectItem>
              </SelectContent>
            </Select>

            {editDuration === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl h-12 w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="size-4 mr-2 text-muted-foreground" />
                    {editCustomDate ? (
                      editCustomDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editCustomDate}
                    onSelect={setEditCustomDate}
                    disabled={{ before: new Date() }}
                    defaultMonth={editCustomDate ?? new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="flex gap-2.5 rounded-xl bg-muted/50 border border-border p-3 mt-2">
              <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your gallery and photos are kept forever. This only controls how
                long guests can upload, view, and download photos via the shared
                link.
              </p>
            </div>
          </div>

          {editError && <p className="text-sm text-destructive">{editError}</p>}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={!editName.trim() || saving}
              className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="size-4 mr-1.5" />
                  Saved
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* ─── File list ───────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-lg font-bold">
            Photos & Videos
            {gallery.totalAssets > 0 && (
              <span className="text-muted-foreground font-normal ml-2 text-base">
                ({gallery.totalAssets})
              </span>
            )}
          </h2>
        </div>

        {/* File list header */}
        {assets.length > 0 && (
          <div className="grid grid-cols-[auto_1fr_80px_100px_40px] sm:grid-cols-[auto_1fr_100px_120px_40px] items-center gap-3 px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wide border-b border-border">
            <Checkbox
              checked={
                allSelected ? true : someSelected ? "indeterminate" : false
              }
              onCheckedChange={toggleSelectAll}
              aria-label="Select all files"
            />
            <span>Name</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span />
          </div>
        )}

        {/* File rows */}
        {assets.map((asset) => {
          const meta = fileMetaCache.current.get(asset.fileId);
          const isSelected = selectedIds.has(asset.$id);

          return (
            <div
              key={asset.$id}
              className={`grid grid-cols-[auto_1fr_80px_100px_40px] sm:grid-cols-[auto_1fr_100px_120px_40px] items-center gap-3 px-3 py-2.5 border-b border-border transition-colors ${
                isSelected ? "bg-accent/50" : "hover:bg-accent/30"
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(asset.$id)}
                aria-label={`Select ${meta?.name ?? "file"}`}
              />

              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                {meta && isVideoFile(meta.name) ? (
                  <FileVideo className="size-4 text-muted-foreground shrink-0" />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                )}
                {meta ? (
                  <span className="text-sm truncate">{meta.name}</span>
                ) : (
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                )}
              </div>

              {/* Size */}
              {meta ? (
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(meta.sizeOriginal)}
                </span>
              ) : (
                <div className="h-4 w-14 rounded bg-muted animate-pulse" />
              )}

              {/* Upload date */}
              <span className="text-sm text-muted-foreground">
                {formatVerboseDate(new Date(asset.$createdAt))}
              </span>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="size-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
                    <MoreHorizontal className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => downloadFile(asset.fileId)}
                    className="cursor-pointer"
                  >
                    <Download className="size-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteAssetId(asset.$id)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}

        {/* Loading state */}
        {assetsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!assetsLoading && assets.length === 0 && (
          <div className="text-center py-16">
            <Camera className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No files yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Share the gallery link or QR code so guests can start uploading.
            </p>
          </div>
        )}

        {/* Load more */}
        {assetsHasMore && (
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={assetsLoadingMore}
              className="rounded-full"
            >
              {assetsLoadingMore ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ─── Bulk actions bar ────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Deselect all
              </button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu
                open={downloadMenuOpen}
                onOpenChange={(open) => {
                  if (!zipGenerating) setDownloadMenuOpen(open);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <Download className="size-4 mr-1.5" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => downloadAsZip(true)}
                    disabled={zipGenerating}
                    className="cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    {zipGenerating ? (
                      <div className="flex flex-col gap-1.5 w-full py-0.5">
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin shrink-0" />
                          <span>Generating… {zipProgress}%</span>
                        </div>
                        <Progress value={zipProgress} className="h-1.5" />
                      </div>
                    ) : (
                      <>
                        <Archive className="size-4 mr-2" />
                        Download as ZIP
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Single delete dialog ────────────────────────────── */}
      <AlertDialog
        open={deleteAssetId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteAssetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteSingle();
              }}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Bulk delete dialog ──────────────────────────────── */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!bulkDeleting) setBulkDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} file{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected files will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={bulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmBulkDelete();
              }}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── QR code modal ───────────────────────────────────── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>{gallery.name}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {qrDataUrl && (
              <Image
                src={qrDataUrl}
                alt={`QR code for ${gallery.name}`}
                width={256}
                height={256}
                unoptimized
                className="rounded-xl"
              />
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Scan this code to upload and download photos.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
