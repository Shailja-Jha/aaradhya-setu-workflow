'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Video,
} from 'lucide-react';
import {
  WORKFLOW_STAGES,
  getNextStage,
  getStageIndex,
  renderNotificationMessage,
} from '@/lib/workflow';
import WhatsAppThread from './WhatsAppThread';
import NewBookingModal from './NewBookingModal';

const STAGE_STYLES = {
  'Booking Confirmed': 'bg-amber-100 text-amber-800 border-amber-200',
  'Puja Started': 'bg-orange-100 text-orange-800 border-orange-200',
  'Puja Completed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Video Available': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STAGE_ICONS = {
  'Booking Confirmed': Clock,
  'Puja Started': Flame,
  'Puja Completed': CheckCircle2,
  'Video Available': Video,
};

export default function WorkflowDashboard() {
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' | 'history'
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyStageFilter, setHistoryStageFilter] = useState('ALL');

  const [noteInput, setNoteInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const bookingParams = new URLSearchParams();
      if (statusFilter !== 'ALL') bookingParams.set('status', statusFilter);
      if (searchQuery.trim()) bookingParams.set('search', searchQuery.trim());

      const [bRes, nRes] = await Promise.all([
        fetch(`/api/bookings?${bookingParams.toString()}`),
        fetch('/api/notifications'),
      ]);

      const bData = await bRes.json();
      const nData = await nRes.json();

      if (!bRes.ok) throw new Error(bData.error || 'Failed to load bookings');
      if (!nRes.ok) throw new Error(nData.error || 'Failed to load notifications');

      setBookings(bData.bookings || []);
      setCounts(bData.counts || {});
      setNotifications(nData.notifications || []);

      setSelectedId((prev) => {
        if (prev && bData.bookings.some((b) => b._id === prev)) return prev;
        return bData.bookings[0]?._id || null;
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b._id === selectedId) || null,
    [bookings, selectedId]
  );

  const selectedBookingNotifications = useMemo(() => {
    if (!selectedBooking) return [];
    return notifications.filter((n) => n.bookingId === selectedBooking.bookingId);
  }, [notifications, selectedBooking]);

  const filteredHistory = useMemo(() => {
    return notifications.filter((n) => {
      const matchesStage =
        historyStageFilter === 'ALL' || n.stage === historyStageFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        n.bookingId.toLowerCase().includes(q) ||
        n.devoteeName.toLowerCase().includes(q) ||
        n.pujaName.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);
      return matchesStage && matchesQuery;
    });
  }, [notifications, historyStageFilter, searchQuery]);

  const nextStage = selectedBooking ? getNextStage(selectedBooking.status) : null;

  const previewMessage = useMemo(() => {
    if (!selectedBooking || !nextStage) return '';
    return renderNotificationMessage(nextStage, {
      devoteeName: selectedBooking.devoteeName,
      pujaName: selectedBooking.pujaName,
      bookingId: selectedBooking.bookingId,
      templeName: selectedBooking.templeName,
      panditName: selectedBooking.panditName,
      videoUrl:
        videoUrlInput.trim() ||
        `https://cdn.aaradhyasetu.com/videos/${selectedBooking.bookingId.toLowerCase()}.mp4`,
    });
  }, [selectedBooking, nextStage, videoUrlInput]);

  async function handleAdvanceStage() {
    if (!selectedBooking || !nextStage) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/advance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedCurrentStatus: selectedBooking.status,
          note: noteInput,
          videoUrl: videoUrlInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to advance stage');

      setNoteInput('');
      setVideoUrlInput('');
      showToast(
        `Moved ${data.booking.bookingId} → ${data.booking.status} & sent mock WhatsApp.`
      );
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAdvancing(false);
    }
  }

  async function handleSeed(reset = false) {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seeding failed');
      showToast(data.message);
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf5] text-stone-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                Aaradhya Setu · Puja Workflow & Notifications
              </h1>
              <p className="text-xs text-stone-500">
                Admin Operations Console · MongoDB + Mock WhatsApp Automation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSeed(true)}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Resetting...' : 'Reset Demo Data'}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-900 text-white border-emerald-700'
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stage Summary KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {WORKFLOW_STAGES.map((stage) => {
            const Icon = STAGE_ICONS[stage];
            const isActive = statusFilter === stage;
            return (
              <button
                key={stage}
                onClick={() => {
                  setActiveTab('workflow');
                  setStatusFilter(isActive ? 'ALL' : stage);
                }}
                className={`text-left p-4 rounded-2xl border transition ${
                  isActive
                    ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
                    : 'bg-white border-stone-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${STAGE_STYLES[stage]}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-2xl font-bold text-stone-900">
                    {counts[stage] ?? 0}
                  </span>
                </div>
                <p className="text-xs font-semibold text-stone-700">{stage}</p>
              </button>
            );
          })}
        </section>

        {/* Tabs & Search Bar */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex bg-stone-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'workflow'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Workflow Console ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              All Notification Logs ({notifications.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Booking ID, devotee, or Puja..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </section>

        {/* Empty State */}
        {!loading && bookings.length === 0 && activeTab === 'workflow' ? (
          <div className="bg-white rounded-2xl border border-dashed border-orange-300 p-10 text-center space-y-3">
            <p className="text-base font-semibold text-stone-800">No bookings found</p>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              Seed realistic Puja bookings across all 4 workflow stages or create a new
              booking to test automatic WhatsApp notifications.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => handleSeed(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
              >
                Seed Sample Bookings
              </button>
              {statusFilter !== 'ALL' && (
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        ) : activeTab === 'workflow' ? (
          /* Main Two-Column Workflow Console */
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Booking List */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Puja Bookings {statusFilter !== 'ALL' && `· ${statusFilter}`}
                </span>
                {statusFilter !== 'ALL' && (
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className="text-xs text-orange-600 hover:underline font-medium"
                  >
                    Show all
                  </button>
                )}
              </div>

              <div className="divide-y divide-stone-100 max-h-[680px] overflow-y-auto">
                {bookings.map((booking) => {
                  const isSelected = booking._id === selectedId;
                  return (
                    <button
                      key={booking._id}
                      onClick={() => setSelectedId(booking._id)}
                      className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-orange-50/80 border-l-4 border-l-orange-500'
                          : 'hover:bg-stone-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-stone-500">
                          {booking.bookingId}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            STAGE_STYLES[booking.status]
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-stone-900">
                        {booking.devoteeName}
                      </p>
                      <p className="text-xs text-stone-600">
                        {booking.pujaName} · {booking.templeName}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                        <span>{booking.scheduledDate}</span>
                        <span className="font-medium text-stone-600">
                          ₹{booking.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Booking Workflow & Mock WhatsApp */}
            <div className="lg:col-span-7 space-y-5">
              {selectedBooking && (
                <>
                  {/* Booking Details & Workflow Stepper Card */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <span className="text-xs font-mono text-orange-600 font-semibold">
                          {selectedBooking.bookingId}
                        </span>
                        <h2 className="text-xl font-bold text-stone-900">
                          {selectedBooking.pujaName}
                        </h2>
                        <p className="text-sm text-stone-600">
                          Devotee: <span className="font-semibold">{selectedBooking.devoteeName}</span>{' '}
                          ({selectedBooking.phone})
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {selectedBooking.templeName} · {selectedBooking.panditName} · Scheduled{' '}
                          {selectedBooking.scheduledDate}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                          STAGE_STYLES[selectedBooking.status]
                        }`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>

                    {/* 4-Step Visual Progress Bar */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">
                        Workflow Progression
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {WORKFLOW_STAGES.map((stage, index) => {
                          const currentIdx = getStageIndex(selectedBooking.status);
                          const isCompleted = index <= currentIdx;
                          const isCurrent = index === currentIdx;
                          const historyEntry = selectedBooking.statusHistory?.find(
                            (h) => h.status === stage
                          );

                          return (
                            <div
                              key={stage}
                              className={`p-3 rounded-xl border text-left transition ${
                                isCurrent
                                  ? 'bg-orange-50 border-orange-400'
                                  : isCompleted
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : 'bg-stone-50 border-stone-200 opacity-65'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-stone-500">
                                  STEP {index + 1}
                                </span>
                                {isCompleted && (
                                  <CheckCircle2
                                    className={`w-3.5 h-3.5 ${
                                      isCurrent ? 'text-orange-600' : 'text-emerald-600'
                                    }`}
                                  />
                                )}
                              </div>
                              <p className="text-xs font-semibold text-stone-900 leading-snug">
                                {stage}
                              </p>
                              {historyEntry && (
                                <p className="text-[10px] text-stone-500 mt-1">
                                  {new Date(historyEntry.updatedAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Next Stage Action Box */}
                    {nextStage ? (
                      <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-amber-900">
                            Next Transition: {selectedBooking.status} → {nextStage}
                          </p>
                          <span className="text-[11px] text-amber-700 font-medium">
                            Auto-sends WhatsApp message
                          </span>
                        </div>

                        {nextStage === 'Video Available' && (
                          <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">
                              Puja Video Link (optional — auto-generated if blank)
                            </label>
                            <input
                              type="url"
                              value={videoUrlInput}
                              onChange={(e) => setVideoUrlInput(e.target.value)}
                              placeholder={`https://cdn.aaradhyasetu.com/videos/${selectedBooking.bookingId.toLowerCase()}.mp4`}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">
                            Internal Note (optional)
                          </label>
                          <input
                            type="text"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="e.g., Pandit confirmed Sankalp started"
                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div className="rounded-lg bg-white border border-amber-200/80 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">
                            Rendered WhatsApp Preview
                          </p>
                          <p className="text-xs text-stone-700 leading-relaxed">
                            {previewMessage}
                          </p>
                        </div>

                        <button
                          onClick={handleAdvanceStage}
                          disabled={advancing}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {advancing
                            ? 'Updating & Sending...'
                            : `Advance to "${nextStage}" & Send Notification`}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Workflow Complete
                          </p>
                          <p className="text-xs text-emerald-700">
                            All 4 stages finished and the video link has been shared with{' '}
                            {selectedBooking.devoteeName}.
                          </p>
                        </div>
                        {selectedBooking.videoUrl && (
                          <a
                            href={selectedBooking.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-800 underline shrink-0"
                          >
                            Video URL
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Per-Booking Mock WhatsApp History */}
                  <WhatsAppThread
                    notifications={selectedBookingNotifications}
                    devoteeName={selectedBooking.devoteeName}
                    phone={selectedBooking.phone}
                  />
                </>
              )}
            </div>
          </section>
        ) : (
          /* Global Notification History Log Tab */
          <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-stone-900">
                Persisted Notification History ({filteredHistory.length})
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', ...WORKFLOW_STAGES].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setHistoryStageFilter(stage)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                      historyStageFilter === stage
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-200">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Booking</th>
                    <th className="py-3 px-4">Devotee</th>
                    <th className="py-3 px-4">Stage Trigger</th>
                    <th className="py-3 px-4">Generated Message</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-orange-50/30 align-top">
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500">
                        {new Date(item.sentAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-stone-700">
                        {item.bookingId}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-stone-900">{item.devoteeName}</p>
                        <p className="text-[11px] text-stone-500">{item.recipientPhone}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                            STAGE_STYLES[item.stage]
                          }`}
                        >
                          {item.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 max-w-md leading-relaxed">
                        {item.message}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {item.deliveryStatus} · {item.channel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-stone-400">
                        No notification records match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <NewBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={async (newBooking) => {
          showToast(
            `Booking ${newBooking.bookingId} created & confirmation WhatsApp sent.`
          );
          await loadData();
          setSelectedId(newBooking._id);
        }}
      />
    </div>
  );
}