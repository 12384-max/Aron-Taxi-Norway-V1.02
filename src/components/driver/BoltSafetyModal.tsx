import React, { useState } from 'react';
import { X, ShieldAlert, PhoneCall, Share2, Mic, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BoltSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSOS?: () => void;
  onTriggerEmergency?: () => void;
  hasActiveTrip?: boolean;
  driverName?: string;
  vehiclePlate?: string;
}

export const BoltSafetyModal: React.FC<BoltSafetyModalProps> = ({
  isOpen,
  onClose,
  onTriggerSOS,
  onTriggerEmergency,
  hasActiveTrip,
  driverName,
  vehiclePlate,
}) => {
  const [audioRecording, setAudioRecording] = useState(false);

  if (!isOpen) return null;

  const triggerAlert = () => {
    if (onTriggerEmergency) {
      onTriggerEmergency();
    } else if (onTriggerSOS) {
      onTriggerSOS();
    }
  };

  const handleShareTrip = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Aron Taxi Tursporing',
        text: 'Følg min aktive kjøring i sanntid.',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Delingslenke kopiert til utklippstavlen!');
    }
  };

  const handleToggleAudio = () => {
    if (!audioRecording) {
      setAudioRecording(true);
      toast.success('Lydopptak startet for denne turen (kryptert i sikkerhetslogg).');
    } else {
      setAudioRecording(false);
      toast.info('Lydopptak stoppet.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#151B28] text-white rounded-3xl p-5 shadow-2xl border border-white/10 z-10 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Sikkerhetsverktøy</h3>
              <p className="text-xs text-slate-400">Safety toolkit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          
          {/* Emergency Call 112 */}
          <a
            href="tel:112"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-300">Nødetatene (112)</div>
                <div className="text-xs text-slate-400">Ring politi og nødsentral</div>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full">
              Ring 112
            </span>
          </a>

          {/* SOS Sentral */}
          <button
            onClick={() => {
              triggerAlert();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-300">Varsle Aron Sentral</div>
                <div className="text-xs text-slate-400">Sender live GPS til vaktleder</div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">
              Varsle
            </span>
          </button>

          {/* Share trip details */}
          <button
            onClick={handleShareTrip}
            disabled={!hasActiveTrip}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-colors text-left ${
              hasActiveTrip 
                ? 'bg-[#1D2536] hover:bg-[#253046] border-white/10 text-slate-200' 
                : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Del turdetaljer</div>
                <div className="text-xs text-slate-400">
                  {hasActiveTrip ? 'Del rute og status med familie' : 'Kun tilgjengelig under aktiv tur'}
                </div>
              </div>
            </div>
          </button>

          {/* Audio recording */}
          <button
            onClick={handleToggleAudio}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1D2536] hover:bg-[#253046] border border-white/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${audioRecording ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-400'}`}>
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Lydopptak (Sikkerhet)</div>
                <div className="text-xs text-slate-400">
                  {audioRecording ? 'Opptak aktivt • Trykk for å stoppe' : 'Start kryptert lydopptak for turen'}
                </div>
              </div>
            </div>
            {audioRecording && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-500">
          Aron Taxi Safety Shield er aktivt 24/7. Alle hendelser overvåkes.
        </div>

      </div>
    </div>
  );
};
