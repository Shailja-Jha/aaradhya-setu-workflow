'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

const INITIAL_FORM = {
  devoteeName: '',
  phone: '+91 ',
  pujaName: 'Rudrabhishek Puja',
  templeName: 'Kashi Vishwanath Dham',
  panditName: 'Pandit Ramesh Shastri',
  scheduledDate: new Date().toISOString().split('T')[0],
  amount: '2100',
};

export default function NewBookingModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create booking');

      setForm(INITIAL_FORM);
      onCreated(data.booking, data.notification);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-orange-100 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-orange-50/60">
          <div>
            <h2 className="text-base font-bold text-stone-900">Create Puja Booking</h2>
            <p className="text-xs text-stone-500">
              Automatically triggers a &ldquo;Booking Confirmed&rdquo; WhatsApp notification.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Devotee Name *
              </label>
              <input
                required
                value={form.devoteeName}
                onChange={(e) => setForm({ ...form, devoteeName: e.target.value })}
                placeholder="e.g., Priya Kulkarni"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Puja Name *
              </label>
              <input
                required
                value={form.pujaName}
                onChange={(e) => setForm({ ...form, pujaName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Temple Name
              </label>
              <input
                value={form.templeName}
                onChange={(e) => setForm({ ...form, templeName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Assigned Pandit
              </label>
              <input
                value={form.panditName}
                onChange={(e) => setForm({ ...form, panditName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Puja Date
              </label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Dakshina (INR)
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create & Notify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}