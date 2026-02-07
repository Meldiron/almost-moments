"use client";

import { useState } from "react";
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
import { Plus, Images, Info } from "lucide-react";

export default function DashboardPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("1-month");
  const [customDays, setCustomDays] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setDuration("1-month");
    setCustomDays("");
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) resetForm();
  }

  function handleCreate() {
    if (!name.trim()) return;
    // TODO: create gallery via Appwrite
    setOpen(false);
    resetForm();
  }

  return (
    <div>
      <SEO title="My Galleries" />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-sans text-2xl font-bold">My Galleries</h1>
        <Button
          onClick={() => setOpen(true)}
          className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
        >
          <Plus className="size-4 mr-1.5" />
          Create Gallery
        </Button>
      </div>

      {/* Empty state */}
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
                  how long guests can upload, view, and download photos via the
                  shared link.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90 font-semibold"
            >
              Create Gallery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
