import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | EVPLSE - India's Premier EV Marketplace",
  description: "Learn about EVPLSE (EVPULSE Future Mobility), India's leading platform for electric and hybrid vehicles, charging stations, and green mobility solutions.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | EVPLSE",
    description: "Learn about EVPLSE (EVPULSE Future Mobility), India's leading platform for electric and hybrid vehicles.",
    url: "https://www.evplse.com/about",
    siteName: "EVPLSE",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] text-slate-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-slate-900">About Us</h1>
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            Welcome to EVPlse (EVPULSE Future Mobility), India's premier marketplace for electric and hybrid vehicles. Our mission is to accelerate the transition to sustainable mobility by making it seamless, transparent, and accessible for everyone.
          </p>
          <p>
            Founded with a vision for a cleaner, greener future, we provide a unified platform where buyers, sellers, and EV enthusiasts can explore the latest models, find verified pre-owned vehicles, compare total cost of ownership, and even locate essential charging infrastructure on our interactive maps.
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Our Vision</h2>
          <p>
            We envision a world where electric mobility is the default choice. By empowering consumers with the right tools, accurate data, and an intuitive user experience, we are breaking down the barriers to EV adoption.
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Why Choose Us?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Comprehensive Catalog:</strong> From affordable electric scooters to luxury electric SUVs, we cover the entire spectrum of zero-emission vehicles.</li>
            <li><strong>Cost Transparency:</strong> Our tools help you calculate the exact savings you can achieve by switching from fossil fuels to electric power.</li>
            <li><strong>Verified Listings:</strong> We ensure that the vehicles listed on our platform meet strict quality and transparency standards.</li>
            <li><strong>Integrated Charging Maps:</strong> Plan your routes confidently with our built-in EV charging station locator.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
