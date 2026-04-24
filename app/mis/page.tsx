import MISLogin from "../components/MISLogin";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MISPage() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-white flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center py-20">
        <MISLogin />
      </div>
      <Footer />
    </main>
  );
}
