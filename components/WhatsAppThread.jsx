'use client';

import { CheckCheck, MessageCircle } from 'lucide-react';

function formatTime(dateInput) {
  return new Date(dateInput).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WhatsAppThread({ notifications, devoteeName, phone }) {
  const ordered = [...notifications].sort(
    (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
  );

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden bg-[#efeae2] shadow-sm">
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{devoteeName}</p>
            <p className="text-[11px] text-emerald-100">{phone} · Mock WhatsApp API</p>
          </div>
        </div>
        <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-full">
          {ordered.length} sent
        </span>
      </div>

      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {ordered.length === 0 ? (
          <p className="text-center text-xs text-stone-500 py-6">
            No notifications sent yet for this booking.
          </p>
        ) : (
          ordered.map((notif) => (
            <div key={notif._id} className="flex justify-end">
              <div className="max-w-[92%] rounded-xl rounded-tr-none bg-[#d9fdd3] px-3.5 py-2.5 shadow-sm border border-emerald-200/70">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                    {notif.stage}
                  </span>
                  <span className="text-[10px] text-stone-500">{notif.bookingId}</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {notif.message}
                </p>
                <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-stone-500">
                  <span>{formatTime(notif.sentAt)}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}