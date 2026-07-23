import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Section, SectionHeader } from "@/components/site/Section";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getProduct, type Category, type Product } from "@/data/catalog";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { getProductImages } from "@/data/product-images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$category/$product")({
  loader: ({ params }) => {
    const data = getProduct(params.category, params.product);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { category: c, product: p } = loaderData;
    const imgSet = getProductImages(p.title);
    const mainImg = imgSet.mainImage?.large || c.image;
    return {
      meta: [
        { title: `${p.title} — ${c.title} UAE | Arabian Cases & Furniture` },
        { name: "description", content: p.description },
        { name: "keywords", content: `${p.title} UAE, ${p.title} Dubai, custom ${p.title.toLowerCase()}, ${c.imageName}` },
        { property: "og:title", content: `${p.title} — ${c.title}` },
        { property: "og:description", content: p.description },
        { property: "og:image", content: mainImg },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/products/${params.category}/${params.product}` },
      ],
      links: [{ rel: "canonical", href: `/products/${params.category}/${params.product}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: c.title, url: `/products/${params.category}` },
          { name: p.title, url: `/products/${params.category}/${params.product}` },
        ])) },
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(p.faqs)) },
        { type: "application/ld+json", children: JSON.stringify({
          "@context": "https://schema.org", "@type": "Product",
          name: p.title, description: p.description, image: mainImg,
          brand: { "@type": "Brand", name: "Arabian Cases & Furniture" },
          category: c.title,
          offers: { "@type": "Offer", availability: "https://schema.org/InStock", areaServed: "AE", priceCurrency: "AED" },
        }) },
      ],
    };
  },
  notFoundComponent: () => (<Section><h1 className="font-display text-3xl text-brand-navy">Product not found</h1></Section>),
  errorComponent: ({ error }) => (<Section><h1 className="font-display text-3xl text-brand-navy">Something went wrong</h1><p className="mt-3 text-brand-text-secondary">{error.message}</p></Section>),
  component: ProductPage,
});

function ProductPage() {
  const { category: c, product: p } = Route.useLoaderData() as { category: Category; product: Product };
  const [activeImg, setActiveImg] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const imgSet = getProductImages(p.title);
  const gallery = imgSet.mainImage
    ? [imgSet.mainImage, ...imgSet.galleryImages]
    : [{ large: c.image, thumb: c.image, type: "project" as const }];

  const features = p.features.slice(0, 6);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe right (prev image)
        setActiveImg((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
      } else {
        // Swipe left (next image)
        setActiveImg((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
      }
    }
    setTouchStartX(null);
  };

  return (
    <div>
      <div className="bg-brand-soft border-b border-brand-border">
        <div className="container-page py-6">
          <Breadcrumbs items={[
            { label: "Home", to: "/" },
            { label: "Products", to: "/products" },
            { label: c.title, to: "/products/$category", params: { category: c.slug } },
            { label: p.title },
          ]} />
        </div>
      </div>

      {/* SECTION 1 — Hero with Amazon-style gallery */}
      <Section className="!py-14 md:!py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-start">
          <div>
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={cn(
                "relative overflow-hidden rounded-[22px] border border-brand-border shadow-sm flex items-center justify-center transition-colors select-none",
                gallery[activeImg]?.type === "product" ? "bg-white p-6 md:p-8" : "bg-brand-soft"
              )}
            >
              <img
                src={gallery[activeImg]?.large}
                alt={p.imageAlt}
                loading="eager"
                className={cn(
                  "aspect-[4/3] w-full transition-opacity duration-300",
                  gallery[activeImg]?.type === "product" ? "object-contain" : "object-cover"
                )}
                style={gallery[activeImg]?.type === "product" ? { filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.08))" } : undefined}
              />
              {/* Made in Dubai badge */}
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-navy backdrop-blur">
                Made in Dubai
              </span>
              {/* Prev / Next arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur transition hover:bg-white hover:scale-110 active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5 text-brand-navy" />
                  </button>
                  <button
                    onClick={() => setActiveImg((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur transition hover:bg-white hover:scale-110 active:scale-95"
                  >
                    <ChevronRight className="h-5 w-5 text-brand-navy" />
                  </button>
                  {/* Image counter */}
                  <span className="absolute bottom-3 right-4 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                    {activeImg + 1} / {gallery.length}
                  </span>
                </>
              )}
            </div>
            {/* Thumbnails — desktop grid, mobile swipe */}
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    className={cn(
                      "relative shrink-0 snap-start overflow-hidden rounded-[12px] border-2 transition flex items-center justify-center",
                      activeImg === i ? "border-brand-navy" : "border-brand-border hover:border-brand-navy/40",
                      item.type === "product" ? "bg-white h-20 w-24 p-2 sm:h-24 sm:w-28" : "bg-brand-soft h-20 w-24 sm:h-24 sm:w-28"
                    )}
                  >
                    <img
                      src={item.thumb}
                      alt=""
                      loading="lazy"
                      className={cn(
                        "h-full w-full",
                        item.type === "product" ? "object-contain" : "object-cover"
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold">{c.title}</p>
            <h1 className="mt-3 font-display text-brand-navy">{p.title}</h1>
            <p className="mt-5 text-sm md:text-base text-brand-text-secondary leading-relaxed">{p.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-navy/15 transition hover:bg-brand-navy-hover hover:scale-[1.02]">
                Get Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <WhatsAppButton message={`Hi, I'd like a quote for ${p.title}.`} />
            </div>
          </div>
        </div>
      </Section>

      {/* SECTION 2 — Key Features */}
      <Section className="bg-brand-soft !py-16 md:!py-20">
        <SectionHeader eyebrow="Key Features" title="Engineered for professional use" align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f} className="group rounded-[18px] border border-brand-border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-navy/5 text-brand-navy transition group-hover:bg-brand-navy group-hover:text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-4 font-medium text-brand-navy leading-snug">{f}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 3 — Description (two-column) */}
      <Section className="!py-16 md:!py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold">Product Description</p>
            <h2 className="font-display text-brand-navy">Built in our Dubai facility</h2>
            <div className="mt-5 space-y-4 text-brand-text-secondary leading-relaxed">
              <p>{p.description}</p>
              <p>
                Each {p.title.toLowerCase()} is fully customisable — dimensions, internal layout, finish and branding
                tailored to your application for an exact fit with your equipment and brand standards.
              </p>
            </div>
          </div>
          <div className={cn(
            "overflow-hidden rounded-[22px] border border-brand-border flex items-center justify-center transition-colors",
            gallery[0]?.type === "product" ? "bg-white p-6 md:p-8" : "bg-brand-soft"
          )}>
            <img
              src={gallery[0]?.large || c.image}
              alt={p.imageAlt}
              loading="lazy"
              className={cn(
                "aspect-[4/3] w-full transition duration-700 hover:scale-[1.03]",
                gallery[0]?.type === "product" ? "object-contain" : "object-cover"
              )}
              style={gallery[0]?.type === "product" ? { filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.08))" } : undefined}
            />
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-brand-soft !py-16 md:!py-20">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions" align="center" />
        <div className="mx-auto max-w-3xl"><FAQ items={p.faqs} /></div>
      </Section>

      {/* SECTION 7 — CTA Banner */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-[24px] bg-brand-navy px-8 py-14 md:px-16 md:py-16 text-white">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-gold">Get in touch</p>
              <h2 className="mt-3 font-display text-white">Need a Custom Solution?</h2>
              <p className="mt-3 text-white/75 max-w-lg leading-relaxed">
                Talk to our manufacturing team about your {p.title.toLowerCase()} requirements — we'll respond within 24 hours.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-navy transition hover:scale-[1.03]">
                  Get Quote <ArrowRight className="h-4 w-4" />
                </Link>
                <WhatsAppButton message={`Hi, I'd like a quote for ${p.title}.`} />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <a href={`tel:${SITE.phoneIntl}`} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10">
                <Phone className="h-4 w-4 text-brand-gold" /> <span>{SITE.phone}</span>
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10">
                <Mail className="h-4 w-4 text-brand-gold" /> <span>{SITE.email}</span>
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <ShieldCheck className="h-4 w-4 text-brand-gold" /> <span>Manufactured in Dubai, UAE</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}