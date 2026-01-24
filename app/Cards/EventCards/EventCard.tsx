import Image from "next/image";
import { Event } from "@/lib/types/event";

const TAG_COLORS = {
  technical: "bg-blue-500/15 text-blue-300 border border-blue-400/30",
  cultural: "bg-pink-500/15 text-pink-300 border border-pink-400/30",
  sports: "bg-green-500/15 text-green-300 border border-green-400/30",
};

const getDaysLeft = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function EventCard({ event }: { event: Event }) {
  const daysLeft = getDaysLeft(event.registrationDeadline);

  return (
    <div
      className="
        group relative rounded-2xl
        bg-white/10 backdrop-blur-xl
        border border-white/10
        shadow-[0_8px_30px_rgba(0,0,0,0.25)]
        transition-all duration-500
        md:hover:-translate-y-1
        md:hover:shadow-[0_25px_60px_rgba(124,58,237,0.4)]
      "
    >
      <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/25 via-pink-500/10 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden rounded-t-2xl">
        <Image
          src={event.bannerImage.url}
          alt={event.bannerImage.alt}
          fill
          className="object-cover md:group-hover:scale-110 transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-black/35" />

        {event.isPinned && (
          <span className="absolute top-3 left-3 bg-purple-600/90 backdrop-blur text-white text-xs px-3 py-1 rounded-full shadow">
            📌 Pinned
          </span>
        )}

        {daysLeft <= 2 && daysLeft >= 0 && (
          <span className="absolute top-3 right-3 bg-red-500/90 backdrop-blur text-white text-xs px-3 py-1 rounded-full shadow animate-pulse">
            Closing Soon
          </span>
        )}
      </div>

      <div className="relative p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2 py-1 rounded-full ${TAG_COLORS[tag]}`}
            >
              {tag}
            </span>
          ))}

          <span className="ml-auto text-xs text-white/60">
            {event.campus.code}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          {event.title}
        </h3>

        <p className="text-sm text-white/70 line-clamp-2">
          {event.shortDescription}
        </p>

        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-purple-300 font-medium">
            Register by{" "}
            {new Date(event.registrationDeadline).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>

          {daysLeft >= 0 && (
            <span
              className={`font-medium ${
                daysLeft <= 2
                  ? "text-red-400"
                  : daysLeft <= 5
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}
            >
              {daysLeft}d left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
