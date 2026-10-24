import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

type BtnVariant = "primary" | "ink" | "soft" | "outline" | "ghost" | "volt";
type BtnSize = "sm" | "md" | "lg";

const VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep hover:shadow-glow",
  ink: "bg-ink text-white hover:bg-brand-deep",
  soft: "bg-brand-soft text-brand-deep hover:bg-emerald-100",
  outline: "bg-white text-ink border border-line-strong hover:border-ink hover:bg-white",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  volt: "bg-volt text-ink hover:brightness-95 shadow-[0_8px_24px_-10px_rgba(47,182,115,0.7)]",
};
const SIZES: Record<BtnSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-[15px] gap-2.5",
};

/** Class-name helper so the same look can be used on <button>, <a> and <Link>. */
export function btn(variant: BtnVariant = "primary", size: BtnSize = "md", extra = "") {
  return cx(
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full font-bold tracking-tight transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cx("mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center", className)}>
      <div className={cx("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[1.08] text-ink sm:text-4xl lg:text-[2.6rem]">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft sm:text-base">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-deep">
          {hrefLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function Chip({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "brand" | "sun" | "sky" | "coral" | "volt"; className?: string }) {
  const tones = {
    neutral: "bg-paper border border-line-strong text-ink font-semibold",
    brand: "bg-brand-soft border border-brand/20 text-brand-deep font-bold",
    sun: "bg-sun-soft border border-sun/30 text-[#0a4a30] font-bold",
    sky: "bg-sky-soft border border-sky/30 text-[#0a4a30] font-bold",
    coral: "bg-coral-soft border border-coral/30 text-[#0a4a30] font-bold",
    volt: "bg-volt text-ink font-bold",
  } as const;
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none", tones[tone], className)}>{children}</span>;
}

/** Page header used by inner pages: eyebrow, big title, lead, optional right content. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("hero-aurora relative overflow-hidden border-b border-line pt-28 pb-10 sm:pt-32 sm:pb-14", className)}>
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <Container className="relative">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-3 max-w-3xl text-[2.2rem] font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-[3.4rem]">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft sm:text-lg">{description}</p>}
        {children && <div className="mt-7">{children}</div>}
      </Container>
    </section>
  );
}

export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: any }) {
  return <Tag className={cx("rounded-3xl border border-line bg-white shadow-card", className)}>{children}</Tag>;
}
