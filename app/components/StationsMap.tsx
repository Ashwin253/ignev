'use client';

import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { Zap, Wrench, MapPin, Navigation, Share2 } from 'lucide-react';

const locations = [
  { id: '1', type: 'charging', position: { lat: 28.638807475938854, lng: 77.08571577423803 }, name: 'EV Fast Charger ', address: 'West Delhi' },
  // { id: '2', type: 'spare', position: { lat: 37.7849, lng: -122.4094 }, name: 'Auto EV Parts Hub', address: '456 Market St, San Francisco, CA' },
  { id: '3', type: 'charging', position: { lat: 28.60084344690758, lng: 77.08761399823456 }, name: 'Supercharger IndianOil Station', address: 'North Delhi' },
  { id: '4', type: 'spare', position: { lat: 28.62720444733246, lng: 77.0715540440098 }, name: 'EV Repair and Spare', address: 'West Delhi' },
]; export default function StationsMap() {
  const [selectedLocation, setSelectedLocation] = useState<typeof locations[0] | null>(null);
  const [filter, setFilter] = useState<'all' | 'charging' | 'spare'>('all');

  const filteredLocations = locations.filter(loc => filter === 'all' || loc.type === filter);

  const handleGetDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleShareLocation = async (loc: typeof locations[0]) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${loc.position.lat},${loc.position.lng}`;
    const shareData = {
      title: loc.name,
      text: `Check out ${loc.name} at ${loc.address}`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Location link copied to clipboard!');
    }
  };

  // Fallback map ID for demo purposes, you should generate your own in Google Cloud Console
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#1a1d24] to-[#0f1115] text-white relative overflow-hidden" id="locations-map">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-6"
          >
            <MapPin size={16} />
            <span>Interactive Map</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
          >
            Locate Charging & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Spare Parts</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Find the nearest fast-charging stations to keep your journey going, or discover authorized service centers and spare parts hubs near you.
          </motion.p>
        </div>



        <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
          {/* Map Legend & List */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            {/* <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#1e222b]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-5">Legend</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Zap size={20} />
                  </div>
                  <span className="font-medium">Charging Stations</span>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Wrench size={20} />
                  </div>
                  <span className="font-medium">Spare Parts & Service</span>
                </div>
              </div>
            </motion.div> */}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#1e222b]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl flex-grow flex flex-col"
            >
              <div className="flex flex-col mb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Explore Locations</h3>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => { setFilter('all'); setSelectedLocation(null); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${filter === 'all' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setFilter('charging'); setSelectedLocation(null); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${filter === 'charging' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Zap size={14} /> Charging
                  </button>
                  <button
                    onClick={() => { setFilter('spare'); setSelectedLocation(null); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${filter === 'spare' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Wrench size={14} /> Spares
                  </button>
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow min-h-[250px] max-h-[350px] lg:max-h-[500px]">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(loc => (
                    <div
                      key={loc.id}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${selectedLocation?.id === loc.id ? 'bg-white/10 border-white/20 shadow-lg scale-[1.02]' : 'bg-black/20 border-transparent hover:bg-white/5'} border`}
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <div className="font-medium text-white mb-1.5 flex items-center gap-2">
                        {loc.type === 'charging' ? <Zap size={16} className="text-emerald-400" /> : <Wrench size={16} className="text-amber-400" />}
                        {loc.name}
                      </div>
                      <div className="text-sm text-gray-400">{loc.address}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">No locations found for this category.</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Map View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/3 h-[400px] sm:h-[500px] lg:h-[650px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-[#1e222b]/80 backdrop-blur-xl"
          >
            {!apiKey ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12 text-center z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 sm:mb-6 border border-red-500/20">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Google Maps API Key Required</h3>
                <p className="text-sm sm:text-base text-gray-400 max-w-lg mb-4 sm:mb-6 leading-relaxed">
                  To view the interactive map, you need to provide a Google Maps API Key. Please add <code className="bg-black/50 px-1.5 py-0.5 rounded text-red-300 mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-black/50 px-1.5 py-0.5 rounded mx-1">.env.local</code> file.
                </p>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 w-full max-w-lg text-left">
                  <p className="text-sm text-gray-400 mb-2">Example .env.local:</p>
                  <code className="text-emerald-400 text-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYourApiKeyHere...</code>
                </div>
              </div>
            ) : (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultZoom={13}
                  defaultCenter={{ lat: 28.603031647489587, lng: 77.07210070401312 }}
                  mapId="DEMO_MAP_ID"
                  disableDefaultUI={true}
                  className="w-full h-full"
                >
                  {filteredLocations.map((loc) => (
                    <AdvancedMarker
                      key={loc.id}
                      position={loc.position}
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <Pin
                        background={loc.type === 'charging' ? '#10b981' : '#f59e0b'}
                        borderColor={loc.type === 'charging' ? '#047857' : '#b45309'}
                        glyphColor="#ffffff"
                        scale={selectedLocation?.id === loc.id ? 1.2 : 1}
                      />
                    </AdvancedMarker>
                  ))}

                  {selectedLocation && (
                    <InfoWindow
                      position={selectedLocation.position}
                      onCloseClick={() => setSelectedLocation(null)}
                      className="rounded-xl overflow-hidden shadow-2xl"
                    >
                      <div className="p-4 text-black min-w-[220px]">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-1">
                          {selectedLocation.type === 'charging' ? '⚡' : '🔧'} {selectedLocation.name}
                        </h3>
                        <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                          {selectedLocation.type === 'charging' ? 'Charging Station' : 'Spare Parts Hub'}
                        </p>
                        <p className="text-sm text-gray-700 mb-4">{selectedLocation.address}</p>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleGetDirections(selectedLocation.position.lat, selectedLocation.position.lng)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-lg transition-colors font-semibold shadow-md shadow-blue-500/20"
                          >
                            <Navigation size={16} />
                            Directions
                          </button>
                          <button 
                            onClick={() => handleShareLocation(selectedLocation)}
                            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg transition-colors shadow-sm"
                            title="Share Location"
                          >
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
