
import React, { useState, useRef, useEffect } from 'react';
import { HistoryItem } from '../types';
import { analyzePlantNutrients } from '../services/geminiService';

interface NutrientAnalyzerProps {
  onAddToHistory: (item: HistoryItem) => void;
  initialData?: HistoryItem | null;
}

const NutrientAnalyzer: React.FC<NutrientAnalyzerProps> = ({ onAddToHistory, initialData }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<HistoryItem['nutrientData'] | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData && initialData.type === 'nutrient-analysis' && initialData.nutrientData) {
      setResult(initialData.nutrientData);
      setCurrentImage(initialData.imageUrl || null);
    }
  }, [initialData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        setCurrentImage(base64String);
        await performAnalysis(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const performAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const data = await analyzePlantNutrients(base64);
      if (!data) throw new Error("Nutrient analysis returned empty data.");
      
      setResult(data);
      
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'nutrient-analysis',
        plantName: "Plant Nutrient Check",
        imageUrl: base64,
        nutrientData: data
      };
      onAddToHistory(historyItem);
    } catch (err) {
      console.error("Nutrient analysis error:", err);
      setError("Failed to analyze nutrients. Please ensure the plant leaf is clearly visible.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setCurrentImage(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500';
    if (score >= 50) return 'text-yellow-500 border-yellow-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 py-10 pb-20">
      <div className="max-w-4xl mx-auto space-y-6 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nutrient Health Scanner</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Upload a plant photo to detect Nitrogen, Phosphorus, Potassium, and other mineral deficiencies.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {!result && !isAnalyzing && !error && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-4 border-dashed border-emerald-100 rounded-[3rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-500 overflow-hidden"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-xl font-bold text-slate-800">Scan for Nutrients</h3>
            <p className="text-slate-400 mt-2">Check N-P-K levels & vitality</p>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white rounded-[3rem] p-16 shadow-2xl border border-emerald-100 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 animate-pulse">Calculating Health Score...</h3>
              <p className="text-slate-500 text-sm mt-1">Checking for chlorosis, necrosis, and stunting</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-[3rem] p-16 shadow-xl border border-red-100 flex flex-col items-center justify-center space-y-6 text-center">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl">⚠️</div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Scan Failed</h3>
                <p className="text-slate-500 text-sm max-w-sm">{error}</p>
             </div>
             <button 
                onClick={resetAnalysis}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
             >
                Try Again
             </button>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Score Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Plant Health Score</p>
                <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center mb-6 ${getScoreColor(result.healthScore)}`}>
                  <div>
                    <span className="text-5xl font-black">{result.healthScore}</span>
                    <span className="text-xl font-bold opacity-50">/100</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {result.healthScore >= 80 ? 'Excellent Vigor' : result.healthScore >= 50 ? 'Needs Attention' : 'Critical Condition'}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {result.healthScore >= 80 ? 'The plant looks healthy and robust.' : 'Deficiencies detected. Immediate action advised.'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Scanned Image</p>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    {currentImage && <img src={`data:image/jpeg;base64,${currentImage}`} className="w-full h-full object-cover" alt="Analyzed Plant" />}
                  </div>
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deficiencies */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">📉</div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-6">Detected Deficiencies</h3>
                  {(result.deficiencies && result.deficiencies.length > 0 && result.deficiencies[0] !== 'None') ? (
                    <div className="flex flex-wrap gap-3">
                      {result.deficiencies.map((def, i) => (
                        <span key={i} className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-2xl text-lg">
                          {def}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-6 py-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold rounded-2xl text-lg">
                      <span className="mr-2">✓</span> No Major Deficiencies
                    </div>
                  )}
                  
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Observed Symptoms</p>
                    <ul className="space-y-2">
                      {(result.symptoms || []).map((sym, i) => (
                        <li key={i} className="flex items-start text-slate-300 text-sm">
                          <span className="mr-2 text-yellow-500">•</span> {sym}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-2xl">💊</span>
                  <h3 className="text-2xl font-black text-slate-900">Recommended Action</h3>
                </div>
                <div className="space-y-4">
                   {(result.recommendations || []).map((rec, i) => (
                     <div key={i} className="flex items-start p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mr-4 mt-0.5 flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed">{rec}</p>
                     </div>
                   ))}
                </div>
              </div>

              <button 
                onClick={resetAnalysis}
                className="w-full py-5 bg-slate-100 text-slate-900 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all shadow-md active:scale-[0.98]"
               >
                 Scan Another Plant
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutrientAnalyzer;
