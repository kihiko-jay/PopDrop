import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  Download, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Store,
  Wifi
} from "lucide-react";
import { Claim } from "../types";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";

interface WalletPassExportModalProps {
  claim: Claim;
  onClose: () => void;
}

export const WalletPassExportModal: React.FC<WalletPassExportModalProps> = ({
  claim,
  onClose,
}) => {
  const [walletType, setWalletType] = useState<"apple" | "google">("apple");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const drop = claim.drop;

  const handleExport = async () => {
    try {
      setDownloading(true);
      soundManager.playProximityUnlock();
      triggerHaptic("tap");

      const res = await fetch("/api/wallet/export-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id: claim.id,
          format: walletType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Create simulated client-side download of pass JSON
        const blob = new Blob([JSON.stringify(data.pass_data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `PopDrop_Pass_${claim.redemption_code}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloaded(true);
        soundManager.playClaimVictory("Rare");
        triggerHaptic("claim_rare");
      }
    } catch (err: any) {
      alert(err.message || "Failed to export pass.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-800/60 border border-neutral-700/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-5">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
            Offline 1-Tap Pass Export
          </span>
          <h2 className="text-xl font-black text-white">
            Add to Mobile Wallet
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Store this voucher on your device for instant lock screen & NFC storefront access.
          </p>
        </div>

        {/* Wallet Type Switcher */}
        <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-2xl border border-neutral-800 mb-5">
          <button
            onClick={() => setWalletType("apple")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              walletType === "apple"
                ? "bg-neutral-800 text-white shadow-md border border-neutral-700"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>Apple Wallet</span>
          </button>
          <button
            onClick={() => setWalletType("google")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              walletType === "google"
                ? "bg-neutral-800 text-white shadow-md border border-neutral-700"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>Google Wallet</span>
          </button>
        </div>

        {/* Realistic Apple/Google Wallet Pass Preview Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/70 rounded-3xl p-5 mb-5 shadow-2xl relative overflow-hidden text-white">
          {/* Top Pass Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] font-black">
                P
              </div>
              <span className="text-xs font-bold tracking-tight text-neutral-200">
                {drop?.business_name || "PopDrop Partner"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>NFC Ready</span>
            </div>
          </div>

          {/* Pass Body Fields */}
          <div className="mb-4">
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold block">
              OFFLINE REWARD PASS
            </span>
            <h4 className="text-lg font-black text-white leading-tight">
              {drop?.reward_data?.value || "Special Perk"}
            </h4>
            <div className="flex items-center justify-between text-xs text-neutral-400 mt-2 font-mono">
              <span>Expires: {new Date(claim.expires_at).toLocaleDateString()}</span>
              <span className="text-amber-300 font-bold">
                +{drop?.reward_data?.pops_awarded || 50} Pops
              </span>
            </div>
          </div>

          {/* QR Code in Wallet Pass */}
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
            <QRCodeSVG
              value={claim.redemption_code}
              size={120}
              level="H"
              includeMargin={false}
              fgColor="#090a0f"
            />
            <span className="text-[11px] font-mono font-black text-neutral-900 mt-1.5 tracking-wider">
              {claim.redemption_code}
            </span>
          </div>
        </div>

        {/* Download & Export Action */}
        <button
          onClick={handleExport}
          disabled={downloading}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-2"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Pass Saved to Device!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>
                {downloading
                  ? "Packaging Digital Pass..."
                  : `Export ${walletType === "apple" ? ".pkpass" : "Google Pay Pass"}`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
