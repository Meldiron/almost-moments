"use client";

import {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { TransitionLink } from "@/lib/view-transitions";
import {
  Upload,
  Download,
  Share2,
  Sun,
  Moon,
  ImageIcon,
  Clock,
  Camera,
  SearchX,
  TimerOff,
  QrCode,
  Copy,
  Check,
  FileImage,
  FileVideo,
  RotateCcw,
  Loader2,
  Archive,
} from "lucide-react";
import QRCode from "qrcode";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import { decode, encode } from "blurhash";
import JSZip from "jszip";
import pLimit from "p-limit";

import { ThemeContext } from "@/app/layout";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { storage, ID } from "@/lib/appwrite";
import { databases } from "@/lib/generated/appwrite";
import type { Galleries, GalleryAssets } from "@/lib/generated/appwrite";
import { cn } from "@/lib/utils";
import { SAMPLE_GALLERY_ID } from "@/lib/generated/appwrite/constants";
import { RelativeExpiry } from "@/components/relative-expiry";
import { ImageFormat } from "appwrite";

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "expired"; gallery: Galleries }
  | { status: "ready"; gallery: Galleries };

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.heic,.mp4,.mov";
const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);
const MAX_CONCURRENT = 5;
const MAX_RETRIES = 3;
const ASSETS_PAGE_SIZE = 100;

// ─── Blurhash canvas helper ────────────────────────────────────
function blurhashToDataUrl(hash: string, width = 32, height = 32): string {
  const pixels = decode(hash, width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// ─── Client-side blurhash generation ───────────────────────────
const BLURHASH_SIZE = 32;
const BLURHASH_COMPONENTS_X = 4;
const BLURHASH_COMPONENTS_Y = 3;
const FALLBACK_BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

type BlurhashResult = { blurhash: string; width: number; height: number };
const FALLBACK_DIMENSIONS = { width: 800, height: 800 };

function generateBlurhash(file: File): Promise<BlurhashResult> {
  return new Promise((resolve) => {
    if (isVideoFile(file.name)) {
      resolve({ blurhash: FALLBACK_BLURHASH, ...FALLBACK_DIMENSIONS });
      return;
    }

    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = BLURHASH_SIZE;
        canvas.height = BLURHASH_SIZE;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, BLURHASH_SIZE, BLURHASH_SIZE);
        const imageData = ctx.getImageData(0, 0, BLURHASH_SIZE, BLURHASH_SIZE);
        const hash = encode(
          imageData.data,
          BLURHASH_SIZE,
          BLURHASH_SIZE,
          BLURHASH_COMPONENTS_X,
          BLURHASH_COMPONENTS_Y,
        );
        resolve({ blurhash: hash, width, height });
      } catch {
        resolve({ blurhash: FALLBACK_BLURHASH, width, height });
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blurhash: FALLBACK_BLURHASH, ...FALLBACK_DIMENSIONS });
    };

    img.src = url;
  });
}

// ─── Single gallery image with blurhash → real image ───────────
function GalleryImage({
  asset,
  onClick,
}: {
  asset: GalleryAssets;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const blurhashSrc = useMemo(
    () => blurhashToDataUrl(asset.blurhash),
    [asset.blurhash],
  );
  const previewUrl = storage.getFilePreview({
    bucketId: "assets",
    fileId: asset.fileId,
    width: 800,
    quality: 80,
    output: ImageFormat.Webp,
  });

  return (
    <button
      onClick={onClick}
      className="block w-full rounded-xl overflow-hidden cursor-pointer break-inside-avoid relative"
      style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
    >
      {/* Blurhash placeholder */}
      {!loaded && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={blurhashSrc} alt="" className="w-full h-full object-cover" />
      )}
      {/* Real image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover rounded-xl transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0 absolute inset-0",
        )}
      />
    </button>
  );
}

// ─── Helpers ───────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isVideoFile(name: string): boolean {
  return VIDEO_EXTENSIONS.has(getFileExtension(name));
}

// ─── Skeleton loader ───────────────────────────────────────────
function GallerySkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="size-9 rounded-full bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-8">
        <div className="h-10 w-72 rounded-lg bg-muted animate-pulse" />
        <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-muted animate-pulse" />
        <div className="mt-6 flex gap-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-7 w-28 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {[200, 300, 180, 260, 220, 320, 190, 280, 240].map((h, i) => (
            <div
              key={i}
              className="rounded-xl bg-muted animate-pulse break-inside-avoid"
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Error states ──────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4">
      <SEO title="Gallery Not Found" />
      <div className="text-center max-w-md animate-scale-in">
        <div className="mx-auto mb-6 size-24 rounded-3xl bg-coral/15 flex items-center justify-center">
          <SearchX className="size-12 text-coral" />
        </div>
        <h1 className="text-3xl font-bold font-sans text-foreground">
          Gallery not found
        </h1>
        <p className="mt-3 text-muted-foreground text-lg leading-relaxed">
          This gallery doesn&apos;t exist or the link might be broken. Double
          check the URL or ask the event organizer for a new one.
        </p>
        <TransitionLink
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to Almost Moments
        </TransitionLink>
      </div>
    </div>
  );
}

function ExpiredState({ gallery }: { gallery: Galleries }) {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4">
      <SEO title={`${gallery.name} — Expired`} />
      <div className="text-center max-w-md animate-scale-in">
        <div className="mx-auto mb-6 size-24 rounded-3xl bg-amber/15 flex items-center justify-center">
          <TimerOff className="size-12 text-amber" />
        </div>
        <h1 className="text-3xl font-bold font-sans text-foreground">
          Gallery expired
        </h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">
          {gallery.name}
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          This gallery expired{" "}
          <span className="font-medium text-foreground">
            <RelativeExpiry date={gallery.expiryAt!} />
          </span>
          . The organizer may have set a time limit for uploads. Contact them if
          you think this is a mistake.
        </p>
        <TransitionLink
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to Almost Moments
        </TransitionLink>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function GalleryPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const { isDark, toggle } = useContext(ThemeContext);
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Gallery assets state
  const [assets, setAssets] = useState<GalleryAssets[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastCursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Upload state
  type FileStatus = "pending" | "uploading" | "done" | "failed";
  type FileUploadState = { status: FileStatus; progress: number };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSampleGallery = galleryId === SAMPLE_GALLERY_ID;

  function triggerFileInput() {
    if (isSampleGallery) {
      setErrorMessage(
        "This is a sample gallery. Uploading images is not allowed.",
      );
      return;
    }
    fileInputRef.current?.click();
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    setFileStates(files.map(() => ({ status: "pending", progress: 0 })));
    setUploading(false);
    setUploadOpen(true);
    e.target.value = "";
  }

  function resetUploadModal() {
    setUploadOpen(false);
    setSelectedFiles([]);
    setFileStates([]);
  }

  function updateFileState(idx: number, update: Partial<FileUploadState>) {
    setFileStates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...update };
      return next;
    });
  }

  async function uploadSingleFile(idx: number): Promise<boolean> {
    const file = selectedFiles[idx];
    updateFileState(idx, { status: "uploading", progress: 0 });

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Upload file to storage (progress 0-90%)
        const result = await storage.createFile({
          bucketId: "assets",
          fileId: ID.unique(),
          file,
          onProgress: (progress: { sizeUploaded: number }) => {
            const pct =
              file.size > 0
                ? Math.round((progress.sizeUploaded / file.size) * 90)
                : 90;
            updateFileState(idx, { progress: pct });
          },
        });

        // Generate blurhash and measure dimensions (progress stays at 90%)
        const { blurhash, width, height } = await generateBlurhash(file);
        updateFileState(idx, { progress: 95 });

        // Finalize: attach file to gallery via API
        const res = await fetch(`/api/v1/galleries/${galleryId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: result.$id,
            blurhash,
            width,
            height,
            createdAt: new Date(file.lastModified).toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Failed to finalize file.");

        updateFileState(idx, { status: "done", progress: 100 });
        return true;
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          updateFileState(idx, { progress: 0 });
        }
      }
    }

    updateFileState(idx, { status: "failed", progress: 100 });
    return false;
  }

  async function refreshAfterUpload() {
    // Re-fetch gallery document
    try {
      const res = await fetch(`/api/v1/galleries/${galleryId}`);
      if (res.ok) {
        const gallery: Galleries = await res.json();
        setState({ status: "ready", gallery });
      }
    } catch {
      // Ignore — gallery state stays as-is
    }

    // Reset and reload all assets from scratch
    setAssets([]);
    lastCursorRef.current = null;
    setHasMore(true);
    initialLoadDone.current = false;
  }

  async function startUpload() {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setFileStates(
      selectedFiles.map(() => ({ status: "pending", progress: 0 })),
    );

    let nextIndex = 0;

    async function uploadNext() {
      while (nextIndex < selectedFiles.length) {
        const idx = nextIndex++;
        await uploadSingleFile(idx);
      }
    }

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT, selectedFiles.length) },
      () => uploadNext(),
    );
    await Promise.all(workers);

    setUploading(false);
    await refreshAfterUpload();
  }

  async function retrySingleFile(idx: number) {
    await uploadSingleFile(idx);
  }

  const uploadedCount = fileStates.filter((f) => f.status === "done").length;
  const failedCount = fileStates.filter((f) => f.status === "failed").length;
  const allFilesSettled =
    uploadedCount + failedCount > 0 &&
    uploadedCount + failedCount === selectedFiles.length;
  const uploadDone = !uploading && allFilesSettled;

  // Share helpers
  function getGalleryUrl() {
    return `${window.location.origin}/g/${galleryId}`;
  }

  async function openQrModal() {
    const url = getGalleryUrl();
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
    setQrOpen(true);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getGalleryUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Download as ZIP
  const [zipGenerating, setZipGenerating] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipError, setZipError] = useState<string | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  async function downloadAsZip() {
    if (zipGenerating) return;
    setZipGenerating(true);
    setZipProgress(0);

    try {
      const galleryAssetsTable = databases.use("main").use("galleryAssets");

      // 1. Fetch total count with a limit-1 query
      const countResult = await galleryAssetsTable.list({
        queries: (q) => [q.equal("galleryId", galleryId), q.limit(1)],
      });
      const expectedTotal = countResult.total;

      if (expectedTotal === 0) {
        setZipGenerating(false);
        setDownloadMenuOpen(false);
        return;
      }

      // 2. Fetch all asset rows by paginating in pages of 100
      const allAssets: GalleryAssets[] = [];
      let cursor: string | null = null;

      for (;;) {
        const result = await galleryAssetsTable.list({
          queries: (q) => {
            const queries = [
              q.equal("galleryId", galleryId),
              q.orderDesc("$createdAt"),
              q.limit(ASSETS_PAGE_SIZE),
            ];
            if (cursor) {
              queries.push(q.cursorAfter(cursor));
            }
            return queries;
          },
        });

        allAssets.push(...result.rows);
        if (result.rows.length < ASSETS_PAGE_SIZE) break;
        cursor = result.rows[result.rows.length - 1].$id;
      }

      if (allAssets.length === 0) {
        setZipGenerating(false);
        setDownloadMenuOpen(false);
        return;
      }

      // 3. Download all files and add to ZIP with concurrency limit
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

              // Determine filename from Content-Disposition or fallback
              let filename = fileDetail.name;
              const disposition = res.headers.get("content-disposition");
              if (disposition) {
                const match = disposition.match(
                  /filename\*?=(?:UTF-8''|"?)([^";]+)/i,
                );
                if (match) filename = decodeURIComponent(match[1]);
              }

              // Deduplicate filenames
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
              // Skip failed files — mismatch check below will catch it
            }
          }),
        ),
      );

      // 4. Verify file count matches expected total
      if (filesAdded !== expectedTotal) {
        setZipError(
          `Only ${filesAdded} of ${expectedTotal} files could be added to the ZIP. Some files may have failed to download. Please try again.`,
        );
        setZipGenerating(false);
        setDownloadMenuOpen(false);
        return;
      }

      // 5. Generate and download the ZIP
      const safeName = (
        state.status === "ready" ? state.gallery.name : "gallery"
      )
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
      setZipError(
        "Something went wrong while generating the ZIP file. Please try again.",
      );
    } finally {
      setZipGenerating(false);
      setDownloadMenuOpen(false);
    }
  }

  // ─── Load gallery assets page ─────────────────────────────
  const loadAssets = useCallback(async () => {
    if (assetsLoading || !hasMore) return;
    setAssetsLoading(true);

    try {
      const galleryAssetsTable = databases.use("main").use("galleryAssets");
      const result = await galleryAssetsTable.list({
        queries: (q) => {
          const queries = [
            q.equal("galleryId", galleryId),
            q.orderDesc("$createdAt"),
            q.limit(ASSETS_PAGE_SIZE),
          ];
          if (lastCursorRef.current) {
            queries.push(q.cursorAfter(lastCursorRef.current));
          }
          return queries;
        },
      });

      const newRows = result.rows;
      if (newRows.length < ASSETS_PAGE_SIZE) {
        setHasMore(false);
      }
      if (newRows.length > 0) {
        lastCursorRef.current = newRows[newRows.length - 1].$id;
        setAssets((prev) => [...prev, ...newRows]);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setAssetsLoading(false);
    }
  }, [assetsLoading, hasMore, galleryId]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`/api/v1/galleries/${galleryId}`);
        if (ignore) return;

        if (res.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        if (res.status === 410) {
          const gallery: Galleries = await res.json();
          if (!ignore) setState({ status: "expired", gallery });
          return;
        }
        if (!res.ok) {
          setState({ status: "not-found" });
          return;
        }
        const gallery: Galleries = await res.json();
        if (!ignore) setState({ status: "ready", gallery });
      } catch {
        if (!ignore) setState({ status: "not-found" });
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [galleryId]);

  // ─── Load first page of assets once gallery is ready ──────
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (state.status === "ready" && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadAssets();
    }
  }, [state.status, loadAssets]);

  // ─── Infinite scroll observer ─────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !assetsLoading) {
          loadAssets();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, assetsLoading, loadAssets]);

  if (state.status === "loading") return <GallerySkeleton />;
  if (state.status === "not-found") return <NotFoundState />;
  if (state.status === "expired")
    return <ExpiredState gallery={state.gallery} />;

  const { gallery } = state;
  const photoCount = gallery.totalAssets ?? 0;

  return (
    <div className="min-h-dvh bg-background">
      <SEO title={gallery.name} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* ─── Navbar ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <TransitionLink href="/" className="shrink-0">
              {gallery.coverFileId ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={storage.getFilePreview({
                    bucketId: "gallery-covers",
                    fileId: gallery.coverFileId,
                    width: 64,
                    height: 64,
                    quality: 80,
                  })}
                  alt={gallery.name}
                  className="size-8 rounded-lg object-cover"
                />
              ) : (
                <Image
                  src="/logo.svg"
                  alt="Almost Moments"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg"
                />
              )}
            </TransitionLink>
            <span className="text-sm font-semibold text-foreground truncate">
              {gallery.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={triggerFileInput}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 bg-brand/20 text-sm font-medium text-brand-foreground hover:bg-brand/30 dark:bg-brand/15 dark:text-brand dark:hover:bg-brand/25 transition-colors"
            >
              <Upload className="size-4" />
              <span className="hidden sm:inline">Upload images</span>
            </button>
            <DropdownMenu
              open={downloadMenuOpen}
              onOpenChange={(open) => {
                if (!zipGenerating) setDownloadMenuOpen(open);
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-full flex items-center justify-center bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Download"
                >
                  <Download className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={downloadAsZip}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-full flex items-center justify-center bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Share gallery"
                >
                  <Share2 className="size-4" />
                </button>
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
                    <Check className="size-4 mr-2 text-brand" />
                  ) : (
                    <Copy className="size-4 mr-2" />
                  )}
                  {copied ? "Copied!" : "Copy link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={toggle}
              className="size-9 rounded-full flex items-center justify-center bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots-brand opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-10">
          <div className="animate-slide-up">
            <h1 className="text-4xl sm:text-5xl font-bold font-sans tracking-tight text-foreground">
              {gallery.name}
            </h1>
            {gallery.description && (
              <p className="mt-3 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {gallery.description}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 animate-slide-up stagger-2">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-sm bg-sky/10 text-sky-foreground border-sky/25 dark:bg-sky/10 dark:text-sky dark:border-sky/20"
            >
              <ImageIcon className="size-3.5" />
              {photoCount} {photoCount === 1 ? "photo" : "photos"}
            </Badge>

            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-sm bg-amber/10 text-amber-foreground border-amber/25 dark:bg-amber/10 dark:text-amber dark:border-amber/20"
            >
              <Clock className="size-3.5" />
              {gallery.expiryAt ? (
                <>
                  Expires <RelativeExpiry date={gallery.expiryAt} />
                </>
              ) : (
                "No expiry"
              )}
            </Badge>
          </div>
        </div>
      </header>

      {/* ─── Gallery ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16">
        {photoCount === 0 && !assetsLoading && !hasMore ? (
          <div className="py-20 text-center animate-scale-in">
            <div className="mx-auto mb-5 size-20 rounded-2xl bg-muted flex items-center justify-center">
              <Camera className="size-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold font-sans text-foreground">
              No photos yet
            </h2>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
              Be the first to upload! Share your moments from this event.
            </p>
            <button
              onClick={triggerFileInput}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:opacity-90 transition-opacity"
            >
              <Upload className="size-4" />
              Upload photos
            </button>
          </div>
        ) : (
          <div className="animate-slide-up stagger-3">
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-2">
              {assets.map((asset, index) => (
                <GalleryImage
                  key={asset.$id}
                  asset={asset}
                  onClick={() => setLightboxIndex(index)}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {assetsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 text-muted-foreground animate-spin" />
              </div>
            )}

            <Lightbox
              slides={assets.map((asset) => ({
                src: storage.getFilePreview({
                  bucketId: "assets",
                  fileId: asset.fileId,
                  width: 1920,
                  quality: 90,
                  output: ImageFormat.Webp,
                }),
              }))}
              open={lightboxIndex >= 0}
              index={lightboxIndex}
              close={() => setLightboxIndex(-1)}
              plugins={[Zoom, Fullscreen]}
            />
          </div>
        )}
      </section>

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

      {/* ─── Upload modal ────────────────────────────────────── */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!uploading) {
            setUploadOpen(open);
            if (!open) resetUploadModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {uploadDone ? "Upload complete" : "Upload files"}
            </DialogTitle>
            <DialogDescription>
              {uploadDone
                ? `${uploadedCount} of ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`
                : `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected — ${formatFileSize(selectedFiles.reduce((s, f) => s + f.size, 0))} total`}
            </DialogDescription>
          </DialogHeader>

          {/* File list */}
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
            <ul className="divide-y divide-border">
              {selectedFiles.map((file, i) => {
                const fs = fileStates[i];

                if (fs?.status === "done") {
                  return (
                    <li
                      key={`${file.name}-${file.size}-${i}`}
                      className="flex items-center gap-2 py-1.5"
                    >
                      <p className="text-xs text-muted-foreground truncate min-w-0 flex-1">
                        {file.name}
                      </p>
                      <Check className="size-3.5 text-brand shrink-0" />
                    </li>
                  );
                }

                return (
                  <li
                    key={`${file.name}-${file.size}-${i}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {isVideoFile(file.name) ? (
                        <FileVideo className="size-4 text-muted-foreground" />
                      ) : (
                        <FileImage className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
                          {fs?.status === "failed" && (
                            <>
                              <span className="text-destructive">Failed</span>
                              <button
                                onClick={() => retrySingleFile(i)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-brand transition-colors"
                              >
                                <RotateCcw className="size-3" />
                                Retry
                              </button>
                            </>
                          )}
                          {fs?.status === "uploading" && `${fs.progress}%`}
                          {(!fs || fs.status === "pending") &&
                            formatFileSize(file.size)}
                        </span>
                      </div>
                      {fs &&
                        (fs.status === "uploading" ||
                          fs.status === "failed") && (
                          <Progress
                            value={fs.progress}
                            className={cn(
                              "h-1.5",
                              fs.status === "failed" &&
                                "[&>[data-slot=progress-indicator]]:bg-destructive",
                            )}
                          />
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            {uploadDone ? (
              <Button onClick={resetUploadModal}>Close</Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetUploadModal}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button onClick={startUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      Uploading… {uploadedCount}/{selectedFiles.length}
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 mr-2" />
                      Upload all
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Error modal ─────────────────────────────────── */}
      <Dialog
        open={errorMessage !== null}
        onOpenChange={(open) => {
          if (!open) setErrorMessage(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload Forbidden</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setErrorMessage(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ZIP error modal ─────────────────────────────── */}
      <Dialog
        open={zipError !== null}
        onOpenChange={(open) => {
          if (!open) setZipError(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Download error</DialogTitle>
            <DialogDescription>{zipError}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setZipError(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
