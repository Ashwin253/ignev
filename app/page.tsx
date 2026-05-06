import { getSiteContent } from "./lib/site-content";
import Hero from "./components/Hero";
import QuickActions from "./components/QuickActions";
import PopularBrands from "./components/PopularBrands";
import ElectricCore3D from "./components/ElectricCore3D";
import ComingSoonCars from "./components/ComingSoonCars";
import WhyEVPULSE from "./components/WhyIgnev";

export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Hero products={content.products} />
      {/* <QuickActions /> */}
      <ComingSoonCars comingSoon={{ coming_soon: content.comingSoon }} />
      <PopularBrands />
      <ElectricCore3D />
      <WhyEVPULSE />
      {/* <StationsMap /> */}
      {/* <Testimonials /> */}
    </>
  );
}
