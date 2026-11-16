import HomeDataLoader, { HomeHeroSection, HomeLowerGate, HomeNewsSection, HomeStatsSection, HomeUpcomingSections, HomeVehicleSections } from "./components/home/HomeDataLoader";
import ServicesOrbit from "./components/home/ServicesOrbit";
import { HowItWorks, HomeFaq } from "./components/home/HomeExtras";
import { SavingsTeaser } from "./components/home/HomeInteractive";
import { BrandMarquee, ToolsGrid, WhySection } from "./components/home/HomeStatic";

export default function Home() {
  return (
    <>
      <HomeDataLoader>
        <HomeHeroSection />
        <HomeVehicleSections />
        <HomeLowerGate>
          <HomeUpcomingSections />
          <BrandMarquee />
          <SavingsTeaser />
          <WhySection />
          <HomeStatsSection />
          <ServicesOrbit />
          <HowItWorks />
          <HomeNewsSection />
          <ToolsGrid />
          <HomeFaq />
        </HomeLowerGate>
      </HomeDataLoader>
    </>
  );
}
