"use client";

import { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
} from "lucide-react";
import QRCode from "qrcode";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";

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
import { cn } from "@/lib/utils";

type GalleryAsset = {
  fileId: string;
};

type Gallery = {
  $id: string;
  $createdAt: string;
  name: string;
  description?: string | null;
  expiryAt?: string | null;
  assets?: GalleryAsset[];
};

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "expired"; gallery: Gallery }
  | { status: "ready"; gallery: Gallery };

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.heic,.mp4,.mov";
const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);
const MAX_CONCURRENT = 5;
const MAX_RETRIES = 3;

// ─── Placeholder photos ────────────────────────────────────────
const PLACEHOLDER_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800",
    width: 800,
    height: 1200,
  },
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
    width: 800,
    height: 1200,
  },
  {
    src: "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    width: 800,
    height: 800,
  },
  {
    src: "https://images.unsplash.com/photo-1472653816316-3ad6f10a6592?w=800",
    width: 800,
    height: 1200,
  },
  {
    src: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800",
    width: 800,
    height: 533,
  },
  {
    src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    width: 800,
    height: 1200,
  },
];

// ─── Helpers ───────────────────────────────────────────────────
function formatRelativeTime(dateString: string): string {
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs < 0;

  const minutes = Math.floor(absDiff / 60_000);
  const hours = Math.floor(absDiff / 3_600_000);
  const days = Math.floor(absDiff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  let label: string;
  if (minutes < 1) label = "just now";
  else if (minutes < 60) label = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  else if (hours < 24) label = `${hours} hour${hours === 1 ? "" : "s"}`;
  else if (days < 7) label = `${days} day${days === 1 ? "" : "s"}`;
  else if (weeks < 5) label = `${weeks} week${weeks === 1 ? "" : "s"}`;
  else label = `${months} month${months === 1 ? "" : "s"}`;

  if (label === "just now") return label;
  return isPast ? `${label} ago` : `in ${label}`;
}

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
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to Almost Moments
        </Link>
      </div>
    </div>
  );
}

function ExpiredState({ gallery }: { gallery: Gallery }) {
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
            {formatRelativeTime(gallery.expiryAt!)}
          </span>
          . The organizer may have set a time limit for uploads. Contact them if
          you think this is a mistake.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to Almost Moments
        </Link>
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

  // Upload state
  type FileStatus = "pending" | "uploading" | "done" | "failed";
  type FileUploadState = { status: FileStatus; progress: number };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const uploadedFileIds = useRef<Map<number, string>>(new Map());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    setFileStates(files.map(() => ({ status: "pending", progress: 0 })));
    uploadedFileIds.current = new Map();
    setUploading(false);
    setFinalizing(false);
    setFinalized(false);
    setUploadOpen(true);
    e.target.value = "";
  }

  function resetUploadModal() {
    setUploadOpen(false);
    setSelectedFiles([]);
    setFileStates([]);
    uploadedFileIds.current = new Map();
    setFinalizing(false);
    setFinalized(false);
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
        const result = await storage.createFile({
          bucketId: "assets",
          fileId: ID.unique(),
          file,
          onProgress: (progress: { sizeUploaded: number }) => {
            const pct =
              file.size > 0
                ? Math.round((progress.sizeUploaded / file.size) * 100)
                : 100;
            updateFileState(idx, { progress: pct });
          },
        });
        uploadedFileIds.current.set(idx, result.$id);
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

  async function finalizeUpload() {
    const fileIds = Array.from(uploadedFileIds.current.values());
    if (fileIds.length === 0) {
      setFinalized(true);
      return;
    }

    setFinalizing(true);
    try {
      const res = await fetch(`/api/v1/galleries/${galleryId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fileIds }),
      });
      if (!res.ok) throw new Error("Failed to attach files to gallery.");
      setFinalized(true);
    } catch {
      setUploadOpen(false);
      setErrorMessage(
        "Something went wrong while saving your uploads to the gallery. Your files were uploaded but may not appear yet.",
      );
    } finally {
      setFinalizing(false);
    }
  }

  async function startUpload() {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    uploadedFileIds.current = new Map();
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
    await finalizeUpload();
  }

  async function retrySingleFile(idx: number) {
    await uploadSingleFile(idx);
  }

  const uploadedCount = fileStates.filter((f) => f.status === "done").length;
  const failedCount = fileStates.filter((f) => f.status === "failed").length;
  const allFilesSettled =
    uploadedCount + failedCount > 0 &&
    uploadedCount + failedCount === selectedFiles.length;
  const uploadDone = !uploading && !finalizing && finalized && allFilesSettled;

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
          const gallery: Gallery = await res.json();
          if (!ignore) setState({ status: "expired", gallery });
          return;
        }
        if (!res.ok) {
          setState({ status: "not-found" });
          return;
        }
        const gallery: Gallery = await res.json();
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

  if (state.status === "loading") return <GallerySkeleton />;
  if (state.status === "not-found") return <NotFoundState />;
  if (state.status === "expired")
    return <ExpiredState gallery={state.gallery} />;

  const { gallery } = state;
  const photoCount = gallery.assets?.length ?? 0;
  const photos = PLACEHOLDER_PHOTOS;

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
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.svg"
                alt="Almost Moments"
                width={32}
                height={32}
                className="size-8 rounded-lg"
              />
            </Link>
            <span className="text-sm font-semibold text-foreground truncate">
              {gallery.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={triggerFileInput}
              className="size-9 rounded-full flex items-center justify-center bg-lime/20 text-lime-foreground hover:bg-lime/30 dark:bg-lime/15 dark:text-lime dark:hover:bg-lime/25 transition-colors"
              aria-label="Upload photos"
            >
              <Upload className="size-4" />
            </button>
            <button
              className="size-9 rounded-full flex items-center justify-center bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Download all as ZIP"
            >
              <Download className="size-4" />
            </button>
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
                    <Check className="size-4 mr-2 text-lime" />
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
        <div className="absolute inset-0 pattern-dots-lime opacity-40 dark:opacity-20 pointer-events-none" />
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
              {gallery.expiryAt
                ? `Expires ${formatRelativeTime(gallery.expiryAt)}`
                : "No expiry"}
            </Badge>
          </div>
        </div>
      </header>

      {/* ─── Gallery ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        {photoCount === 0 ? (
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
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-lime-foreground hover:opacity-90 transition-opacity"
            >
              <Upload className="size-4" />
              Upload photos
            </button>
          </div>
        ) : (
          <div className="animate-slide-up stagger-3">
            <MasonryPhotoAlbum
              photos={photos}
              columns={(containerWidth) => {
                if (containerWidth < 500) return 2;
                if (containerWidth < 900) return 3;
                return 4;
              }}
              spacing={8}
              onClick={({ index }) => setLightboxIndex(index)}
            />

            <Lightbox
              slides={photos}
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
            Guests can scan this code to open the gallery and upload photos.
          </p>
        </DialogContent>
      </Dialog>

      {/* ─── Upload modal ────────────────────────────────────── */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!uploading && !finalizing) {
            setUploadOpen(open);
            if (!open) resetUploadModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {uploadDone
                ? "Upload complete"
                : finalizing
                  ? "Finalizing…"
                  : "Upload files"}
            </DialogTitle>
            <DialogDescription>
              {uploadDone
                ? `${uploadedCount} of ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`
                : finalizing
                  ? "Attaching files to the gallery…"
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
                      <Check className="size-3.5 text-lime shrink-0" />
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
                                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-lime transition-colors"
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
            ) : finalizing ? (
              <Button disabled>Finalizing…</Button>
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
            <DialogTitle>Upload error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setErrorMessage(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
