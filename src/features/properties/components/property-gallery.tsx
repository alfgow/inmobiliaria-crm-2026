"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  title: string;
};

const GRADIENT_PLACEHOLDER = (
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-500 to-lime-300">
    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_40%,rgba(17,24,39,0.22)_100%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(210,255,30,0.16),transparent_28%)]" />
  </div>
);

export function PropertyGallery({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;
  const hasThumbs = images.length > 1;

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] bg-brand-surface sm:aspect-[21/9]">
        {hasImages ? (
          <Image
            key={active}
            src={images[active]}
            alt={`${title} — imagen ${active + 1}`}
            fill
            priority={active === 0}
            sizes="(max-width: 1280px) 100vw, 1280px"
            unoptimized
            className="object-cover transition-opacity duration-300"
          />
        ) : (
          GRADIENT_PLACEHOLDER
        )}

        {/* Gradient overlay for text legibility */}
        {hasImages && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        )}

        {/* Prev / Next */}
        {hasThumbs && (
          <>
            <button
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              aria-label="Imagen siguiente"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Counter */}
        {hasImages && (
          <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasThumbs && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              className={[
                "relative h-[68px] w-[96px] shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150",
                i === active
                  ? "border-brand-secondary opacity-100 shadow-[0_0_0_2px_rgba(124,58,237,0.12)]"
                  : "border-transparent opacity-55 hover:opacity-85",
              ].join(" ")}
            >
              <Image
                src={url}
                alt={`Miniatura ${i + 1}`}
                fill
                sizes="96px"
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
