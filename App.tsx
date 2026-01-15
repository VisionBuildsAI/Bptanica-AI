
import React, { useState, useRef, useEffect } from 'react';
import { PlantCard } from './components/PlantCard';
import { ChatBot } from './components/ChatBot';
import { LiveSession } from './components/LiveSession';
import { PlantDiagnosis, ViewState, PesticideAnalysis, FileUpload } from './types';
import { analyzePlant, analyzePesticide, fileToGenerativePart } from './services/geminiService';
import { ScanLineIcon, ShieldCheckIcon, SparklesIcon, LeafIcon, VideoIcon, SunIcon, XIcon } from './components/Icons';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HERO);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plantResult, setPlantResult] = useState<PlantDiagnosis | null>(null);
  const [pesticideResult, setPesticideResult] = useState<PesticideAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [city, setCity] = useState('');
  const [weatherAlert, setWeatherAlert] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (city.length > 3) {
      const alerts = ["Heatwave Warning: Water crops at night", "Heavy Rain Forecast: Ensure drainage", null, null];
      setWeatherAlert(alerts[Math.floor(Math.random() * alerts.length)]);
    }
  }, [city]);

  useEffect(() => {
    if (viewState === ViewState.SCANNING) {
      setScanStep(0);
      const interval = setInterval(() => {
        setScanStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 400); 
      return () => clearInterval(interval);
    }
  }, [viewState]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setUploadedFile({ file, previewUrl });
      
      if (viewState !== ViewState.PESTICIDE_CHECK) {
        setViewState(ViewState.SCANNING);
      } else {
        setIsAnalyzing(true);
      }
      
      try {
        const base64 = await fileToGenerativePart(file);
        
        if (viewState === ViewState.PESTICIDE_CHECK) {
           const result = await analyzePesticide(base64, file.type);
           setPesticideResult(result);
           setIsAnalyzing(false);
        } else {
           const result = await analyzePlant(base64, file.type);
           setPlantResult(result);
           setViewState(ViewState.RESULT);
        }
      } catch (err: any) {
        console.error("Diagnosis Error:", err);
        // Better error messages for mobile troubleshooting
        const message = err.message?.includes("API_KEY") 
          ? "API Configuration error. Please check your key."
          : "Gemini Analysis failed. Ensure you have a stable network connection and try again.";
        alert(message);
        setViewState(ViewState.HERO);
        setIsAnalyzing(false);
      }
    }
  };

  const reset = () => {
    setViewState(ViewState.HERO);
    setPlantResult(null);
    setPesticideResult(null);
    setUploadedFile(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getScanText = (step: number) => {
    switch(step) {
      case 0: return "Isolating chlorophyll signatures...";
      case 1: return "Identifying species markers...";
      case 2: return "Scanning for fungal pathogens...";
      default: return "Finalizing diagnosis...";
    }
  };

  return (
    <div className="min-h-screen relative font-sans overflow-hidden">
       <div className="bg-noise"></div>
       
       <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-300/10 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-300/10 rounded-full blur-[120px] animate-float" style={{animationDelay: '2s'}}></div>
       </div>

       <main className="relative z-10 h-screen flex flex-col">
          
          {viewState === ViewState.HERO && (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in-up relative">
                
                <div className="absolute top-6 left-0 right-0 flex justify-center md:justify-between items-start px-6 pointer-events-none z-20">
                   <div className="pointer-events-auto glass-pill p-2 pl-3 pr-4 rounded-full flex items-center gap-3 transition-all hover:bg-white/60">
                      <SunIcon className="w-5 h-5 text-amber-500 animate-spin-slow" />
                      <div className="flex flex-col items-start">
                         <input 
                           type="text" 
                           placeholder="Enter City" 
                           value={city}
                           onChange={(e) => setCity(e.target.value)}
                           className="bg-transparent text-sm w-24 focus:outline-none focus:border-b focus:border-emerald-500 text-gray-700 placeholder:text-gray-400 font-medium"
                         />
                         {weatherAlert && <p className="text-[10px] text-red-500 font-bold mt-0.5 animate-pulse">{weatherAlert}</p>}
                      </div>
                   </div>
                   
                   <div className="flex gap-2">
                     <button onClick={() => setViewState(ViewState.PESTICIDE_CHECK)} className="hidden md:flex pointer-events-auto glass-pill px-4 py-2 rounded-full text-emerald-800 text-xs font-bold hover:bg-white transition-all items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" />
                        Verify Pesticide
                     </button>
                     <button onClick={() => setViewState(ViewState.LIVE)} className="hidden md:flex pointer-events-auto glass-pill px-4 py-2 rounded-full text-white bg-emerald-600 font-bold text-xs hover:bg-emerald-700 transition-all items-center gap-2">
                        <VideoIcon className="w-4 h-4" />
                        Live Expert
                     </button>
                   </div>
                </div>

                <div className="relative mb-8 group cursor-default">
                   <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                   <LeafIcon className="w-24 h-24 text-emerald-600 relative z-10 drop-shadow-2xl animate-float" />
                </div>
                
                <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-emerald-900 to-emerald-700 mb-6 tracking-tight leading-tight drop-shadow-sm">
                   Botanica AI
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto mb-12 leading-relaxed font-medium">
                   Professional garden architect & plant pathologist.<br/>
                   <span className="text-emerald-600 font-bold bg-emerald-50/50 px-2 rounded-lg">Spatial Analysis • Pathogen Scans • Real-time Guidance.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
                    <button 
                      onClick={() => setViewState(ViewState.LIVE)}
                      className="relative px-8 py-5 bg-zinc-900 text-white rounded-full font-bold text-lg shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 btn-liquid overflow-hidden flex items-center gap-3"
                    >
                      <SparklesIcon className="w-5 h-5 text-emerald-400" />
                      Live Consultation
                    </button>
                  </div>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-5 bg-white text-emerald-700 border-2 border-emerald-100 rounded-full font-bold text-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-3"
                  >
                    <ScanLineIcon className="w-5 h-5" />
                    Quick Photo Scan
                  </button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-6 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                   <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Pathogen Detection</span>
                   <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Spatial Planning</span>
                   <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Expert Voice</span>
                </div>
             </div>
          )}

          {viewState === ViewState.SCANNING && (
             <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-white z-50 animate-fade-in relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
                    <img src={uploadedFile?.previewUrl} className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover rounded-3xl opacity-80" />
                    <div className="absolute inset-0 z-10 scan-overlay rounded-3xl border-2 border-emerald-500/20"></div>
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] animate-[scan-grid_1.5s_linear_infinite]"></div>
                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl"></div>
                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl"></div>
                 </div>
                 <div className="mt-12 space-y-4 text-center relative z-10">
                    <div className="flex items-center justify-center gap-3">
                       <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                       <h2 className="text-3xl font-heading font-black text-white tracking-[0.2em] uppercase">Analysing</h2>
                    </div>
                    <p className="text-emerald-400/80 font-mono text-sm h-6 animate-pulse uppercase tracking-widest">{getScanText(scanStep)}</p>
                 </div>
             </div>
          )}

          {viewState === ViewState.RESULT && plantResult && uploadedFile && (
             <PlantCard data={plantResult} imagePreview={uploadedFile.previewUrl} onReset={reset} />
          )}

          {viewState === ViewState.PESTICIDE_CHECK && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-scale-in bg-white/50 backdrop-blur-sm">
                  <button onClick={reset} className="absolute top-6 left-6 p-3 rounded-full bg-white shadow-md hover:scale-110 transition-transform"><XIcon className="w-6 h-6 text-gray-500" /></button>
                  <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-8 text-blue-600 shadow-xl shadow-blue-100/50">
                     <ShieldCheckIcon className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-heading font-bold text-slate-800 mb-4">Chemical Guard</h2>
                  <p className="text-slate-500 mb-10 max-w-md text-lg leading-relaxed">Verifying label authenticity and regulatory safety compliance.</p>
                  {!pesticideResult ? (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="group w-full max-w-sm h-72 border-2 border-dashed border-blue-200 rounded-[2rem] flex flex-col items-center justify-center bg-blue-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                     >
                        {isAnalyzing ? (
                           <div className="flex flex-col items-center">
                              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                              <p className="text-blue-500 font-bold animate-pulse">Running Guard Checks...</p>
                           </div>
                        ) : (
                           <>
                             <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ScanLineIcon className="w-8 h-8 text-blue-500" />
                             </div>
                             <span className="font-bold text-blue-600 text-lg uppercase tracking-wider">Upload Label Photo</span>
                           </>
                        )}
                     </div>
                  ) : (
                     <div className="w-full max-w-md glass-card p-8 rounded-[2.5rem] animate-fade-in-up border-t-4 border-t-white">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner ${
                           pesticideResult.status === 'GENUINE' ? 'bg-emerald-100 text-emerald-600' : 
                           pesticideResult.status === 'EXPIRED' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                           {pesticideResult.status === 'GENUINE' ? <ShieldCheckIcon className="w-10 h-10" /> : <ShieldCheckIcon className="w-10 h-10 text-red-500" />}
                        </div>
                        <h3 className={`text-3xl font-bold mb-2 tracking-tight ${
                           pesticideResult.status === 'GENUINE' ? 'text-emerald-700' : 
                           pesticideResult.status === 'EXPIRED' ? 'text-amber-700' : 'text-red-700'
                        }`}>
                           {pesticideResult.status}
                        </h3>
                        <p className="text-gray-500 font-semibold mb-6 uppercase tracking-wider text-xs">{pesticideResult.product_name}</p>
                        <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 mb-6">
                           <p className="text-sm text-slate-700 leading-relaxed font-medium">{pesticideResult.details}</p>
                        </div>
                        <button onClick={() => setPesticideResult(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">New Analysis</button>
                     </div>
                  )}
              </div>
          )}

          {viewState === ViewState.LIVE && (
             <LiveSession onClose={reset} />
          )}

       </main>

       <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
       {viewState !== ViewState.SCANNING && viewState !== ViewState.LIVE && <ChatBot />}
    </div>
  );
};

export default App;
