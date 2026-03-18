"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Image } from "@/components/Image";

export function FeaturedImage({ src, alt }: { src: string; alt: string }) {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  return (
    <>
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl"
        onClick={() => setImageModalOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <span className="text-white font-medium">Click to enlarge</span>
        </div>
      </div>

      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] p-6">
          <DialogTitle className="text-lg font-semibold mb-4">{alt}</DialogTitle>
          <div className="relative w-full h-full max-h-[calc(90vh-6rem)] overflow-hidden rounded-lg">
            <Image src={src} alt={alt} className="w-full h-full object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
