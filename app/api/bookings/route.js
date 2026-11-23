import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';
import { WORKFLOW_STAGES, renderNotificationMessage } from '@/lib/workflow';

function generateBookingId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AS-${year}-${rand}`;
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const filter = {};
    if (status && status !== 'ALL' && WORKFLOW_STAGES.includes(status)) {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { bookingId: regex },
        { devoteeName: regex },
        { pujaName: regex },
        { templeName: regex },
      ];
    }

    const [bookings, rawCounts] = await Promise.all([
      Booking.find(filter).sort({ updatedAt: -1 }).lean(),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const counts = WORKFLOW_STAGES.reduce((acc, stage) => {
      acc[stage] = 0;
      return acc;
    }, {});

    for (const row of rawCounts) {
      if (row._id in counts) counts[row._id] = row.count;
    }

    return NextResponse.json({ bookings, counts });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      devoteeName,
      phone,
      pujaName,
      templeName = 'Kashi Vishwanath Dham',
      panditName = 'Pandit Ramesh Shastri',
      scheduledDate,
      amount = 1100,
    } = body;

    if (!devoteeName?.trim() || !phone?.trim() || !pujaName?.trim()) {
      return NextResponse.json(
        { error: 'Devotee name, phone, and Puja name are required.' },
        { status: 400 }
      );
    }

    let bookingId = generateBookingId();
    while (await Booking.exists({ bookingId })) {
      bookingId = generateBookingId();
    }

    const initialStage = 'Booking Confirmed';
    const now = new Date();

    const booking = await Booking.create({
      bookingId,
      devoteeName: devoteeName.trim(),
      phone: phone.trim(),
      pujaName: pujaName.trim(),
      templeName: templeName.trim(),
      panditName: panditName.trim(),
      scheduledDate: scheduledDate || now.toISOString().split('T')[0],
      amount: Number(amount) || 0,
      status: initialStage,
      statusHistory: [
        {
          status: initialStage,
          updatedAt: now,
          note: 'Booking created and confirmed via Admin Dashboard',
        },
      ],
    });

    const message = renderNotificationMessage(initialStage, {
      devoteeName: booking.devoteeName,
      pujaName: booking.pujaName,
      bookingId: booking.bookingId,
      templeName: booking.templeName,
      panditName: booking.panditName,
    });

    const notification = await Notification.create({
      bookingRef: booking._id,
      bookingId: booking.bookingId,
      devoteeName: booking.devoteeName,
      recipientPhone: booking.phone,
      pujaName: booking.pujaName,
      stage: initialStage,
      channel: 'WhatsApp (Mock)',
      message,
      deliveryStatus: 'DELIVERED',
      sentAt: now,
    });

    return NextResponse.json({ booking, notification }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}