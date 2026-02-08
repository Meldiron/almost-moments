"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useViewTransitionRouter } from "@/lib/view-transitions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Image from "next/image";
import { SEO } from "@/components/seo";
import { RelativeExpiry } from "@/components/relative-expiry";
import {
  Plus,
  Images,
  Info,
  Loader2,
  Camera,
  ImageIcon,
  Share2,
  QrCode,
  Copy,
  ExternalLink,
  Check,
  Settings,
  Search,
  ArrowUpDown,
  X,
  Clock,
  AlertTriangle,
  CalendarDays,
  FileText,
  Star,
} from "lucide-react";
import QRCode from "qrcode";
import { databases, type Galleries } from "@/lib/generated/appwrite";
import { account, storage, ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";

const PAGE_SIZE = 12;
const galleriesTable = databases.use("main").use("galleries");

type FilterId =
  | "favourites"
  | "expired"
  | "expiring-soon"
  | "created-this-year"
  | "never-expires"
  | "has-description";

type SortOption = "created-desc" | "created-asc" | "expiry-desc" | "expiry-asc";

const FILTERS: {
  id: FilterId;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "favourites", label: "Favourites only", icon: Star },
  { id: "expired", label: "Expired", icon: AlertTriangle },
  { id: "expiring-soon", label: "Expiring soon", icon: Clock },
  { id: "created-this-year", label: "Created this year", icon: CalendarDays },
  { id: "has-description", label: "Has description", icon: FileText },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "created-desc", label: "Newest first" },
  { value: "created-asc", label: "Oldest first" },
];

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
      // Set to end of the selected day
      const date = new Date(customDate);
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    }
    default:
      return null;
  }
}

export default function DashboardPage() {
  const { user, softRefresh } = useAuth();
  const router = useViewTransitionRouter();

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>("created-desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Gallery list state
  const [galleries, setGalleries] = useState<Galleries[]>([]);
  const [favouriteGalleries, setFavouriteGalleries] = useState<Galleries[]>([]);
  const [total, setTotal] = useState(0);
  const [hasAnyGalleries, setHasAnyGalleries] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Favourites state
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  // Load favourites from user prefs
  useEffect(() => {
    if (!user) return;
    const ids: string[] =
      ((user.prefs as Record<string, unknown>)?.favouriteGalleryIds as
        | string[]
        | undefined) ?? [];
    setFavouriteIds(new Set(ids));
  }, [user]);

  async function toggleFavourite(galleryId: string) {
    const wasFavourite = favouriteIds.has(galleryId);
    const next = new Set(favouriteIds);
    if (wasFavourite) {
      next.delete(galleryId);
    } else {
      next.add(galleryId);
    }
    setFavouriteIds(next);

    // Update local favouriteGalleries list
    if (wasFavourite) {
      setFavouriteGalleries((prev) => prev.filter((g) => g.$id !== galleryId));
    } else {
      // Move from regular list to favourites
      const gallery = galleries.find((g) => g.$id === galleryId);
      if (gallery) {
        setFavouriteGalleries((prev) => [...prev, gallery]);
      }
    }

    try {
      await account.updatePrefs({
        ...user?.prefs,
        favouriteGalleryIds: Array.from(next),
      });
      await softRefresh();
    } catch {
      // Revert on failure
      setFavouriteIds(favouriteIds);
      if (wasFavourite) {
        const gallery = galleries.find((g) => g.$id === galleryId);
        if (gallery) {
          setFavouriteGalleries((prev) => [...prev, gallery]);
        }
      } else {
        setFavouriteGalleries((prev) =>
          prev.filter((g) => g.$id !== galleryId),
        );
      }
    }
  }

  // QR modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrGalleryName, setQrGalleryName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function getGalleryUrl(galleryId: string) {
    return `${window.location.origin}/g/${galleryId}`;
  }

  async function openQrModal(gallery: Galleries) {
    const url = getGalleryUrl(gallery.$id);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
    setQrGalleryName(gallery.name);
    setQrOpen(true);
  }

  async function copyLink(galleryId: string) {
    const url = getGalleryUrl(galleryId);
    await navigator.clipboard.writeText(url);
    setCopied(galleryId);
    setTimeout(() => setCopied(null), 2000);
  }

  function openLink(galleryId: string) {
    window.open(getGalleryUrl(galleryId), "_blank");
  }

  // Cover upload state
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverTargetRef = useRef<string | null>(null);
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);

  function triggerCoverUpload(galleryId: string) {
    coverTargetRef.current = galleryId;
    coverInputRef.current?.click();
  }

  async function handleCoverSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const galleryId = coverTargetRef.current;
    e.target.value = "";
    if (!file || !galleryId) return;

    setUploadingCoverId(galleryId);
    try {
      const result = await storage.createFile({
        bucketId: "gallery-covers",
        fileId: ID.unique(),
        file,
      });
      await galleriesTable.update(galleryId, { coverFileId: result.$id });

      // Update local state
      const updateGallery = (g: Galleries) =>
        g.$id === galleryId ? { ...g, coverFileId: result.$id } : g;
      setGalleries((prev) => prev.map(updateGallery));
      setFavouriteGalleries((prev) => prev.map(updateGallery));
    } catch {
      // Silently fail — user can retry
    } finally {
      setUploadingCoverId(null);
    }
  }

  // Create modal state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("1-month");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Debounce search input
  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 300);
  }

  function toggleFilter(id: FilterId) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearAllFilters() {
    setActiveFilters(new Set());
    setSearchQuery("");
    setDebouncedSearch("");
  }

  // Client-side filter for things Appwrite can't query (assets count, favourites, etc.)
  function applyClientFilters(rows: Galleries[]): Galleries[] {
    let filtered = rows;
    for (const filterId of activeFilters) {
      switch (filterId) {
        case "has-description":
          filtered = filtered.filter(
            (g) => g.description && g.description.trim().length > 0,
          );
          break;
      }
    }
    return filtered;
  }

  const needsClientFilter = activeFilters.has("has-description");

  function buildServerQueries(
    q: Parameters<
      NonNullable<
        NonNullable<Parameters<typeof galleriesTable.list>[0]>["queries"]
      >
    >[0],
    cursor?: string,
  ): string[] {
    const queries: string[] = [];

    // Search
    if (debouncedSearch) {
      queries.push(
        q.or(
          q.search("name", debouncedSearch),
          q.search("description", debouncedSearch),
        ),
      );
    }

    // Server-side filters
    const now = new Date().toISOString();
    for (const filterId of activeFilters) {
      switch (filterId) {
        case "expired":
          queries.push(q.lessThan("expiryAt", now));
          queries.push(q.isNotNull("expiryAt"));
          break;
        case "expiring-soon": {
          const soon = new Date();
          soon.setDate(soon.getDate() + 7);
          queries.push(q.greaterThanEqual("expiryAt", now));
          queries.push(q.lessThanEqual("expiryAt", soon.toISOString()));
          break;
        }
        case "created-this-year": {
          const yearStart = new Date(
            new Date().getFullYear(),
            0,
            1,
          ).toISOString();
          queries.push(q.greaterThanEqual("$createdAt", yearStart));
          break;
        }
        case "never-expires":
          queries.push(q.isNull("expiryAt"));
          break;
      }
    }

    // Sort
    switch (sortOption) {
      case "created-desc":
        queries.push(q.orderDesc("$createdAt"));
        break;
      case "created-asc":
        queries.push(q.orderAsc("$createdAt"));
        break;
      case "expiry-desc":
        queries.push(q.orderDesc("expiryAt"));
        break;
      case "expiry-asc":
        queries.push(q.orderAsc("expiryAt"));
        break;
    }

    queries.push(q.limit(PAGE_SIZE));
    if (cursor) queries.push(q.cursorAfter(cursor));
    return queries;
  }

  const fetchGalleries = useCallback(
    async (cursor?: string) => {
      return galleriesTable.list({
        queries: (q) => buildServerQueries(q, cursor),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, activeFilters, sortOption],
  );

  const fetchFavourites = useCallback(async () => {
    if (favouriteIds.size === 0) return [];
    const ids = Array.from(favouriteIds);
    const result = await galleriesTable.list({
      queries: (q) => {
        const queries: string[] = [q.equal("$id", ids as unknown as string)];

        // Apply the same server-side filters + search so favourites respect them
        if (debouncedSearch) {
          queries.push(
            q.or(
              q.search("name", debouncedSearch),
              q.search("description", debouncedSearch),
            ),
          );
        }

        const now = new Date().toISOString();
        for (const filterId of activeFilters) {
          switch (filterId) {
            case "expired":
              queries.push(q.lessThan("expiryAt", now));
              queries.push(q.isNotNull("expiryAt"));
              break;
            case "expiring-soon": {
              const soon = new Date();
              soon.setDate(soon.getDate() + 7);
              queries.push(q.greaterThanEqual("expiryAt", now));
              queries.push(q.lessThanEqual("expiryAt", soon.toISOString()));
              break;
            }
            case "created-this-year": {
              const yearStart = new Date(
                new Date().getFullYear(),
                0,
                1,
              ).toISOString();
              queries.push(q.greaterThanEqual("$createdAt", yearStart));
              break;
            }
            case "never-expires":
              queries.push(q.isNull("expiryAt"));
              break;
          }
        }

        queries.push(q.limit(25));
        return queries;
      },
    });
    let rows = result.rows;
    if (needsClientFilter) rows = applyClientFilters(rows);
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeFilters]);

  // Re-fetch when search/filter/sort/favourites changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchGalleries(), fetchFavourites()]).then(
      ([result, favs]) => {
        if (cancelled) return;
        const rows = needsClientFilter
          ? applyClientFilters(result.rows)
          : result.rows;
        setGalleries(rows);
        setFavouriteGalleries(favs);
        setTotal(result.total);
        if (result.total > 0 || favs.length > 0) setHasAnyGalleries(true);
        setHasMore(result.rows.length === PAGE_SIZE);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchGalleries, fetchFavourites]);

  async function loadMore() {
    if (!galleries.length) return;
    setLoadingMore(true);
    const lastId = galleries[galleries.length - 1].$id;
    const result = await fetchGalleries(lastId);
    const rows = needsClientFilter
      ? applyClientFilters(result.rows)
      : result.rows;
    setGalleries((prev) => [...prev, ...rows]);
    setHasMore(result.rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setDuration("1-month");
    setCustomDate(undefined);
    setError("");
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) resetForm();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setError("");
    setCreating(true);
    try {
      const expiryAt = computeExpiryDate(duration, customDate);
      const gallery = await galleriesTable.create({
        name: name.trim(),
        description: description.trim() || null,
        expiryAt,
        totalAssets: 0,
      });
      setGalleries((prev) => [gallery, ...prev]);
      setTotal((prev) => prev + 1);
      setHasAnyGalleries(true);
      setOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create gallery.";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  const hasFiltersActive = activeFilters.size > 0 || debouncedSearch.length > 0;

  // When "Favourites only" filter is active, only show favourite galleries
  const showFavouritesOnly = activeFilters.has("favourites");

  // Deduplicated regular galleries (exclude ones already in favourites)
  const favIdSet = new Set(favouriteGalleries.map((g) => g.$id));
  const regularGalleries = showFavouritesOnly
    ? []
    : galleries.filter((g) => !favIdSet.has(g.$id));

  // Combined list for empty-state checks
  const allVisible = [...favouriteGalleries, ...regularGalleries];
  const isEmpty =
    !loading && allVisible.length === 0 && total === 0 && !hasFiltersActive;
  const noResults = !loading && allVisible.length === 0 && hasFiltersActive;

  return (
    <div>
      <SEO title="My Galleries" />

      {/* Hidden cover file input */}
      <input
        ref={coverInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.heic"
        onChange={handleCoverSelected}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold">My Galleries</h1>
          {loading && total === 0 && (
            <div className="h-5 w-24 rounded bg-muted animate-pulse mt-1" />
          )}
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {total} {total === 1 ? "gallery" : "galleries"}
            </p>
          )}
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
        >
          <Plus className="size-4 mr-1.5" />
          Create Gallery
        </Button>
      </div>

      {/* Search, filters, sort */}
      {hasAnyGalleries && (
        <div className="space-y-3 mb-6">
          {/* Search + sort row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search galleries..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 rounded-xl h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Select
              value={sortOption}
              onValueChange={(v) => setSortOption(v as SortOption)}
            >
              <SelectTrigger className="w-[180px] rounded-xl h-10">
                <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilters.has(filter.id);
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {filter.label}
                </button>
              );
            })}
            {(activeFilters.size > 0 || debouncedSearch) && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="size-16 rounded-2xl bg-lime/15 flex items-center justify-center mx-auto mb-5">
            <Images className="size-8 text-lime" />
          </div>
          <h2 className="font-sans text-lg font-semibold mb-2">
            No galleries yet
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Create your first gallery and start collecting photos from your
            guests. It only takes a few seconds!
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
          >
            <Plus className="size-4 mr-1.5" />
            Create Your First Gallery
          </Button>
        </div>
      )}

      {/* No results for filters */}
      {noResults && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h2 className="font-sans text-lg font-semibold mb-2">
            No galleries found
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Try adjusting your search or filters to find what you&apos;re
            looking for.
          </p>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            className="rounded-full"
          >
            <X className="size-4 mr-1.5" />
            Clear all filters
          </Button>
        </div>
      )}

      {/* Gallery grid */}
      {!loading && allVisible.length > 0 && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVisible.map((gallery) => {
              const photoCount = gallery.totalAssets ?? 0;
              const isExpired =
                gallery.expiryAt && new Date(gallery.expiryAt) < new Date();
              const hasExpiry = !!gallery.expiryAt;

              return (
                <div
                  key={gallery.$id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  {/* Cover + photo count + favourite */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => triggerCoverUpload(gallery.$id)}
                        disabled={uploadingCoverId === gallery.$id}
                        className="size-11 rounded-xl bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-foreground/20 transition-all disabled:opacity-50"
                        title="Set cover image"
                      >
                        {uploadingCoverId === gallery.$id ? (
                          <Loader2 className="size-5 text-muted-foreground animate-spin" />
                        ) : gallery.coverFileId ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={storage.getFilePreview({
                              bucketId: "gallery-covers",
                              fileId: gallery.coverFileId,
                              width: 88,
                              height: 88,
                              quality: 80,
                            })}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Camera className="size-5 text-muted-foreground" />
                        )}
                      </button>
                      <div
                        className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        title="Total memories"
                      >
                        <ImageIcon className="size-3.5" />
                        <span className="font-medium">{photoCount}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavourite(gallery.$id)}
                      className="transition-colors"
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

                  {/* Name */}
                  <h3 className="font-sans font-bold text-lg truncate mb-1">
                    {gallery.name}
                  </h3>

                  {/* Description */}
                  {gallery.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {gallery.description}
                    </p>
                  )}
                  {!gallery.description && <div className="mb-3" />}

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                        Created on
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {formatVerboseDate(new Date(gallery.$createdAt))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                        Expires
                      </p>
                      <p
                        className={`text-xs font-medium ${isExpired ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {hasExpiry ? (
                          <RelativeExpiry date={gallery.expiryAt!} />
                        ) : (
                          "Never"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions — pinned to bottom */}
                  <div className="mt-auto flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="rounded-lg bg-lime text-lime-foreground hover:bg-lime/90 font-semibold flex-1"
                        >
                          <Share2 className="size-4 mr-1.5" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuItem
                          onClick={() => openQrModal(gallery)}
                          className="cursor-pointer"
                        >
                          <QrCode className="size-4 mr-2" />
                          QR code
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyLink(gallery.$id)}
                          className="cursor-pointer"
                        >
                          {copied === gallery.$id ? (
                            <Check className="size-4 mr-2 text-lime" />
                          ) : (
                            <Copy className="size-4 mr-2" />
                          )}
                          {copied === gallery.$id ? "Copied!" : "Copy link"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openLink(gallery.$id)}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="size-4 mr-2" />
                          Open link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg flex-1"
                      onClick={() =>
                        router.push(`/dashboard/gallery/${gallery.$id}`)
                      }
                    >
                      <Settings className="size-4 mr-1.5" />
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && !showFavouritesOnly && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full"
              >
                {loadingMore ? (
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
      )}

      {/* Create gallery modal */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a gallery</DialogTitle>
            <DialogDescription>
              Set up a shared gallery for your event. Guests will be able to
              upload and browse photos using a link or QR code.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate}>
            <div className="space-y-5 py-2">
              {/* Gallery name */}
              <div className="space-y-2">
                <Label htmlFor="gallery-name">
                  Gallery name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gallery-name"
                  placeholder="e.g. Sarah & Tom's Wedding"
                  className="rounded-xl h-12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="gallery-description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="gallery-description"
                  placeholder="A short note about the event"
                  className="rounded-xl h-12"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Link duration */}
              <div className="space-y-2">
                <Label>Link duration</Label>
                <Select value={duration} onValueChange={setDuration}>
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

                {duration === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl h-12 w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="size-4 mr-2 text-muted-foreground" />
                        {customDate ? (
                          customDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        ) : (
                          <span className="text-muted-foreground">
                            Pick a date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDate}
                        onSelect={setCustomDate}
                        disabled={{ before: new Date() }}
                        defaultMonth={customDate ?? new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}

                <div className="flex gap-2.5 rounded-xl bg-muted/50 border border-border p-3 mt-2">
                  <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your gallery and photos are kept forever. This only controls
                    how long guests can upload, view, and download photos via
                    the shared link.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={creating}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || creating}
                className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
              >
                {creating ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Gallery"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR code modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>{qrGalleryName}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {qrDataUrl && (
              <Image
                src={qrDataUrl}
                alt={`QR code for ${qrGalleryName}`}
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
