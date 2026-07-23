import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { CTABanner } from "@/components/site/CTABanner";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import portfolioItems from "@/data/portfolio-items.json";
import { getTodayPortfolioItems } from "@/data/product-images";

/* ── Types ─────────────────────────────────────────────────────────── */
interface PortfolioItem {
  id: string;
  category: string;
  categoryLabel: string;
  large: string;
  thumb: string;
  type: "product" | "project";
  title?: string;
}

const getMergedPortfolioItems = (): PortfolioItem[] => {
  const jsonItems = portfolioItems as PortfolioItem[];
  const todayItems = getTodayPortfolioItems();
  
  const seenIds = new Set<string>();
  const merged: PortfolioItem[] = [];
  
  for (const item of [...todayItems, ...jsonItems]) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      merged.push(item);
    }
  }
  
  return merged;
};

const items = getMergedPortfolioItems();

/* ── Derive unique categories (in the order they first appear) ───── */
const categoryOrder = [
  "all",
  "flight-cases",
  "audio-equipment-cases",
  "utility-covers",
  "foam-inserts",
  "shipping-crates",
  "custom-bags",
  "furniture",
  "packaging-solutions",
  "custom-manufacturing",
  "projects",
];

const categoryLabels: Record<string, string> = {
  all: "All",
  "flight-cases": "Flight Cases",
  "audio-equipment-cases": "Audio Equipment Cases",
  "utility-covers": "Utility Covers",
  "foam-inserts": "Foam Inserts",
  "shipping-crates": "Shipping Crates",
  "custom-bags": "Custom Bags",
  furniture: "Furniture",
  "packaging-solutions": "Packaging Solutions",
  "custom-manufacturing": "Custom Manufacturing",
  projects: "Projects",
};

const activeCategories = categoryOrder.filter(
  (slug) => slug === "all" || items.some((i) => i.category === slug),
);

/* ── Route ─────────────────────────────────────────────────────────── */
export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Arabian Cases & Furniture UAE" },
      {
        name: "description",
        content:
          "Selected manufacturing projects across flight cases, covers, foam, crates, bags, exhibition and furniture for UAE clients.",
      },
      { property: "og:title", content: "Portfolio" },
      { property: "og:url", content: "/portfolio" },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Portfolio", url: "/portfolio" },
          ]),
        ),
      },
    ],
  }),
  component: PortfolioPage,
});

/* ── Lightbox ──────────────────────────────────────────────────────── */
function Lightbox({
  items: lbItems,
  startIndex,
  onClose,
}: {
  items: PortfolioItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(
    () => setIndex((i) => (i <= 0 ? lbItems.length - 1 : i - 1)),
    [lbItems.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i >= lbItems.length - 1 ? 0 : i + 1)),
    [lbItems.length],
  );

  /* Keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const current = lbItems[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 50) {
          if (diff > 0) prev();
          else next();
        }
        touchStartX.current = null;
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label="Close"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:left-6 md:h-12 md:w-12"
        aria-label="Previous image"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:right-6 md:h-12 md:w-12"
        aria-label="Next image"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Image */}
      <div
        className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === "product" ? (
          <div className="flex items-center justify-center rounded-2xl bg-white p-6 md:p-10 shadow-2xl">
            <img
              src={current.large}
              alt={current.title || "Custom Case Product"}
              className="max-h-[75vh] max-w-[80vw] object-contain"
              style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.10))" }}
            />
          </div>
        ) : (
          <img
            src={current.large}
            alt={current.title || "Custom Manufacturing Project"}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
          />
        )}
      </div>

      {/* Counter */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
        {index + 1} / {lbItems.length}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
function PortfolioPage() {
  const [filter, setFilter] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const markFailed = (id: string) =>
    setFailedIds((prev) => new Set([...prev, id]));

  const filtered = (
    filter === "all" ? items : items.filter((i) => i.category === filter)
  ).filter((i) => !failedIds.has(i.id));

  return (
    <div>
      {/* Hero header */}
      <div className="bg-brand-navy text-white">
        <div className="container-page py-20 md:py-24">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "Portfolio" }]}
          />
          <h1 className="mt-6 font-display text-4xl md:text-6xl">
            Manufacturing <span className="italic">portfolio</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            A snapshot of recent builds — cases, covers, packaging and
            furniture.
          </p>
        </div>
      </div>

      <Section>
        {/* Category filters */}
        <div className="mb-10 flex flex-wrap gap-2">
          {activeCategories.map((slug) => (
            <button
              key={slug}
              onClick={() => setFilter(slug)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200",
                filter === slug
                  ? "border-brand-navy bg-brand-navy text-white shadow-md"
                  : "border-brand-border bg-white text-brand-dark-gray hover:border-brand-navy hover:shadow-sm",
              )}
            >
              {categoryLabels[slug] ?? slug}
              {slug !== "all" && (
                <span className="ml-1.5 opacity-50">
                  {items.filter((i) => i.category === slug).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="mb-4 break-inside-avoid"
              style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
            >
              <button
                onClick={() => setLightboxIndex(idx)}
                className={cn(
                  "group block w-full overflow-hidden rounded-[18px] border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-navy/40 focus:ring-offset-2",
                  item.type === "product"
                    ? "border-brand-border bg-white p-5 shadow-sm hover:shadow-lg"
                    : "border-brand-border bg-brand-soft shadow-sm hover:shadow-lg",
                )}
              >
                {item.type === "product" ? (
                  /* ── Product showcase card ── */
                  <div className="flex aspect-square items-center justify-center">
                    <img
                      src={item.thumb}
                      alt={item.title || "Custom Case Product"}
                      loading="lazy"
                      onError={() => markFailed(item.id)}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      style={{
                        filter:
                          "drop-shadow(0 10px 20px rgba(0,0,0,0.08))",
                      }}
                    />
                  </div>
                ) : (
                  /* ── Project photo card ── */
                  <div className="relative overflow-hidden rounded-[12px]">
                    <img
                      src={item.thumb}
                      alt={item.title || "Custom Manufacturing Project"}
                      loading="lazy"
                      onError={() => markFailed(item.id)}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-brand-text-secondary">
            No items in this category yet.
          </p>
        )}
      </Section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <CTABanner />
    </div>
  );
}