import React, { useState } from 'react';
import { PlantDiagnosis } from '../types';
import { LeafIcon, ShareIcon, XIcon, DownloadIcon, WarningIcon, ShieldCheckIcon, HomeIcon, SunIcon } from './Icons';
import { jsPDF } from "jspdf";

interface PlantCardProps {
  data: PlantDiagnosis;
  imagePreview: string;
  onReset: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ data, imagePreview, onReset }) => {
  const [activeTab, setActiveTab] = useState<'organic' | 'chemical' | 'care'>('organic');

  const getSeverityColor = (s: string) => {
    if (s === 'HIGH') return 'text-red-500 bg-red-50 border-red-200';
    if (s === 'MEDIUM') return 'text-orange-500 bg-orange-50 border-orange-200';
    return 'text-emerald-500 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f0fdf4] overflow-y-auto animate-fade-in relative">
      
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 flex justify-between items-center shadow-sm">
        <button onClick={onReset} className="p-2 rounded-full hover:bg-emerald-50 text-emerald-800 transition-colors">
          <XIcon className="w-6 h-6" />
        </button>
        <h1 className="font-heading font-bold text-lg text-emerald-900">Diagnosis Report</h1>
        <button className="p-2 rounded-full hover:bg-emerald-50 text-emerald-600">
          <ShareIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full pb-24">
        
        {/* Hero Section */}
        <div className="p-6">
           <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/3 aspect-square rounded-3xl overflow-hidden shadow-lg border-4 border-white relative group">
                 <img src={imagePreview} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" alt="Plant" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                 <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${getSeverityColor(data.severity)}`}>
                    {data.severity} SEVERITY
                 </div>
              </div>

              <div className="flex-1 space-y-4 w-full">
                 <div>
                    <h2 className="text-3xl font-heading font-bold text-gray-900 leading-tight">{data.disease_name}</h2>
                    <p className="text-emerald-600 font-medium text-sm mt-1">{data.plant_name}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel p-4 rounded-2xl bg-white">
                       <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Spread Risk</p>
                       <p className="font-semibold text-gray-800">{data.spread_risk}</p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl bg-white">
                       <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Recoverable?</p>
                       <p className={`font-semibold ${data.is_recoverable ? 'text-emerald-600' : 'text-red-500'}`}>
                         {data.is_recoverable ? `Yes (~${data.recovery_time_days})` : 'Unlikely'}
                       </p>
                    </div>
                 </div>

                 <div className="glass-panel p-4 rounded-2xl bg-red-50/50 border-red-100">
                    <div className="flex items-center gap-2 mb-2 text-red-800">
                       <WarningIcon className="w-5 h-5" />
                       <span className="font-bold text-sm uppercase">Emergency Action</span>
                    </div>
                    <ul className="space-y-2">
                       {data.emergency_actions?.map((act, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                             <span><strong className="text-red-700">{act.action}</strong>: {act.reason}</span>
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>
        </div>

        {/* Treatment Tabs */}
        <div className="px-6 mt-4">
           <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-emerald-100 mb-6">
              <button 
                onClick={() => setActiveTab('organic')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'organic' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                🌿 Organic
              </button>
              <button 
                 onClick={() => setActiveTab('chemical')}
                 className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'chemical' ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                🧪 Chemical
              </button>
              <button 
                 onClick={() => setActiveTab('care')}
                 className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'care' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                📅 Daily Care
              </button>
           </div>

           <div className="animate-fade-in-up">
              {activeTab === 'organic' && (
                 <div className="space-y-6">
                    {data.organic_treatments?.map((t, i) => (
                       <div key={i} className="glass-card p-6 rounded-3xl bg-white border-l-4 border-l-emerald-500">
                          <h3 className="text-xl font-bold text-emerald-900 mb-4">{t.name}</h3>
                          
                          <div className="mb-6">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ingredients</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {t.ingredients?.map((ing, j) => (
                                   <div key={j} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                      <span className="font-medium text-emerald-800">{ing.name}</span>
                                      <span className="text-sm bg-white px-2 py-1 rounded-lg shadow-sm text-emerald-600 font-bold">{ing.quantity}</span>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="mb-4">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preparation Steps</h4>
                             <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                                {t.preparation_steps?.map((step, k) => <li key={k} className="leading-relaxed">{step}</li>)}
                             </ol>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100/50 p-3 rounded-xl">
                             <span className="font-bold">📅 Frequency:</span> {t.application_frequency}
                          </div>
                       </div>
                    ))}
                 </div>
              )}

              {activeTab === 'chemical' && (
                 <div className="space-y-6">
                    {data.chemical_treatments?.map((t, i) => (
                       <div key={i} className="glass-card p-6 rounded-3xl bg-white border-l-4 border-l-blue-500">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-xl font-bold text-blue-900">{t.product_name}</h3>
                                <p className="text-blue-500 text-sm">{t.purpose}</p>
                             </div>
                             <div className="text-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-400 uppercase font-bold">Waiting</p>
                                <p className="text-lg font-bold text-blue-700">{t.waiting_period_days} <span className="text-xs">days</span></p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold">Dosage</p>
                                <p className="text-lg font-bold text-gray-800">{t.dosage_per_liter}</p>
                             </div>
                             <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold">Frequency</p>
                                <p className="text-lg font-bold text-gray-800">{t.application_frequency}</p>
                             </div>
                          </div>

                          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                             <WarningIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                             <p className="text-sm text-red-700 font-medium leading-relaxed">{t.safety_warning}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}

              {activeTab === 'care' && (
                 <div className="glass-card p-6 rounded-3xl bg-white">
                    <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-300 before:to-transparent">
                       
                       <div className="relative pl-12">
                          <div className="absolute left-0 top-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                             <SunIcon className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2">Morning</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                             {data.daily_care_plan?.morning?.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                       </div>

                       <div className="relative pl-12">
                          <div className="absolute left-0 top-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                             <div className="w-3 h-3 bg-current rounded-full"></div>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2">Afternoon</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                             {data.daily_care_plan?.afternoon?.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                       </div>

                       <div className="relative pl-12">
                          <div className="absolute left-0 top-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                             <div className="w-3 h-3 bg-current rounded-full"></div>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2">Evening</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                             {data.daily_care_plan?.evening?.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                       </div>

                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100">
                       <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                          <ShieldCheckIcon className="w-5 h-5" /> Weekly Prevention
                       </h4>
                       <ul className="grid grid-cols-1 gap-2">
                          {data.daily_care_plan?.weekly_prevention?.map((s, i) => (
                             <li key={i} className="text-sm bg-emerald-50 px-3 py-2 rounded-lg text-emerald-800 font-medium">✓ {s}</li>
                          ))}
                       </ul>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};