import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HomeIcon, ScanLineIcon, SunIcon, LeafIcon } from './components/Icons';
import { PlantCard } from './components/PlantCard';
import { ChatBot } from './components/ChatBot';
import { LiveSession } from './components/LiveSession';
import { PlantAnalysis, FileUpload, ViewState } from './types';
import { analyzePlantImage, fileToGenerativePart } from './services/geminiService';

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  isDay: boolean;
}

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PlantAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [greeting, setGreeting] = useState('Good Morning');

  // Time based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Fetch Real-time Weather
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Using Open-Meteo API (Free, no key required)
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day`
          );
          const data = await response.json();
          
          if (data.current) {
             const code = data.current.weather_code;
             let condition = "Clear";
             if (code >= 1 && code <= 3) condition = "Cloudy";
             else if (code >= 45 && code <= 48) condition = "Foggy";
             else if (code >= 51 && code <= 67) condition = "Rainy";
             else if (code >= 71 && code <= 77) condition = "Snowy";
             else if (code >= 80 && code <= 99) condition = "Stormy";

             setWeather({
                 temp: Math.round(data.current.temperature_2m),
                 humidity: data.current.relative_humidity_2m,
                 condition: condition,
                 isDay: data.current.is_day === 1
             });
          }
        } catch (e) {
          console.error("Weather fetch failed", e);
        }
      }, (error) => {
          console.log("Geolocation error", error);
      });
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setUploadedFile({ file, previewUrl });
      setError(null);
      setAnalysisResult(null);
      
      // Switch to Analysis View immediately
      setViewState(ViewState.CAMERA); 
      setIsAnalyzing(true);

      try {
        // fileToGenerativePart now resizes and converts to JPEG for speed
        const base64Data = await fileToGenerativePart(file);
        // Use 'image/jpeg' as the service guarantees this format
        const result = await analyzePlantImage(base64Data, 'image/jpeg');
        setAnalysisResult(result);
        setViewState(ViewState.ANALYSIS);
      } catch (err) {
        console.error(err);
        setError("AI connection disrupted. Please try again.");
        setViewState(ViewState.HOME); // Go back home on error so they can retry easily
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, []);

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const resetScanner = () => {
    setViewState(ViewState.HOME);
    setUploadedFile(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Components for different views ---

  const HomeDashboard = () => (
    <div className="flex flex-col h-full p-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
           <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">{greeting}, Gardener</p>
           <h1 className="text-3xl font-bold text-white mt-1">Garden Overview</h1>
        </div>
        <div className="glass-panel w-12 h-12 rounded-full flex items-center justify-center text-emerald-400">
           <LeafIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Weather Widget (Real-time) */}
      <div className="glass-card rounded-2xl p-5 mb-6 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <SunIcon className={`w-16 h-16 ${weather?.isDay ? 'text-amber-300' : 'text-blue-300'} animate-spin-slow`} />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Live Weather</span>
            </div>
            {weather ? (
                <>
                    <div className="text-4xl font-bold text-white mb-1">{weather.temp}°C</div>
                    <p className="text-sm text-gray-300">{weather.condition} • Humidity {weather.humidity}%</p>
                </>
            ) : (
                <div className="space-y-2 animate-pulse">
                    <div className="h-8 w-24 bg-white/10 rounded"></div>
                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                    <p className="text-xs text-gray-500 mt-2">Locating...</p>
                </div>
            )}
         </div>
      </div>

      {/* 3D Scan Button */}
      <div className="mt-auto flex justify-center mb-12">
        <button 
          onClick={triggerFileUpload}
          className="relative w-64 h-64 rounded-full flex items-center justify-center group"
        >
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-glow"></div>
          <div className="absolute inset-8 rounded-full bg-emerald-900/40 border border-emerald-500/30 backdrop-blur-sm"></div>
          
          {/* Inner Button */}
          <div className="relative z-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300 group-active:scale-95">
             <ScanLineIcon className="w-12 h-12 text-white mb-2" />
             <span className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Tap to Scan</span>
          </div>
        </button>
      </div>

      <div className="text-center text-gray-500 text-xs">
         Supports any image size & type
      </div>
    </div>
  );

  const CameraScanner = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
       {/* Background Image Preview */}
       {uploadedFile?.previewUrl && (
         <div className="absolute inset-0 z-0">
            <img src={uploadedFile.previewUrl} className="w-full h-full object-cover opacity-60" alt="Scan" />
         </div>
       )}
       
       {/* Scanning Grid Overlay */}
       <div className="absolute inset-0 z-10 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')] opacity-20"></div>
       
       {/* Scanner UI */}
       <div className="relative z-20 flex-1 flex flex-col p-6">
          <div className="flex justify-between items-center">
             <div className="px-3 py-1 rounded-full bg-black/50 border border-emerald-500/50 text-emerald-400 text-xs font-mono">
                AI VISION ACTIVE
             </div>
             <button onClick={resetScanner} className="p-2 bg-black/40 rounded-full text-white">
                <span className="text-xs">CANCEL</span>
             </button>
          </div>

          {/* Focus Box */}
          <div className="flex-1 flex items-center justify-center">
             <div className="relative w-64 h-64 border border-white/20 rounded-lg overflow-hidden">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500"></div>
                
                {/* Scanning Laser - Fast animation for "instant" feel */}
                <div className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan" style={{ animationDuration: '1s' }}></div>
                
                {/* Particles */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full text-center">
                        <p className="text-emerald-400 font-mono text-xs animate-pulse">PROCESSING...</p>
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="min-h-screen relative overflow-hidden bg-black font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 mesh-gradient opacity-40 pointer-events-none z-0"></div>

      {/* View Content */}
      <main className="relative z-10 h-screen overflow-y-auto scrollbar-hide">
         {viewState === ViewState.HOME && <HomeDashboard />}
         {viewState === ViewState.CAMERA && <CameraScanner />}
         {viewState === ViewState.ANALYSIS && analysisResult && uploadedFile && (
            <PlantCard 
                data={analysisResult} 
                imagePreview={uploadedFile.previewUrl} 
                onReset={resetScanner} 
            />
         )}
         {viewState === ViewState.LIVE && (
            <LiveSession onClose={() => setViewState(ViewState.HOME)} />
         )}
      </main>

      {/* Global Bottom Navigation (Glassmorphism) */}
      {viewState !== ViewState.CAMERA && viewState !== ViewState.LIVE && (
          <nav className="fixed bottom-0 left-0 right-0 p-4 z-40">
            <div className="glass-card rounded-2xl p-1 flex justify-center items-center h-16 max-w-lg mx-auto shadow-2xl">
                <NavButton 
                    active={viewState === ViewState.HOME} 
                    onClick={() => setViewState(ViewState.HOME)} 
                    icon={<HomeIcon className="w-6 h-6" />} 
                    label="Home"
                />
            </div>
          </nav>
      )}

      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
      />

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 left-6 right-6 z-50 animate-fade-in-up">
            <div className="glass-card border-l-4 border-red-500 bg-red-900/20 p-4 rounded-xl flex items-center gap-3">
                <div className="text-red-400">⚠️</div>
                <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
        </div>
      )}

      {/* Chat Bot Overlay - Only show if not in camera/live mode */}
      {viewState !== ViewState.CAMERA && viewState !== ViewState.LIVE && (
          <ChatBot onStartLive={() => setViewState(ViewState.LIVE)} />
      )}
      
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-32 h-full rounded-xl transition-all duration-300 ${active ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
    >
        <div className={`transform transition-transform duration-300 ${active ? '-translate-y-1' : ''}`}>
            {icon}
        </div>
        {active && (
            <span className="text-[10px] font-bold mt-1 animate-fade-in">{label}</span>
        )}
    </button>
);

export default App;
