"use client";

import { Button } from "@/components/ui/button";
import { Plus, Images } from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-sans text-2xl font-bold">My Galleries</h1>
        <Button className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold">
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
        <Button className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold">
          <Plus className="size-4 mr-1.5" />
          Create Your First Gallery
        </Button>
      </div>
    </div>
  );
}
