"use client";

import { useRouter } from "next/navigation";

type Event = {
  _id: string;
  title: string;
  description?: string;
  type: "club" | "domain";
  domainName?: string;
  pinned: boolean;
  createdAt?: string;
};

export default function AdminEventsClient({ events }: { events: Event[] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Manage Events</h1>

      {events.length === 0 ? (
        <p className="text-sm text-[#A3A3A3]">No events found.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event._id}
              onClick={() => router.push(`/admin/events/${event._id}`)}
              className="border border-white/10 rounded-lg p-4 bg-[#0A0A0A] cursor-pointer hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow text-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-white">
                    {event.title}
                    {event.pinned && (
                      <span className="ml-2 text-xs text-purple-400">
                        📌 Pinned
                      </span>
                    )}
                  </p>

                  <p className="text-sm text-[#A3A3A3]">
                    {event.type?.toUpperCase() ?? "CLUB"}

                    {event.type === "domain" && ` • ${event.domainName}`}
                  </p>
                </div>

                <span className="text-xs text-[#A3A3A3]">Edit →</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
