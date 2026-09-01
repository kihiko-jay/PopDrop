import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle,
  X,
  Compass
} from "lucide-react";
import { UserLocation } from "../types";

interface PhotoAnalyzerModalProps {
  userLocation: UserLocation;
  onClose: () => void;
  onSpawnDropFromAnalysis?: (analysisData: any) => void;
}

export const PhotoAnalyzerModal: React.FC<PhotoAnalyzerModalProps> = ({
  userLocation,
  onClose,
  onSpawnDropFromAnalysis,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample quick test images (Cafe storefront, Matcha lounge, Vinyl record shop)
  const sampleImages = [
    {
      label: "Artisan Coffee Roastery",
      url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    },
    {
      label: "Zen Matcha Bar Patio",
      url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
    },
    {
      label: "Vintage Vinyl Storefront",
      url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80",
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        setAnalysisResult(null);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (url: string) => {
    setSelectedImage(url);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleAnalyzeWithGemini = async () => {
    if (!selectedImage) return;

    try {
      setIsAnalyzing(true);
      setErrorMsg(null);

      // If it's an external url, fetch and convert to base64
      let base64ToSend = selectedImage;
      if (selectedImage.startsWith("http")) {
        const fetchRes = await fetch(selectedImage);
        const blob = await fetchRes.blob();
        const reader = new FileReader();
        base64ToSend = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await fetch("/api/gemini/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64ToSend,
          userLat: userLocation.lat,
          userLng: userLocation.lng,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setErrorMsg(data.error || "Failed to analyze photo with Gemini.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Vision analysis error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/10">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">AI Vision & Storefront Inspector</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  gemini-3.1-pro-preview
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Snap or upload storefront photos, receipts, or discovery spots for multimodal Gemini AI verification.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload / Preview Area */}
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-3xl bg-neutral-950 border-2 border-dashed border-neutral-800 hover:border-sky-500/60 transition cursor-pointer flex flex-col items-center justify-center p-4 relative overflow-hidden group shadow-inner"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Upload preview"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-2 backdrop-blur-xs">
                    <Upload className="w-4 h-4" />
                    <span>Change Photo</span>
                  </div>
                </>
              ) : (
                <div className="text-center flex flex-col items-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-3 group-hover:text-sky-400 transition">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-white">Upload or Snap Photo</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                    Take a photo of a cafe facade, storefront signage, or food item to verify your physical visit.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Sample Selector */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                Or Try Sample Urban Photos:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {sampleImages.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample.url)}
                    className="rounded-xl overflow-hidden border border-neutral-800 hover:border-sky-500 transition relative aspect-video"
                  >
                    <img src={sample.url} alt={sample.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-1.5">
                      <span className="text-[9px] font-bold text-neutral-200 truncate">{sample.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleAnalyzeWithGemini}
              disabled={!selectedImage || isAnalyzing}
              className="w-full py-3.5 px-5 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 font-black text-xs shadow-xl shadow-sky-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini 3.1 Pro Analyzing Photo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with Gemini 3.1 Pro</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Analysis Results Panel */}
          <div>
            {analysisResult ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-5 animate-in fade-in shadow-inner">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      Physical Verification Passed
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800">
                    {analysisResult.authenticity_score}% Authenticity
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Identified Business & Atmosphere
                  </span>
                  <h3 className="text-lg font-black text-white">{analysisResult.business_type}</h3>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5">
                    Detected Architectural & Visual Cues
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detected_items?.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs font-bold bg-neutral-900 border border-neutral-700/80 text-neutral-200 px-2.5 py-1 rounded-xl"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explorer Field Note</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed italic">
                    "{analysisResult.field_note}"
                  </p>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                    AI Recommended Drop Reward Idea
                  </span>
                  <p className="text-xs font-extrabold text-white">
                    {analysisResult.recommended_drop_reward}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] bg-neutral-950/60 border border-neutral-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-3">
                  <Eye className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-extrabold text-neutral-300">Awaiting Image Analysis</h4>
                <p className="text-xs text-neutral-500 max-w-xs mt-1">
                  Upload a photo on the left and click "Analyze with Gemini 3.1 Pro" to inspect local storefront details and verify discovery.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
