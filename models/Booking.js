import mongoose from 'mongoose';
import { WORKFLOW_STAGES } from '@/lib/workflow';

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: WORKFLOW_STAGES, required: true },
    updatedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    devoteeName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pujaName: { type: String, required: true, trim: true },
    templeName: { type: String, default: 'Kashi Vishwanath Dham', trim: true },
    panditName: { type: String, default: 'Pandit Ramesh Shastri', trim: true },
    scheduledDate: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: WORKFLOW_STAGES,
      default: 'Booking Confirmed',
      index: true,
    },
    videoUrl: { type: String, default: '' },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);