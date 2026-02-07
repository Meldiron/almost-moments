"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEO } from "@/components/seo";
import {
  Plus,
  Images,
  Info,
  Loader2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { databases, type Galleries } from "@/lib/generated/appwrite";
import { useAuth } from "@/lib/auth-context";

const PAGE_SIZE = 12;
const galleriesTable = databases.use("main").use("galleries");

function computeExpiryDate(
  duration: string,
  customDays: string,
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
      const days = parseInt(customDays, 10);
      if (!days || days < 1) return null;
      now.setDate(now.getDate() + days);
      return now.toISOString();
    }
    default:
      return null;
  }
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Gallery list state
  const [galleries, setGalleries] = useState<Galleries[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Create modal state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("1-month");
  const [customDays, setCustomDays] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchGalleries = useCallback(async (cursor?: string) => {
    const result = await galleriesTable.list({
      queries: (q) => {
        const queries = [q.orderDesc("$createdAt"), q.limit(PAGE_SIZE)];
        if (cursor) queries.push(q.cursorAfter(cursor));
        return queries;
      },
    });
    return result;
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGalleries().then((result) => {
      if (cancelled) return;
      setGalleries(result.rows);
      setTotal(result.total);
      setHasMore(result.rows.length === PAGE_SIZE);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchGalleries]);

  async function loadMore() {
    if (!galleries.length) return;
    setLoadingMore(true);
    const lastId = galleries[galleries.length - 1].$id;
    const result = await fetchGalleries(lastId);
    setGalleries((prev) => [...prev, ...result.rows]);
    setHasMore(result.rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setDuration("1-month");
    setCustomDays("");
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
      const expiryAt = computeExpiryDate(duration, customDays);
      const gallery = await galleriesTable.create(
        {
          name: name.trim(),
          description: description.trim() || null,
          expiryAt,
        },
        {
          permissions: (permission, role) => [
            permission.read(role.user(user.$id)),
            permission.write(role.user(user.$id)),
          ],
        },
      );
      setGalleries((prev) => [gallery, ...prev]);
      setTotal((prev) => prev + 1);
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

  const isEmpty = !loading && galleries.length === 0;

  return (
    <div>
      <SEO title="My Galleries" />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold">My Galleries</h1>
          {!loading && total > 0 && (
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

      {/* Gallery list */}
      {!loading && galleries.length > 0 && (
        <div className="space-y-3">
          {galleries.map((gallery) => {
            const isExpired =
              gallery.expiryAt && new Date(gallery.expiryAt) < new Date();
            const expiryLabel = gallery.expiryAt
              ? isExpired
                ? "Expired"
                : `Expires ${new Date(gallery.expiryAt).toLocaleDateString()}`
              : "Never expires";

            return (
              <div
                key={gallery.$id}
                className="group rounded-2xl border border-border bg-card p-5 sm:p-6 flex items-center gap-4 hover:border-lime/40 transition-colors cursor-pointer"
              >
                <div className="size-12 rounded-xl bg-lime/15 flex items-center justify-center shrink-0">
                  <Images className="size-5 text-lime" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans font-semibold truncate">
                    {gallery.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {new Date(gallery.$createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={
                        isExpired ? "text-destructive" : "text-muted-foreground"
                      }
                    >
                      {expiryLabel}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
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
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {duration === "custom" && (
                  <div className="flex items-center gap-3 pt-1">
                    <Input
                      type="number"
                      min="1"
                      placeholder="30"
                      className="rounded-xl h-9 w-28"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
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
    </div>
  );
}
