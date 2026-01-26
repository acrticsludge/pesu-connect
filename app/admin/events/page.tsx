import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Event from "@/lib/models/Event";
import Link from "next/link";

export default async function AdminEventsPage() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) redirect("/login");

  const user = verifyToken(token);
  if (!user || user.role !== "admin") redirect("/dashboard");

  await connectDB();

  const events = await Event.find()
    .sort({ isPinned: -1, eventDate: -1 })
    .lean();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <section className="rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-6">
        <h1 className="text-xl font-semibold text-white mb-6">Manage Events</h1>

        {events.length === 0 ? (
          <p className="text-[#A3A3A3]">No events found.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((e: any) => (
              <li
                key={e._id.toString()}
                className="border border-white/10 rounded-lg p-4 bg-[#0A0A0A] text-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">
                      {e.title}
                      {e.isPinned && (
                        <span className="ml-2 text-xs text-purple-400">
                          📌 Pinned
                        </span>
                      )}
                    </p>

                    <p className="text-sm text-[#A3A3A3]">
                      {e.club?.name} • {new Date(e.eventDate).toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href={`/admin/events/${e._id.toString()}`}
                    className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow cursor-pointer text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
