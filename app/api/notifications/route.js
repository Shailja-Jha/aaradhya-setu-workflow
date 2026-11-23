import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { WORKFLOW_STAGES } from '@/lib/workflow';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId')?.trim();
    const stage = searchParams.get('stage');
    const search = searchParams.get('search')?.trim();

    const filter = {};
    if (bookingId) filter.bookingId = bookingId;
    if (stage && stage !== 'ALL' && WORKFLOW_STAGES.includes(stage)) {
      filter.stage = stage;
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { bookingId: regex },
        { devoteeName: regex },
        { pujaName: regex },
        { message: regex },
      ];
    }

    const notifications = await Notification.find(filter)
      .sort({ sentAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}