import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';
import { WORKFLOW_STAGES, renderNotificationMessage } from '@/lib/workflow';

const SAMPLE_BOOKINGS = [
  {
    bookingId: 'AS-2026-1001',
    devoteeName: 'Ananya Sharma',
    phone: '+91 98301 44210',
    pujaName: 'Rudrabhishek Puja',
    templeName: 'Kashi Vishwanath Dham',
    panditName: 'Pandit Ramesh Shastri',
    scheduledDate: '2026-11-24',
    amount: 2100,
    targetStageIndex: 0,
  },
  {
    bookingId: 'AS-2026-1002',
    devoteeName: 'Rajeshwari Verma',
    phone: '+91 98112 77890',
    pujaName: 'Mahamrityunjaya Jaap',
    templeName: 'Mahakaleshwar Temple, Ujjain',
    panditName: 'Acharya Devendra Tiwari',
    scheduledDate: '2026-11-23',
    amount: 5100,
    targetStageIndex: 1,
  },
  {
    bookingId: 'AS-2026-1003',
    devoteeName: 'Vikramaditya Nair',
    phone: '+91 98450 31902',
    pujaName: 'Satyanarayan Katha & Chadhava',
    templeName: 'Badrinath Dham',
    panditName: 'Pandit Mahesh Joshi',
    scheduledDate: '2026-11-23',
    amount: 1500,
    targetStageIndex: 2,
  },
  {
    bookingId: 'AS-2026-1004',
    devoteeName: 'Meera Deshmukh',
    phone: '+91 97654 11823',
    pujaName: 'Navagraha Shanti Puja',
    templeName: 'Trimbakeshwar Jyotirlinga',
    panditName: 'Pandit Suresh Kulkarni',
    scheduledDate: '2026-11-22',
    amount: 3100,
    targetStageIndex: 3,
  },
  {
    bookingId: 'AS-2026-1005',
    devoteeName: 'Siddharth Banerjee',
    phone: '+91 98310 66541',
    pujaName: 'Maa Kali Sankalp Puja',
    templeName: 'Kalighat Shakti Peeth, Kolkata',
    panditName: 'Pandit Subhash Chatterjee',
    scheduledDate: '2026-11-24',
    amount: 1100,
    targetStageIndex: 0,
  },
];

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const forceReset = Boolean(body.reset);

    const existingCount = await Booking.countDocuments();
    if (existingCount > 0 && !forceReset) {
      return NextResponse.json({
        message: 'Database already has bookings. Pass { reset: true } to re-seed.',
        skipped: true,
      });
    }

    await Promise.all([Booking.deleteMany({}), Notification.deleteMany({})]);

    let bookingsCreated = 0;
    let notificationsCreated = 0;

    for (const item of SAMPLE_BOOKINGS) {
      const stagesToBuild = WORKFLOW_STAGES.slice(0, item.targetStageIndex + 1);
      const baseTime = Date.now() - (item.targetStageIndex + 2) * 60 * 60 * 1000;

      const videoUrl =
        item.targetStageIndex === 3
          ? `https://cdn.aaradhyasetu.com/videos/${item.bookingId.toLowerCase()}.mp4`
          : '';

      const statusHistory = stagesToBuild.map((stage, idx) => ({
        status: stage,
        updatedAt: new Date(baseTime + idx * 45 * 60 * 1000),
        note: idx === 0 ? 'Booking confirmed online' : `Progressed to ${stage}`,
      }));

      const booking = await Booking.create({
        bookingId: item.bookingId,
        devoteeName: item.devoteeName,
        phone: item.phone,
        pujaName: item.pujaName,
        templeName: item.templeName,
        panditName: item.panditName,
        scheduledDate: item.scheduledDate,
        amount: item.amount,
        status: stagesToBuild[stagesToBuild.length - 1],
        videoUrl,
        statusHistory,
      });
      bookingsCreated += 1;

      const notificationsToInsert = stagesToBuild.map((stage, idx) => ({
        bookingRef: booking._id,
        bookingId: booking.bookingId,
        devoteeName: booking.devoteeName,
        recipientPhone: booking.phone,
        pujaName: booking.pujaName,
        stage,
        channel: 'WhatsApp (Mock)',
        message: renderNotificationMessage(stage, {
          devoteeName: booking.devoteeName,
          pujaName: booking.pujaName,
          bookingId: booking.bookingId,
          templeName: booking.templeName,
          panditName: booking.panditName,
          videoUrl,
        }),
        deliveryStatus: 'DELIVERED',
        sentAt: new Date(baseTime + idx * 45 * 60 * 1000),
      }));

      await Notification.insertMany(notificationsToInsert);
      notificationsCreated += notificationsToInsert.length;
    }

    return NextResponse.json({
      message: 'Sample Puja bookings and WhatsApp logs seeded successfully.',
      bookingsCreated,
      notificationsCreated,
    });
  } catch (error) {
    console.error('POST /api/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}