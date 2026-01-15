
import React, { useState } from 'react';
import { PlantDiagnosis } from '../types';
import { ShareIcon, XIcon, WarningIcon, ShieldCheckIcon, SunIcon, SparklesIcon, LeafIcon } from './Icons';

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

  const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 animate-fade-in">
       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
          <LeafIcon className="w-8 h-8" />
       </div>
       <h4 className="text-slate-800 font-bold mb-1">{title}</h4>
       <p className="text-slate-400 text-sm max-w-[200px]">{description}</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] overflow-y-auto animate-fade-in-up relative no-scrollbar">
      
      {/* Immersive Header */}
      <div className="relative h-80 w-full shrink-0 overflow-hidden">
         <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover scale-105" alt="Plant" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f8fafc]"></div>
         
         <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
            <button onClick={onReset} className="glass-pill p-3 rounded-full hover:bg-white text-white transition-colors backdrop-blur-md shadow-lg">
               <XIcon className="w-6 h-6" />
            </button>
            <button className="glass-pill p-3 rounded-full hover:bg-white text-white transition-colors backdrop-blur-md shadow-lg">
               <ShareIcon className="w-6 h-6" />
            </button>
         </div>

         <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
             <div className="flex flex-wrap items-center gap-3 mb-2">
                 <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 leading-none drop-shadow-sm">
                   {data.disease_name || "Unknown Condition"}
                 </h1>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getSeverityColor(data.severity || 'LOW')}`}>
                    {data.severity || 'LOW'} Severity
                 </span>
             </div>
             <p className="text-slate-600 font-bold text-lg">{data.plant_name || "Unknown Species"}</p>
         </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 pb-32 -mt-4 relative z-10">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Spread Risk</p>
               <p className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                 {data.spread_risk || "Low - Monitored"}
               </p>
           </div>
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Recovery Goal</p>
               <p className={`font-bold text-base md:text-lg ${data.is_recoverable ? 'text-emerald-600' : 'text-red-500'}`}>
                 {data.is_recoverable ? `~${data.recovery_time_days || '7'} Days` : 'Intensive Care'}
               </p>
           </div>
        </div>

        {/* Emergency Actions */}
        {data.emergency_actions && data.emergency_actions.length > 0 && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-3xl shadow-sm animate-scale-in">
               <div className="flex items-center gap-2 text-red-700 mb-3">
                  <WarningIcon className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Critical Intervention</span>
               </div>
               <ul className="space-y-3">
                  {data.emergency_actions.map((act, i) => (
                     <li key={i} className="text-sm text-slate-700 bg-white/80 p-3 rounded-xl border border-red-200/50">
                        <strong className="text-red-800 block mb-1 text-xs">{act.action}</strong>
                        {act.reason}
                     </li>
                  ))}
               </ul>
            </div>
        )}

        {/* Sliding Tabs */}
        <div className="relative bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8 flex h-14">
           <div 
             className="absolute top-1.5 bottom-1.5 rounded-xl bg-emerald-500 shadow-md transition-all duration-300 ease-out z-0"
             style={{
               left: activeTab === 'organic' ? '0.375rem' : activeTab === 'chemical' ? '33.33%' : '66.66%',
               width: 'calc(33.33% - 0.5rem)'
             }}
           ></div>

           <button 
             onClick={() => setActiveTab('organic')}
             className={`flex-1 rounded-xl text-xs md:text-sm font-bold relative z-10 transition-colors duration-300 ${activeTab === 'organic' ? 'text-white' : 'text-slate-500'}`}
           >
             Organic
           </button>
           <button 
              onClick={() => setActiveTab('chemical')}
              className={`flex-1 rounded-xl text-xs md:text-sm font-bold relative z-10 transition-colors duration-300 ${activeTab === 'chemical' ? 'text-white' : 'text-slate-500'}`}
           >
             Chemical
           </button>
           <button 
              onClick={() => setActiveTab('care')}
              className={`flex-1 rounded-xl text-xs md:text-sm font-bold relative z-10 transition-colors duration-300 ${activeTab === 'care' ? 'text-white' : 'text-slate-500'}`}
           >
             Daily Care
           </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
           {activeTab === 'organic' && (
              <div className="space-y-6 animate-fade-in-up">
                 {(!data.organic_treatments || data.organic_treatments.length === 0) ? (
                   <EmptyState title="No Organic Threats" description="Plant is healthy or needs standard maintenance only." />
                 ) : (
                    data.organic_treatments.map((t, i) => (
                      <div key={i} className="glass-card p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                         <h3 className="text-xl font-bold text-emerald-900 mb-2">{t.name}</h3>
                         <div className="h-1 w-12 bg-emerald-400 rounded-full mb-6"></div>
                         
                         <div className="mb-6 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                            <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4 opacity-70">Preparation Recipe</h4>
                            <div className="space-y-3">
                               {t.ingredients?.map((ing, j) => (
                                  <div key={j} className="flex justify-between items-center pb-2 border-b border-emerald-200/30 last:border-0 last:pb-0">
                                     <span className="text-sm font-medium text-slate-700">{ing.name}</span>
                                     <span className="text-xs font-bold text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm">{ing.quantity}</span>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-4">
                            {t.preparation_steps?.map((step, k) => (
                               <div key={k} className="flex gap-4 items-start group">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-[10px] group-hover:bg-emerald-500 group-hover:text-white transition-colors">{k+1}</span>
                                  <p className="text-sm text-slate-600 leading-relaxed">{step}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                    ))
                 )}
              </div>
           )}

           {activeTab === 'chemical' && (
              <div className="space-y-6 animate-fade-in-up">
                 {(!data.chemical_treatments || data.chemical_treatments.length === 0) ? (
                    <EmptyState title="No Chemicals Needed" description="Organic methods are preferred for this specific diagnosis." />
                 ) : (
                    data.chemical_treatments.map((t, i) => (
                      <div key={i} className="glass-card p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50"></div>
                         <div className="relative z-10">
                            <span className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black uppercase mb-3">Commercial Standard</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{t.product_name}</h3>
                            <p className="text-sm text-blue-500 font-medium mb-6">{t.purpose}</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                               <div className="p-4 bg-slate-50 rounded-2xl">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Dosage</p>
                                  <p className="text-sm font-bold text-slate-800">{t.dosage_per_liter}</p>
                               </div>
                               <div className="p-4 bg-slate-50 rounded-2xl">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Safety Gap</p>
                                  <p className="text-sm font-bold text-slate-800">{t.waiting_period_days} Days</p>
                               </div>
                            </div>

                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                               <WarningIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                               <p className="text-[11px] text-rose-700 font-bold leading-tight">{t.safety_warning}</p>
                            </div>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           )}

           {activeTab === 'care' && (
              <div className="glass-card p-8 rounded-[2rem] bg-white animate-fade-in-up shadow-sm border border-slate-100">
                 {!data.daily_care_plan ? (
                   <EmptyState title="No Care Plan Found" description="The expert is calculating your specific routine." />
                 ) : (
                   <>
                    <div className="relative border-l-2 border-emerald-100 space-y-10 ml-3">
                        <div className="relative pl-8">
                          <div className="absolute -left-[21px] top-0 w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                              <SunIcon className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-base text-slate-900 mb-3">Sunrise Routine</h4>
                          <ul className="space-y-3">
                              {(data.daily_care_plan.morning || []).length > 0 ? data.daily_care_plan.morning.map((s, i) => (
                                <li key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{s}</li>
                              )) : <li className="text-xs text-slate-400 italic">No specific morning tasks.</li>}
                          </ul>
                        </div>

                        <div className="relative pl-8">
                          <div className="absolute -left-[21px] top-0 w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                              <SparklesIcon className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-base text-slate-900 mb-3">Mid-Day Inspection</h4>
                          <ul className="space-y-3">
                              {(data.daily_care_plan.afternoon || []).length > 0 ? data.daily_care_plan.afternoon.map((s, i) => (
                                <li key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{s}</li>
                              )) : <li className="text-xs text-slate-400 italic">No specific afternoon tasks.</li>}
                          </ul>
                        </div>

                        <div className="relative pl-8">
                          <div className="absolute -left-[21px] top-0 w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-lg"></div>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 mb-3">Evening Maintenance</h4>
                          <ul className="space-y-3">
                              {(data.daily_care_plan.evening || []).length > 0 ? data.daily_care_plan.evening.map((s, i) => (
                                <li key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{s}</li>
                              )) : <li className="text-xs text-slate-400 italic">No specific evening tasks.</li>}
                          </ul>
                        </div>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <h4 className="font-black text-[10px] text-emerald-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <ShieldCheckIcon className="w-4 h-4" /> 
                          Long-term Prevention
                        </h4>
                        <div className="grid gap-3">
                          {(data.daily_care_plan.weekly_prevention || []).length > 0 ? data.daily_care_plan.weekly_prevention.map((s, i) => (
                              <div key={i} className="flex items-center gap-3 text-xs bg-emerald-50/40 p-3 rounded-xl text-emerald-800 border border-emerald-100/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                {s}
                              </div>
                          )) : <p className="text-xs text-slate-400 italic">No weekly tasks suggested yet.</p>}
                        </div>
                    </div>
                   </>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
