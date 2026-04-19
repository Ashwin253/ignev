import Header from "./components/Header";
import Hero from "./components/Hero";
import QuickActions from "./components/QuickActions";
import PopularTypes from "./components/PopularTypes";
import PopularBrands from "./components/PopularBrands";
import WhyIgnev from "./components/WhyIgnev";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import AssistPopup from "./components/AssistPopup";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-white">
      <Header />
      <Hero />
      <QuickActions />
      <PopularTypes />
      <PopularBrands />
      <WhyIgnev />
      {/* <Testimonials /> */}
      <Footer />
      <AssistPopup />
    </main>
  );
}
