import React, { useState } from 'react';
import { PlantDiagnosis } from '../types';
import { ShareIcon, XIcon, WarningIcon, ShieldCheckIcon, SunIcon } from './Icons';

interface PlantCardProps {
  data: PlantDiagnosis;
  imagePreview: string;
  onReset: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ data, imagePreview, onReset }) => {
  const [activeTab, setActiveTab] = useState<'organic' | 'chemical' | 'care'>('organic');

  const getSeverityColor = (s: string) => {
    if (s === 'HIGH') return 'text-red-600 bg-red-100 border-red-200';
    if (s === 'MEDIUM') return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-emerald-600 bg-emerald-100 border-emerald-200';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] overflow-y-auto animate-fade-in-up relative no-scrollbar">
      
      {/* Immersive Header with Parallax Feel */}
      <div className="relative h-80 w-full shrink-0 overflow-hidden">
         <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover scale-105" alt="Plant" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#f8fafc]"></div>
         
         <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
            <button onClick={onReset} className="glass-pill p-3 rounded-full hover:bg-white text-white transition-colors backdrop-blur-md">
               <XIcon className="w-6 h-6" />
            </button>
            <button className="glass-pill p-3 rounded-full hover:bg-white text-white transition-colors backdrop-blur-md">
               <ShareIcon className="w-6 h-6" />
            </button>
         </div>

         <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
             <div className="flex items-end gap-4 mb-2">
                 <h1 className="text-4xl font-heading font-extrabold text-slate-900 leading-none drop-shadow-sm">{data.disease_name}</h1>
                 <span className={`mb-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getSeverityColor(data.severity)}`}>
                    {data.severity} Severity
                 </span>
             </div>
             <p className="text-slate-600 font-medium text-lg">{data.plant_name}</p>
         </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 pb-32 -mt-4 relative z-10">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
               <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Spread Risk</p>
               <p className="font-bold text-slate-800 text-lg">{data.spread_risk}</p>
           </div>
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
               <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Recovery</p>
               <p className={`font-bold text-lg ${data.is_recoverable ? 'text-emerald-600' : 'text-red-500'}`}>
                 {data.is_recoverable ? `~${data.recovery_time_days} Days` : 'Difficult'}
               </p>
           </div>
        </div>

        {/* Emergency Action (If Needed) */}
        {data.emergency_actions && data.emergency_actions.length > 0 && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-3xl flex flex-col gap-3 shadow-sm animate-scale-in">
               <div className="flex items-center gap-2 text-red-700">
                  <WarningIcon className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wide text-xs">Immediate Action Required</span>
               </div>
               <ul className="space-y-3">
                  {data.emergency_actions.map((act, i) => (
                     <li key={i} className="text-sm text-slate-700 bg-white/60 p-3 rounded-xl border border-red-100/50">
                        <strong className="text-red-800 block mb-1">{act.action}</strong>
                        {act.reason}
                     </li>
                  ))}
               </ul>
            </div>
        )}

        {/* Sliding Tabs */}
        <div className="relative bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8 flex">
           {/* Slider Background - simplified logic for demo, typically needs generic calculation */}
           <div 
             className="absolute top-1.5 bottom-1.5 rounded-xl bg-emerald-500 shadow-md transition-all duration-300 ease-out"
             style={{
               left: activeTab === 'organic' ? '0.375rem' : activeTab === 'chemical' ? '33.33%' : '66.66%',
               width: 'calc(33.33% - 0.5rem)'
             }}
           ></div>

           <button 
             onClick={() => setActiveTab('organic')}
             className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors duration-300 ${activeTab === 'organic' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Organic
           </button>
           <button 
              onClick={() => setActiveTab('chemical')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors duration-300 ${activeTab === 'chemical' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Chemical
           </button>
           <button 
              onClick={() => setActiveTab('care')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors duration-300 ${activeTab === 'care' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Daily Care
           </button>
        </div>

        {/* Tab Content with staggered animation */}
        <div className="min-h-[300px]">
           {activeTab === 'organic' && (
              <div className="space-y-6 animate-fade-in-up">
                 {data.organic_treatments?.map((t, i) => (
                    <div key={i} className="glass-card p-6 rounded-[2rem] bg-white border border-white">
                       <h3 className="text-2xl font-bold text-emerald-900 mb-2">{t.name}</h3>
                       <div className="h-1 w-12 bg-emerald-400 rounded-full mb-6"></div>
                       
                       <div className="mb-6 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4 opacity-70">Recipe Ingredients</h4>
                          <div className="space-y-3">
                             {t.ingredients?.map((ing, j) => (
                                <div key={j} className="flex justify-between items-center pb-2 border-b border-emerald-200/50 last:border-0 last:pb-0">
                                   <span className="font-medium text-slate-700">{ing.name}</span>
                                   <span className="text-sm font-bold text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm">{ing.quantity}</span>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Preparation Steps</h4>
                          <div className="space-y-4">
                             {t.preparation_steps?.map((step, k) => (
                                <div key={k} className="flex gap-4 items-start group">
                                   <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">{k+1}</span>
                                   <p className="text-slate-600 leading-relaxed pt-1">{step}</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}

           {activeTab === 'chemical' && (
              <div className="space-y-6 animate-fade-in-up">
                 {data.chemical_treatments?.map((t, i) => (
                    <div key={i} className="glass-card p-6 rounded-[2rem] bg-white border border-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 z-0"></div>
                       
                       <div className="relative z-10">
                          <span className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold uppercase mb-3">Commercial Product</span>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">{t.product_name}</h3>
                          <p className="text-blue-500 font-medium mb-6">{t.purpose}</p>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Mix Ratio</p>
                                <p className="text-lg font-bold text-slate-800">{t.dosage_per_liter}</p>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Wait Time</p>
                                <p className="text-lg font-bold text-slate-800">{t.waiting_period_days} Days</p>
                             </div>
                          </div>

                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                             <WarningIcon className="w-5 h-5 text-rose-500 shrink-0" />
                             <p className="text-xs text-rose-700 font-medium leading-relaxed">{t.safety_warning}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}

           {activeTab === 'care' && (
              <div className="glass-card p-8 rounded-[2rem] bg-white animate-fade-in-up">
                 <div className="relative border-l-2 border-emerald-100 space-y-10 ml-3">
                    
                    <div className="relative pl-8">
                       <div className="absolute -left-[21px] top-0 w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                          <SunIcon className="w-5 h-5" />
                       </div>
                       <h4 className="font-bold text-lg text-slate-900 mb-3">Morning Routine</h4>
                       <ul className="space-y-3">
                          {data.daily_care_plan?.morning?.map((s, i) => (
                            <li key={i} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{s}</li>
                          ))}
                       </ul>
                    </div>

                    <div className="relative pl-8">
                       <div className="absolute -left-[21px] top-0 w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                          <div className="w-3 h-3 bg-current rounded-full"></div>
                       </div>
                       <h4 className="font-bold text-lg text-slate-900 mb-3">Afternoon Checks</h4>
                       <ul className="space-y-3">
                          {data.daily_care_plan?.afternoon?.map((s, i) => (
                             <li key={i} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{s}</li>
                          ))}
                       </ul>
                    </div>

                    <div className="relative pl-8">
                       <div className="absolute -left-[21px] top-0 w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                          <div className="w-3 h-3 bg-current rounded-full"></div>
                       </div>
                       <h4 className="font-bold text-lg text-slate-900 mb-3">Evening Care</h4>
                       <ul className="space-y-3">
                          {data.daily_care_plan?.evening?.map((s, i) => (
                             <li key={i} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{s}</li>
                          ))}
                       </ul>
                    </div>
                 </div>
                 
                 <div className="mt-10 pt-8 border-t border-slate-100">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                       <ShieldCheckIcon className="w-5 h-5" /> 
                       Prevention Tips
                    </h4>
                    <div className="grid gap-3">
                       {data.daily_care_plan?.weekly_prevention?.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm bg-emerald-50/50 p-3 rounded-xl text-emerald-800 border border-emerald-100/50">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                             {s}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};