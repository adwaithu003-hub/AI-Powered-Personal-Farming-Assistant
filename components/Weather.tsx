
import React, { useState } from 'react';
import { getWeatherDetails } from '../services/geminiService';

interface WeatherData {
  locationName: string;
  current: {
    temp: string;
    condition: string;
    humidity: string;
    wind: string;
  };
  forecast: Array<{ day: string; temp: string; condition: string }>;
  risks: {
    floodProbability: 'Low' | 'Medium' | 'High';
    cycloneProbability: 'Low' | 'Medium' | 'High';
    details: string;
  };
  farmingTip: string;
}

const Weather: React.FC = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    performSearch(city);
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    setWeatherData(null);
    setGroundingMetadata(null);
    setError(null);
    
    try {
      const { data, groundingMetadata } = await getWeatherDetails(query);
      if (data) {
        setWeatherData(data as WeatherData);
        setGroundingMetadata(groundingMetadata);
      } else {
        setError("Could not parse weather data. Please try again.");
      }
    } catch (err) {
      setError("Could not fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setWeatherData(null);
    setError(null);
    setCity("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCity(`Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
        performSearch(`latitude ${latitude}, longitude ${longitude}`);
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve your location. Please check browser permissions.");
        setLoading(false);
        setCity("");
      }
    );
  };

  // Helper to choose icon based on condition text
  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('storm') || c.includes('thunder')) return '⛈️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('snow')) return '❄️';
    if (c.includes('clear') || c.includes('sunny')) return '☀️';
    if (c.includes('mist') || c.includes('fog')) return '🌫️';
    return '🌤️';
  };

  const getRiskColor = (prob: string) => {
    switch (prob?.toLowerCase()) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 py-10 pb-20 px-4 md:px-0">
      <div className="max-w-4xl mx-auto space-y-4 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Farm Weather & Risks</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Hyper-local weather tracking and disaster early warning system for farmers.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="relative group z-20">
          <form onSubmit={handleSearch} className="w-full">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter City or use Location"
              className="w-full bg-white border-2 border-slate-100 rounded-3xl pl-8 pr-40 py-6 text-lg text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 shadow-xl shadow-slate-200/50 transition-all"
              disabled={loading}
            />
            
            <div className="absolute right-3 top-3 bottom-3 flex space-x-2">
                <button
                    type="button"
                    onClick={handleLocationSearch}
                    disabled={loading}
                    className="aspect-square h-full bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all flex items-center justify-center border border-transparent hover:border-emerald-200"
                    title="Use Current Location"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>

                <button
                    type="submit"
                    disabled={loading || !city.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                    <span>Check</span>
                    )}
                </button>
            </div>
          </form>
        </div>

        {error && (
           <div className="mt-8 p-6 bg-red-50 text-red-600 rounded-2xl text-center font-medium border border-red-100 animate-in slide-in-from-top-2">
             {error}
           </div>
        )}

        {weatherData && (
          <div className="mt-12 animate-in slide-in-from-bottom-8 space-y-8">
            {/* Main Weather Card */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden">
               {/* Decorative background */}
               <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                 <div className="text-center md:text-left space-y-2">
                   <div className="flex items-center justify-center md:justify-start space-x-2 text-blue-200 uppercase tracking-widest text-xs font-black">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     <span>{weatherData.locationName}</span>
                   </div>
                   <div className="flex items-center justify-center md:justify-start">
                     <span className="text-8xl font-black tracking-tighter">{weatherData.current.temp.replace(/[^0-9.-]/g, '')}°</span>
                     <div className="flex flex-col ml-4 text-left">
                       <span className="text-2xl font-bold">{getWeatherIcon(weatherData.current.condition)}</span>
                       <span className="text-lg font-medium text-blue-100">{weatherData.current.condition}</span>
                     </div>
                   </div>
                 </div>

                 <div className="mt-8 md:mt-0 grid grid-cols-2 gap-4">
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[120px] border border-white/10">
                     <p className="text-blue-200 text-xs font-bold uppercase mb-1">Humidity</p>
                     <p className="text-xl font-bold flex items-center">
                       <span className="mr-2">💧</span> {weatherData.current.humidity}
                     </p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[120px] border border-white/10">
                     <p className="text-blue-200 text-xs font-bold uppercase mb-1">Wind</p>
                     <p className="text-xl font-bold flex items-center">
                       <span className="mr-2">💨</span> {weatherData.current.wind}
                     </p>
                   </div>
                 </div>
               </div>
            </div>

            {/* Forecast & Risks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Forecast Column */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
                 <h3 className="text-slate-900 font-black text-lg mb-6 flex items-center">
                   <span className="bg-blue-100 text-blue-600 p-2 rounded-xl mr-3">📅</span> 
                   3-Day Outlook
                 </h3>
                 <div className="grid grid-cols-3 gap-4">
                   {weatherData.forecast.map((day, idx) => (
                     <div key={idx} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{day.day}</p>
                       <span className="text-3xl mb-2">{getWeatherIcon(day.condition)}</span>
                       <p className="text-slate-900 font-black">{day.temp}</p>
                       <p className="text-[10px] text-slate-500 font-medium truncate w-full">{day.condition}</p>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Risks Column */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-slate-900 font-black text-lg mb-6 flex items-center">
                    <span className="bg-red-100 text-red-600 p-2 rounded-xl mr-3">⚠️</span> 
                    Risk Monitor
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-600">Flood</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getRiskColor(weatherData.risks.floodProbability)}`}>
                        {weatherData.risks.floodProbability}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-600">Cyclone</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getRiskColor(weatherData.risks.cycloneProbability)}`}>
                        {weatherData.risks.cycloneProbability}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    "{weatherData.risks.details}"
                  </p>
                </div>
              </div>
            </div>

            {/* Farming Tip */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8 flex items-start space-x-4 shadow-sm">
               <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                 🚜
               </div>
               <div>
                 <h4 className="text-emerald-800 font-black text-lg mb-1">Farming Advisory</h4>
                 <p className="text-emerald-700 font-medium leading-relaxed">
                   {weatherData.farmingTip}
                 </p>
               </div>
            </div>

            {/* Grounding Source Links */}
            {groundingMetadata?.groundingChunks && (
              <div className="text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Verified Sources</p>
                 <div className="flex flex-wrap justify-center gap-2">
                   {groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                      chunk.web?.uri && (
                        <a 
                          key={i} 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 rounded-lg text-xs transition-colors shadow-sm"
                        >
                          {chunk.web.title || new URL(chunk.web.uri).hostname}
                        </a>
                      )
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
