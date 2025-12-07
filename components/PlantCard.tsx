import React, { useState } from 'react';
import { PlantAnalysis } from '../types';
import { LeafIcon } from './Icons';

interface PlantCardProps {
  data: PlantAnalysis;
  imagePreview: string;
  onReset: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ data, imagePreview, onReset }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'treatment'>('analysis');
  // Dynamic confidence score based on diagnosis presence for UI effect
  const confidence = data.diagnosis.confidence_score ? Math.round(data.diagnosis.confidence_score * 100) : 98;

  return (
    <div className="w-full h-full flex flex-col animate-fade-in relative z-10 pb-24 bg-black">
      {/* Cinematic Header with Holographic Image */}
      <div className="relative h-72 w-full overflow-hidden rounded-b-[3rem] shadow-2xl border-b border-white/10 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
        <img 
          src={imagePreview} 
          alt="Analyzed Plant" 
          className="w-full h-full object-cover opacity-80"
        />
        
        {/* Holographic Overlay Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
             <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-emerald-500/30 rounded-full animate-ping opacity-20"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10"></div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
          <div className="flex-1 mr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 text-[10px] tracking-widest font-bold uppercase backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                AI Identified
              </span>
              {data.diagnosis.has_disease ? (
                <span className="px-3 py-1 rounded-full border border-red-500/50 bg-red-500/20 text-red-300 text-[10px] tracking-widest font-bold uppercase animate-pulse backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                  Action Required
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full border border-blue-500/50 bg-blue-500/20 text-blue-300 text-[10px] tracking-widest font-bold uppercase backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  Healthy
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none drop-shadow-xl break-words">{data.name}</h1>
            <p className="text-emerald-200 font-mono text-sm mt-1 opacity-90 italic">{data.scientific_name}</p>
          </div>
          
          {/* Confidence Meter */}
          <div className="text-right shrink-0">
             <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="transparent" />
                  <circle cx="28" cy="28" r="24" stroke="#10b981" strokeWidth="4" fill="transparent" strokeDasharray="150" strokeDashoffset={150 - (150 * confidence) / 100} className="transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute text-xs font-bold text-white">{confidence}%</span>
             </div>
             <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Accuracy</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center gap-4 -mt-6 relative z-30 px-6 shrink-0">
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-4 rounded-2xl font-bold text-sm backdrop-blur-xl transition-all duration-300 border shadow-lg ${activeTab === 'analysis' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-zinc-900/90 border-white/10 text-gray-400 hover:bg-zinc-800'}`}
        >
          Diagnosis
        </button>
        <button 
          onClick={() => setActiveTab('treatment')}
          className={`flex-1 py-4 rounded-2xl font-bold text-sm backdrop-blur-xl transition-all duration-300 border shadow-lg ${activeTab === 'treatment' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-zinc-900/90 border-white/10 text-gray-400 hover:bg-zinc-800'}`}
        >
          Treatment & Care
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        
        {activeTab === 'analysis' ? (
          <>
            {/* Main Diagnosis Card */}
            <div className={`p-6 rounded-3xl border ${data.diagnosis.has_disease ? 'bg-red-950/30 border-red-500/30' : 'bg-emerald-950/30 border-emerald-500/30'} backdrop-blur-md shadow-xl`}>
               <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Analysis Result</h3>
               <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className={`shrink-0 p-4 rounded-2xl ${data.diagnosis.has_disease ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} mb-2 sm:mb-0`}>
                     <LeafIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold leading-tight ${data.diagnosis.has_disease ? 'text-red-100' : 'text-emerald-50'}`}>
                      {data.diagnosis.has_disease ? data.diagnosis.disease_name : 'Healthy & Thriving'}
                    </h2>
                    <p className="text-base text-gray-200 mt-3 leading-relaxed font-light">
                       {data.diagnosis.has_disease ? data.diagnosis.symptoms : data.description}
                    </p>
                  </div>
               </div>
            </div>

            {/* Vitals Grid - High Contrast - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <VitalCard label="Water" value={data.care.water} icon="💧" delay="0ms" />
               <VitalCard label="Sunlight" value={data.care.sunlight} icon="☀️" delay="100ms" />
               <VitalCard label="Temperature" value={data.care.temperature} icon="🌡️" delay="200ms" />
               <VitalCard label="Soil Type" value={data.care.soil} icon="🌱" delay="300ms" />
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in">
             {/* Treatment Plan */}
             {data.diagnosis.has_disease ? (
               <div className="bg-zinc-900/90 border border-red-500/20 p-6 rounded-3xl shadow-xl backdrop-blur-md">
                 <h3 className="text-xs text-red-400 uppercase tracking-widest mb-6 font-bold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                   Treatment Plan
                 </h3>
                 <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-red-500/50 before:to-zinc-800">
                    {data.diagnosis.cure_instructions?.map((step, idx) => (
                      <div key={idx} className="relative pl-12 group">
                        <span className="absolute left-0 top-0 w-10 h-10 rounded-full bg-zinc-900 border-2 border-red-500 flex items-center justify-center text-sm text-red-400 font-bold z-10 shadow-[0_0_10px_rgba(239,68,68,0.2)] group-hover:scale-110 transition-transform">
                          {idx + 1}
                        </span>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                           <p className="text-base text-gray-100 leading-relaxed font-medium">{step}</p>
                        </div>
                      </div>
                    ))}
                 </div>
                 
                 {data.diagnosis.preventative_measures && data.diagnosis.preventative_measures.length > 0 && (
                   <div className="mt-8 pt-6 border-t border-white/10">
                     <h4 className="text-xs text-orange-400 uppercase tracking-widest mb-4 font-bold">Prevention</h4>
                     <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm pl-2">
                       {data.diagnosis.preventative_measures.map((measure, i) => (
                         <li key={i}>{measure}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             ) : (
                <div className="bg-emerald-900/20 border border-emerald-500/20 p-6 rounded-3xl shadow-xl backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                        <LeafIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">No Treatment Needed</h3>
                        <p className="text-sm text-emerald-200/80">Your plant is healthy! Follow the growth protocol below to maintain its health.</p>
                    </div>
                </div>
             )}

             {/* Planting Guide */}
             <div className="bg-zinc-900/90 border border-white/10 p-6 rounded-3xl shadow-xl backdrop-blur-md">
                <h3 className="text-xs text-emerald-400 uppercase tracking-widest mb-6 font-bold">Growth Protocol</h3>
                <div className="space-y-4">
                  {data.planting_guide.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                       <div className="text-emerald-500 font-mono text-xl font-bold opacity-80 mt-1">0{idx + 1}</div>
                       <p className="text-base text-gray-200 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="h-8"></div>
    </div>
  );
};

// Updated VitalCard to allow dynamic height
const VitalCard = ({ label, value, icon, delay }: { label: string, value: string, icon: string, delay: string }) => (
  <div 
    className="bg-zinc-900/80 border border-white/10 p-5 rounded-2xl flex flex-col gap-3 shadow-lg animate-fade-in-up h-full hover:bg-zinc-800/80 transition-colors group"
    style={{ animationDelay: delay }}
  >
    <div className="flex justify-between items-start">
      <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider bg-emerald-500/10 px-2 py-1 rounded-md whitespace-nowrap">{label}</span>
    </div>
    <p className="text-sm text-gray-100 font-medium leading-relaxed">{value}</p>
  </div>
);
