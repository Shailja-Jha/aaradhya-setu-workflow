import mongoose from 'mongoose';
import { WORKFLOW_STAGES } from '@/lib/workflow';

const NotificationSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    bookingId: { type: String, required: true, index: true },
    devoteeName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    pujaName: { type: String, required: true },
    stage: { type: String, enum: WORKFLOW_STAGES, required: true, index: true },
    channel: { type: String, default: 'WhatsApp (Mock)' },
    message: { type: String, required: true },
    
    deliveryStatus: {
      type: String,
      enum: ['DELIVERED', 'FAILED'],
      default: 'DELIVERED',
    },
    providerMessageId: { type: String, default: null },
    errorMessage: { type: String, default: '' },
    
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema);

  