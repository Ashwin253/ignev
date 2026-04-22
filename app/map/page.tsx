import Header from '../components/Header';
import Footer from '../components/Footer';
import FullMap from './FullMap';

export default function MapPage() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-white flex flex-col">
      <Header />
      <div className="flex-grow pt-[72px] flex flex-col">
        <FullMap />
      </div>
    </main>
  );
}
