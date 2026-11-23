import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';
import { getNextStage, renderNotificationMessage } from '@/lib/workflow';

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { expectedCurrentStatus, note = '', videoUrl = '' } = body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (expectedCurrentStatus && booking.status !== expectedCurrentStatus) {
      return NextResponse.json(
        {
          error: `Booking status already changed to "${booking.status}". Please refresh.`,
        },
        { status: 409 }
      );
    }

    const nextStage = getNextStage(booking.status);
    if (!nextStage) {
      return NextResponse.json(
        { error: 'Booking has already reached the final stage (Video Available).' },
        { status: 400 }
      );
    }

    const resolvedVideoUrl =
      nextStage === 'Video Available'
        ? videoUrl.trim() ||
          `https://cdn.aaradhyasetu.com/videos/${booking.bookingId.toLowerCase()}.mp4`
        : booking.videoUrl;

    const now = new Date();
    booking.status = nextStage;
    if (resolvedVideoUrl) booking.videoUrl = resolvedVideoUrl;
    booking.statusHistory.push({
      status: nextStage,
      updatedAt: now,
      note: note.trim() || `Moved to ${nextStage}`,
    });

    await booking.save();

    const message = renderNotificationMessage(nextStage, {
      devoteeName: booking.devoteeName,
      pujaName: booking.pujaName,
      bookingId: booking.bookingId,
      templeName: booking.templeName,
      panditName: booking.panditName,
      videoUrl: booking.videoUrl,
    });

    const notification = await Notification.create({
      bookingRef: booking._id,
      bookingId: booking.bookingId,
      devoteeName: booking.devoteeName,
      recipientPhone: booking.phone,
      pujaName: booking.pujaName,
      stage: nextStage,
      channel: 'WhatsApp (Mock)',
      message,
      deliveryStatus: 'DELIVERED',
      sentAt: now,
    });

    return NextResponse.json({ booking, notification });
  } catch (error) {
    console.error('PATCH /api/bookings/[id]/advance error:', error);
    return NextResponse.json({ error: 'Failed to advance booking workflow' }, { status: 500 });
  }
}