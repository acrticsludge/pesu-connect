import EventModel from "@/lib/models/Event";
import { connectDB } from "@/lib/db";
import type { Event } from "@/lib/types/event";

export async function GET() {
  await connectDB();

  const events = await EventModel.find({ isActive: true })
    .sort({ isPinned: -1, registrationDeadline: 1 })
    .lean();

  return Response.json(events as Event[]);
}
