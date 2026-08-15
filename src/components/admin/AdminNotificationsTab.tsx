import React, { useState } from 'react';
import { BroadcastNotification } from '../../types';
import {
  Bell,
  Send,
  Users,
  Car,
  CheckCircle2,
  Clock,
  Radio,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface AdminNotificationsTabProps {
  notifications: BroadcastNotification[];
  onSendNotification: (n: Omit<BroadcastNotification, 'id' | 'sentAt'>) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  notifications,
  onSendNotification,
  showToast
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'drivers' | 'passengers'>('all');
  const [channel, setChannel] = useState<'push' | 'sms' | 'system'>('push');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    onSendNotification({
      title,
      message,
      target,
      channel,
      deliveredCount: target === 'all' ? 142 : target === 'drivers' ? 18 : 124
    });

    setTitle('');
    setMessage('');
    showToast(`Varsel «${title}» ble kringkastet til ${target === 'all' ? 'alle brukere' : target === 'drivers' ? 'sjåfører' : 'kunder'}!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
            Varselsenter, Push & SMS Kringkasting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Send direktemeldinger til sjåfører på vakt eller push-varsler til passasjerer.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-[#34D186] bg-[#34D186]/10 px-3 py-1 rounded-full border border-[#34D186]/20 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          Nettverk Online
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COMPOSE NOTIFICATION (5 COLS) */}
        <div className="lg:col-span-5 bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Send className="w-4 h-4 text-[#D4AF37]" />
            Ny Kringkasting
          </h3>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Målgruppe *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Alle', icon: Sparkles },
                  { id: 'drivers', label: 'Sjåfører', icon: Car },
                  { id: 'passengers', label: 'Passasjerer', icon: Users }
                ].map((tg) => (
                  <button
                    key={tg.id}
                    type="button"
                    onClick={() => setTarget(tg.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      target === tg.id
                        ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md'
                        : 'bg-[#0B0F19] text-slate-400 border border-white/10'
                    }`}
                  >
                    <tg.icon className="w-3.5 h-3.5" />
                    {tg.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Kanal *</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-bold"
              >
                <option value="push">In-App Push-varsel</option>
                <option value="sms">Direkte SMS</option>
                <option value="system">Systemvarsel (Banner)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Tittel *</label>
              <input
                type="text"
                required
                placeholder="Eks. Høy etterspørsel ved Oslo S!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Meldingstekst *</label>
              <textarea
                required
                rows={3}
                placeholder="Skriv beskjeden som skal sendes ut..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Kringkast Melding Nå
            </button>
          </form>
        </div>

        {/* NOTIFICATION LOG (7 COLS) */}
        <div className="lg:col-span-7 bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <MessageSquare className="w-4 h-4 text-[#34D186]" />
            Tidligere Utsendelser ({notifications.length})
          </h3>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-[#0B0F19] rounded-2xl border border-white/5">
                Ingen tidligere kringkastinger.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 bg-[#0B0F19] rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-xs">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.sentAt).toLocaleString('no-NO')} · Levert til {n.deliveredCount || 1} mottakere
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                      {n.target} ({n.channel})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
