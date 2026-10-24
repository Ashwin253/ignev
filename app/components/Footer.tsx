import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { COMPANY, DISCOVER, SERVICES, TOOLS, VEHICLE_TYPES } from "../lib/nav";
import FooterCta from "./FooterCta";
import FooterApp from "./FooterApp";

const socials = [
  { name: "Facebook", icon: FaFacebook, href: "https://www.facebook.com" },
  { name: "Twitter", icon: FaTwitter, href: "https://twitter.com" },
  { name: "Instagram", icon: FaInstagram, href: "https://www.instagram.com" },
  { name: "YouTube", icon: FaYoutube, href: "https://www.youtube.com" },
];

function Col({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-[13px] font-extrabold uppercase tracking-[0.14em] text-ink">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-[14px] font-medium text-ink-soft transition-colors hover:text-brand">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line bg-white pb-24 md:pb-0">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* CTA band */}
        <FooterCta />

        <div className="grid gap-12 py-14 lg:grid-cols-[1.3fr_2.7fr]">
          <div>
            <Image src="/evplsenewlogo.png" alt="EVPLSE" width={180} height={48} className="h-11 w-auto" style={{ width: "auto" }} />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              India&apos;s premier marketplace for electric and hybrid vehicles. Making sustainable mobility accessible to everyone.
            </p>
            <a href="mailto:evplseadmin@gmail.com" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ink hover:text-brand">
              <Mail size={16} className="text-brand" /> evplseadmin@gmail.com
            </a>
            <div className="mt-6 flex gap-2.5">
              {socials.map(({ name, icon: Icon, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line-strong text-ink transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            <Col title="Explore" links={[...VEHICLE_TYPES.map((l) => ({ label: l.label, href: l.href })), { label: "All vehicles", href: "/catalog" }]} />
            <Col title="Discover" links={[...DISCOVER.map((l) => ({ label: l.label, href: l.href })), { label: "Charging stations", href: "/charging-station" }, { label: "News & reviews", href: "/updates" }]} />
            <Col title="Tools & services" links={[...TOOLS.map((l) => ({ label: l.label, href: l.href })), ...SERVICES.slice(0, 3).map((l) => ({ label: l.label, href: l.href }))]} />
            <Col title="Company" links={COMPANY} />
          </div>
        </div>

        <div className="border-t border-line pt-8 pb-8">
          <FooterApp />
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line py-6 text-[13px] font-medium text-ink-mute sm:flex-row">
          <p>© {new Date().getFullYear()} EVPLSE · EVPLSE Future Mobility. All rights reserved.</p>
          <Link href="/mcp" className="inline-flex items-center gap-1.5 font-bold text-brand hover:text-brand-deep">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            Connect AI / MCP <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
