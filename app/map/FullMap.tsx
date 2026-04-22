'use client';

import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { Zap, Wrench, Navigation, MapPin, Search, Filter } from 'lucide-react';

const allLocations = [
  { id: '1', type: 'charging', position: { lat: 28.638807475938854, lng: 77.08571577423803 }, name: 'EV Fast Charger ', address: 'West Delhi' },
  // { id: '2', type: 'spare', position: { lat: 37.7849, lng: -122.4094 }, name: 'Auto EV Parts Hub', address: '456 Market St, San Francisco, CA' },
  { id: '3', type: 'charging', position: { lat: 28.60084344690758, lng: 77.08761399823456 }, name: 'Supercharger IndianOil Station', address: 'North Delhi' },
  { id: '4', type: 'spare', position: { lat: 28.62720444733246, lng: 77.0715540440098 }, name: 'EV Repair and Spare', address: 'West Delhi' },
];

// const allLocations = [
//   { id: '1', type: 'charging', position: { lat: 37.7749, lng: -122.4194 }, name: 'EV Fast Charger Downtown', address: '123 Main St, San Francisco, CA', onRoute: true },
//   { id: '2', type: 'spare', position: { lat: 37.7849, lng: -122.4094 }, name: 'Auto EV Parts Hub', address: '456 Market St, San Francisco, CA', onRoute: false },
//   { id: '3', type: 'charging', position: { lat: 37.7649, lng: -122.4294 }, name: 'Supercharger SF Station', address: '789 Mission St, San Francisco, CA', onRoute: true },
//   { id: '4', type: 'spare', position: { lat: 37.7949, lng: -122.3994 }, name: 'Performance EV Spares', address: '101 Embarcadero, San Francisco, CA', onRoute: false },
//   { id: '5', type: 'charging', position: { lat: 37.6849, lng: -122.4094 }, name: 'Daly City Supercharger', address: '200 Serramonte Center, Daly City, CA', onRoute: true },
//   { id: '6', type: 'charging', position: { lat: 37.5849, lng: -122.3094 }, name: 'San Mateo Fast Charger', address: '123 Hillsdale Blvd, San Mateo, CA', onRoute: true },
//   { id: '7', type: 'spare', position: { lat: 37.8049, lng: -122.2794 }, name: 'Oakland EV Parts', address: '456 Broadway, Oakland, CA', onRoute: false },
//   { id: '8', type: 'charging', position: { lat: 37.3382, lng: -121.8863 }, name: 'San Jose Mega Station', address: '100 W San Fernando St, San Jose, CA', onRoute: true },
// ];

function DirectionsRendererComponent({
  origin,
  destination,
  onRouteCalculated
}: {
  origin: string,
  destination: string,
  onRouteCalculated: (success: boolean) => void
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) {
      if (directionsRenderer) directionsRenderer.setMap(null);
      return;
    }

    directionsRenderer.setMap(map);

    directionsService
      .route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        onRouteCalculated(true);
      })
      .catch((e) => {
        console.error('Directions request failed due to ', e);
        if (directionsRenderer) directionsRenderer.setMap(null);
        onRouteCalculated(false);
      });

    return () => {
      if (directionsRenderer) directionsRenderer.setMap(null);
    };
  }, [directionsService, directionsRenderer, origin, destination, map, onRouteCalculated]);

  return null;
}

export default function FullMap() {
  const [activeTab, setActiveTab] = useState<'route' | 'filters'>('route');
  const [selectedLocation, setSelectedLocation] = useState<typeof allLocations[0] | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'charging' | 'spare'>('all');
  const [routeFilterActive, setRouteFilterActive] = useState(false);

  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [activeRoute, setActiveRoute] = useState<{ origin: string, dest: string } | null>(null);
  const [selectingPoint, setSelectingPoint] = useState<'origin' | 'dest' | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleFindRoute = () => {
    if (originInput && destInput) {
      setActiveRoute({ origin: originInput, dest: destInput });
      setRouteFilterActive(true);
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setOriginInput('');
    setDestInput('');
    setRouteFilterActive(false);
  };

  // Filter logic: Filter by type AND (if route filter is active, filter by onRoute)
  const displayedLocations = allLocations.filter(loc => {
    const matchesType = filterType === 'all' || loc.type === filterType;
    const matchesRoute = routeFilterActive ? ((loc as any).onRoute ?? false) : true;
    return matchesType && matchesRoute;
  });

  return (
    <div className="flex flex-col md:flex-row flex-grow h-[calc(100vh-72px)] bg-[#0f1115] overflow-hidden">

      {/* Sidebar Panel */}
      <div className="w-full md:w-[400px] bg-[#1a1d24] md:border-r border-b md:border-b-0 border-white/10 flex flex-col z-20 shadow-2xl relative flex-1 md:flex-none md:h-full min-h-[45vh] md:min-h-0">
        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button 
            className={`flex-1 py-4 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'route' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('route')}
          >
            <Navigation size={16} /> Route Planner
          </button>
          <button 
            className={`flex-1 py-4 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'filters' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('filters')}
          >
            <Filter size={16} /> Filters & Stations
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {/* Route Section */}
          {activeTab === 'route' && (
            <div className="p-6 border-b border-white/10">
              <div className="space-y-4 mb-6">
            <div>
              <label className="flex text-sm text-gray-400 mb-1.5 ml-1 justify-between items-center">
                <span>Starting Point</span>
                <button
                  onClick={() => setSelectingPoint(selectingPoint === 'origin' ? null : 'origin')}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${selectingPoint === 'origin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'}`}
                >
                  {selectingPoint === 'origin' ? 'Click map to select...' : 'Select on map'}
                </button>
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectingPoint === 'origin' ? 'bg-blue-400 animate-pulse' : 'bg-blue-500'}`} />
                <input
                  type="text"
                  placeholder="e.g. New Delhi Railway Station"
                  value={originInput}
                  onChange={e => setOriginInput(e.target.value)}
                  className={`w-full bg-black/30 border rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors ${selectingPoint === 'origin' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10'}`}
                />
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-[#1a1d24] p-1 rounded-full border border-white/10">
                <div className="w-1 h-6 border-l-2 border-dashed border-white/20 mx-auto" />
              </div>
            </div>

            <div>
              <label className="flex text-sm text-gray-400 mb-1.5 ml-1 justify-between items-center">
                <span>Destination</span>
                <button
                  onClick={() => setSelectingPoint(selectingPoint === 'dest' ? null : 'dest')}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${selectingPoint === 'dest' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'}`}
                >
                  {selectingPoint === 'dest' ? 'Click map to select...' : 'Select on map'}
                </button>
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectingPoint === 'dest' ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
                <input
                  type="text"
                  placeholder="e.g. Noida, Uttar Pradesh"
                  value={destInput}
                  onChange={e => setDestInput(e.target.value)}
                  className={`w-full bg-black/30 border rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors ${selectingPoint === 'dest' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10'}`}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFindRoute}
              className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Search size={18} /> Find Route
            </button>
            {activeRoute && (
              <button
                onClick={handleClearRoute}
                className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-colors border border-red-500/20"
              >
                Clear
              </button>
            )}
          </div>
            </div>
          )}

          {/* Filters Section */}
          {activeTab === 'filters' && (
            <div className="p-6 border-b border-white/10 bg-[#1e222b]/50">
              <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-300 flex items-center gap-2">
              <Filter size={16} /> Filters
            </h3>
            {activeRoute && (
              <label className="flex items-center gap-2 text-sm cursor-pointer group">
                <span className={`transition-colors ${routeFilterActive ? 'text-emerald-400 font-medium' : 'text-gray-400 group-hover:text-gray-300'}`}>
                  Along Route
                </span>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${routeFilterActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                  onClick={() => setRouteFilterActive(!routeFilterActive)}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${routeFilterActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
            )}
          </div>

          <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setFilterType('all'); setSelectedLocation(null); }}
              className={`flex-grow py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilterType('charging'); setSelectedLocation(null); }}
              className={`flex-grow py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${filterType === 'charging' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <Zap size={14} /> Charge
            </button>
            <button
              onClick={() => { setFilterType('spare'); setSelectedLocation(null); }}
              className={`flex-grow py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${filterType === 'spare' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <Wrench size={14} /> Parts
            </button>
          </div>
            </div>
          )}

          {/* Results List */}
          <div className="p-6 space-y-3 relative">
          <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
            {displayedLocations.length} Locations Found
          </h3>

          {displayedLocations.length > 0 ? (
            displayedLocations.map(loc => (
              <div
                key={loc.id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${selectedLocation?.id === loc.id ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'} border`}
                onClick={() => setSelectedLocation(loc)}
              >
                <div className="font-medium text-white mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {loc.type === 'charging' ? <Zap size={16} className="text-emerald-400" /> : <Wrench size={16} className="text-amber-400" />}
                    <span className="truncate">{loc.name}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-1.5 leading-relaxed">{loc.address}</div>
                {activeRoute && (loc as any).onRoute && routeFilterActive && (
                  <div className="mt-3 inline-block px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/20">
                    On your route
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="mx-auto h-8 w-8 mb-3 opacity-20" />
              <p>No locations match your filters.</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-grow relative bg-[#1a1d24]">
        {!apiKey ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10 bg-[#0f1115]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
              <MapPin size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Google Maps API Key Required</h3>
            <p className="text-gray-400 max-w-lg mb-6 leading-relaxed">
              To view the interactive map and use the routing features, please add <code className="bg-black/50 px-2 py-1 rounded text-red-300 mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-black/50 px-2 py-1 rounded mx-1">.env.local</code> file.
            </p>
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultZoom={10}
              defaultCenter={{ lat: 28.597934860102033, lng: 77.0866680728605 }}
              mapId="DEMO_MAP_ID"
              disableDefaultUI={true}
              className={`w-full h-full absolute inset-0 ${selectingPoint ? 'cursor-crosshair' : ''}`}
              onClick={(e) => {
                if (!selectingPoint || !e.detail.latLng) return;
                const coordStr = `${e.detail.latLng.lat.toFixed(5)}, ${e.detail.latLng.lng.toFixed(5)}`;
                if (selectingPoint === 'origin') {
                  setOriginInput(coordStr);
                  setSelectingPoint(null);
                } else if (selectingPoint === 'dest') {
                  setDestInput(coordStr);
                  setSelectingPoint(null);
                }
              }}
            >
              {activeRoute && (
                <DirectionsRendererComponent
                  origin={activeRoute.origin}
                  destination={activeRoute.dest}
                  onRouteCalculated={(success) => {
                    if (!success) {
                      // Fallback/Mock for demo if API route fails (e.g. quota, bad input)
                      console.log("Using mock route filtering since API failed or no directions available.");
                    }
                  }}
                />
              )}

              {displayedLocations.map((loc) => (
                <AdvancedMarker
                  key={loc.id}
                  position={loc.position}
                  onClick={() => setSelectedLocation(loc)}
                >
                  <Pin
                    background={loc.type === 'charging' ? '#10b981' : '#f59e0b'}
                    borderColor={loc.type === 'charging' ? '#047857' : '#b45309'}
                    glyphColor="#ffffff"
                    scale={selectedLocation?.id === loc.id ? 1.3 : 1}
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
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-lg transition-colors font-semibold shadow-md shadow-blue-500/20">
                      View Details
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
}
