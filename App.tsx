import React, { useState, useRef, useEffect } from 'react';
import { PlantCard } from './components/PlantCard';
import { ChatBot } from './components/ChatBot';
import { PlantDiagnosis, ViewState, PesticideAnalysis, FileUpload } from './types';
import { analyzePlant, analyzePesticide, fileToGenerativePart } from './services/geminiService';
import { ScanLineIcon, ShieldCheckIcon, UploadIcon, LeafIcon, WarningIcon, SunIcon, XIcon } from './components/Icons';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HERO);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plantResult, setPlantResult] = useState<PlantDiagnosis | null>(null);
  const [pesticideResult, setPesticideResult] = useState<PesticideAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [city, setCity] = useState('');
  const [weatherAlert, setWeatherAlert] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated Weather Alert for demo (in production would use API)
  useEffect(() => {
    if (city.length > 3) {
      // Mock alerting logic
      const alerts = ["Heatwave Warning: Water crops at night", "Heavy Rain Forecast: Ensure drainage", null, null];
      setWeatherAlert(alerts[Math.floor(Math.random() * alerts.length)]);
    }
  }, [city]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setUploadedFile({ file, previewUrl });
      setIsAnalyzing(true);
      
      try {
        const base64 = await fileToGenerativePart(file);
        
        if (viewState === ViewState.PESTICIDE_CHECK) {
           const result = await analyzePesticide(base64, file.type);
           setPesticideResult(result);
           // Remain in pesticide check view but show result
        } else {
           setViewState(ViewState.SCANNING); // Show scanning animation
           const result = await analyzePlant(base64, file.type);
           setPlantResult(result);
           setViewState(ViewState.RESULT);
        }
      } catch (err) {
        console.error(err);
        alert("AI Analysis Failed. Please try again.");
        setViewState(ViewState.HERO);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const reset = () => {
    setViewState(ViewState.HERO);
    setPlantResult(null);
    setPesticideResult(null);
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen relative font-sans">
       {/* Background Elements */}
       <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#f0fdf4] to-white"></div>
          {/* Floating Particles */}
          <div className="particle w-2 h-2 top-1/4 left-1/4 animate-float" style={{animationDelay: '0s'}}></div>
          <div className="particle w-3 h-3 top-1/2 left-2/3 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="particle w-1 h-1 top-3/4 left-1/3 animate-float" style={{animationDelay: '4s'}}></div>
       </div>

       <main className="relative z-10 h-screen flex flex-col">
          
          {/* --- HERO SECTION --- */}
          {viewState === ViewState.HERO && (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative">
                
                {/* Weather Widget */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                   <div className="pointer-events-auto bg-white/60 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3">
                      <SunIcon className="w-6 h-6 text-amber-500 animate-spin-slow" />
                      <div>
                         <input 
                           type="text" 
                           placeholder="Enter City" 
                           value={city}
                           onChange={(e) => setCity(e.target.value)}
                           className="bg-transparent border-b border-gray-300 text-sm w-24 focus:outline-none focus:border-emerald-500 text-gray-700 placeholder:text-gray-400"
                         />
                         {weatherAlert && <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">{weatherAlert}</p>}
                      </div>
                   </div>
                   <button onClick={() => setViewState(ViewState.PESTICIDE_CHECK)} className="pointer-events-auto bg-white/60 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-emerald-100 text-emerald-800 text-xs font-bold hover:bg-white transition-all">
                      Check Pesticide
                   </button>
                </div>

                <div className="mb-8 relative">
                   <div className="w-32 h-32 bg-emerald-500 rounded-full blur-[60px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 animate-pulse"></div>
                   <LeafIcon className="w-24 h-24 text-emerald-600 relative z-10 drop-shadow-lg" />
                </div>
                
                <h1 className="text-5xl md:text-7xl font-heading font-bold text-emerald-950 mb-4 tracking-tight">
                   AI Crop Doctor
                </h1>
                <p className="text-lg text-gray-600 max-w-md mx-auto mb-12 leading-relaxed">
                   Upload a plant photo. Get the disease. Get the cure. <br/><span className="text-emerald-600 font-semibold">Instantly & Anonymously.</span>
                </p>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative px-8 py-5 bg-emerald-600 text-white rounded-full font-bold text-xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.4)] hover:-translate-y-1 transition-all duration-300 btn-liquid overflow-hidden"
                >
                   <span className="relative z-10 flex items-center gap-3">
                      <ScanLineIcon className="w-6 h-6 group-hover:animate-pulse" />
                      Scan Your Plant
                   </span>
                </button>

                <p className="mt-8 text-xs text-gray-400 font-medium">
                   No Login Required • 100% Free • Private
                </p>
             </div>
          )}

          {/* --- SCANNING STATE --- */}
          {viewState === ViewState.SCANNING && (
             <div className="flex-1 flex flex-col items-center justify-center bg-black/95 text-white z-50">
                 <div className="relative w-72 h-72">
                    <img src={uploadedFile?.previewUrl} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-50 blur-sm" />
                    <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
                 </div>
                 <h2 className="mt-8 text-2xl font-bold animate-pulse text-emerald-400">Analyzing Bio-Markers...</h2>
                 <p className="text-gray-400 mt-2">Identifying pathogen signatures</p>
             </div>
          )}

          {/* --- RESULT STATE --- */}
          {viewState === ViewState.RESULT && plantResult && uploadedFile && (
             <PlantCard data={plantResult} imagePreview={uploadedFile.previewUrl} onReset={reset} />
          )}

          {/* --- PESTICIDE CHECKER --- */}
          {viewState === ViewState.PESTICIDE_CHECK && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in bg-slate-50">
                  <button onClick={reset} className="absolute top-6 left-6 p-2 rounded-full bg-white shadow-sm"><XIcon className="w-6 h-6 text-gray-500" /></button>
                  
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                     <ShieldCheckIcon className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Fake Pesticide Checker</h2>
                  <p className="text-slate-500 mb-8 max-w-sm">Upload a photo of the bottle label. Our AI checks for genuine batch codes and packaging anomalies.</p>
                  
                  {!pesticideResult ? (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full max-w-sm h-64 border-2 border-dashed border-blue-300 rounded-3xl flex flex-col items-center justify-center bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                     >
                        {isAnalyzing ? (
                           <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                           <>
                             <UploadIcon className="w-10 h-10 text-blue-400 mb-2" />
                             <span className="font-bold text-blue-600">Tap to Upload Label</span>
                           </>
                        )}
                     </div>
                  ) : (
                     <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-scale-in">
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                           pesticideResult.status === 'GENUINE' ? 'bg-emerald-100 text-emerald-600' : 
                           pesticideResult.status === 'EXPIRED' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                           {pesticideResult.status === 'GENUINE' ? <ShieldCheckIcon className="w-12 h-12" /> : <WarningIcon className="w-12 h-12" />}
                        </div>
                        <h3 className={`text-3xl font-bold mb-2 ${
                           pesticideResult.status === 'GENUINE' ? 'text-emerald-600' : 
                           pesticideResult.status === 'EXPIRED' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                           {pesticideResult.status}
                        </h3>
                        <p className="text-gray-600 font-medium">{pesticideResult.product_name}</p>
                        <div className="mt-6 text-left bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed">
                           {pesticideResult.details}
                        </div>
                        <button onClick={() => setPesticideResult(null)} className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Check Another</button>
                     </div>
                  )}
              </div>
          )}

       </main>

       {/* Hidden Input */}
       <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

       {/* Chat Bot (Global) */}
       {viewState !== ViewState.SCANNING && <ChatBot />}
    </div>
  );
};

export default App;