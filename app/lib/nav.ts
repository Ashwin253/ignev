import {
  Bike, BatteryCharging, Calculator, Car, CircleDollarSign, Gauge, GitCompare, Newspaper, Percent,
  Recycle, ShieldCheck, ShoppingBag, Sparkles, Tag, Truck, TrendingDown, Zap, CalendarClock, MapPin, Handshake, LifeBuoy, Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLink = { label: string; href: string; desc?: string; icon?: LucideIcon };

export const VEHICLE_TYPES: NavLink[] = [
  { label: "Electric Cars", href: "/catalog?type=cars", desc: "SUVs, sedans & hatchbacks", icon: Car },
  { label: "Electric Bikes", href: "/catalog?type=bike", desc: "Performance motorcycles", icon: Bike },
  { label: "Electric Scooters", href: "/catalog?type=scooter", desc: "Daily commuters", icon: Zap },
  { label: "Commercial EVs", href: "/catalog?type=commercial", desc: "Cargo, fleet & 3-wheelers", icon: Truck },
];

export const DISCOVER: NavLink[] = [
  { label: "New launches", href: "/new-launches", desc: "Just hit the market", icon: Sparkles },
  { label: "Upcoming EVs", href: "/upcoming", desc: "Launching soon", icon: CalendarClock },
  { label: "Offers & discounts", href: "/offers", desc: "Bank & city deals", icon: Percent },
  { label: "Compare vehicles", href: "/compare", desc: "Side-by-side specs", icon: GitCompare },
];

export const TOOLS: NavLink[] = [
  { label: "Charging calculator", href: "/tools?tool=charging", desc: "Time & cost to charge", icon: BatteryCharging },
  { label: "Savings calculator", href: "/tools?tool=savings", desc: "EV vs petrol running cost", icon: TrendingDown },
  { label: "EMI calculator", href: "/tools?tool=emi", desc: "Monthly loan payment", icon: CircleDollarSign },
  { label: "Range calculator", href: "/tools?tool=range", desc: "Real-world range", icon: Gauge },
];

export const SERVICES: NavLink[] = [
  { label: "EV insurance", href: "/service/insurance", desc: "Battery & motor cover", icon: ShieldCheck },
  { label: "Vehicle scrapping", href: "/service/scrap", desc: "Scrap value & waiver", icon: Recycle },
  { label: "Accessories shop", href: "/shop", desc: "Chargers, dashcams & more", icon: ShoppingBag },
  { label: "Sell your EV", href: "/sell-ev", desc: "Best valuation, quick transfer", icon: Tag },
  { label: "Get EV assist", href: "/assist", desc: "Talk to an expert", icon: LifeBuoy },
];

export const COMPANY: NavLink[] = [
  { label: "About us", href: "/about" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "Connect AI / MCP", href: "/mcp" },
];

/** Flat list used by the command palette. */
export const PALETTE_PAGES: NavLink[] = [
  { label: "Home", href: "/", icon: Zap },
  { label: "Browse all EVs", href: "/catalog", icon: Car },
  ...VEHICLE_TYPES,
  ...DISCOVER,
  { label: "Charging stations map", href: "/charging-station", icon: MapPin },
  { label: "For You — personalised picks", href: "/foryou", icon: Sparkles },
  { label: "Shortlist", href: "/shortlist", icon: Heart },
  { label: "EV news & reviews", href: "/updates", icon: Newspaper },
  ...TOOLS.map((t) => ({ ...t, icon: Calculator })),
  ...SERVICES,
  { label: "Partner with us", href: "/assist", icon: Handshake },
];
