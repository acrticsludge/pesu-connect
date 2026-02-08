import Image from "next/image";
import { BaseEventData } from "@/lib/types/event";

const TAG_COLORS: Record<string, string> = {
  WORKSHOP: "bg-blue-500/15 text-blue-300 border border-blue-400/30",
  HACKATHON: "bg-purple-500/15 text-purple-300 border border-purple-400/30",
  SEMINAR: "bg-yellow-500/15 text-yellow-300 border border-yellow-400/30",
  COMPETITION: "bg-red-500/15 text-red-300 border border-red-400/30",
  MEETUP: "bg-green-500/15 text-green-300 border border-green-400/30",
  OTHER: "bg-white/10 text-white/70 border border-white/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  TECHNICAL: "bg-blue-600/20 text-blue-200",
  CULTURAL: "bg-pink-600/20 text-pink-200",
  SPORTS: "bg-green-600/20 text-green-200",
};

const getDaysLeft = (deadline?: Date) => {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const isValidImageUrl = (url?: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getRegistrationStatus = (registration: {
  isRegister: boolean;
  deadline?: Date;
  link?: string;
}) => {
  if (!registration.isRegister) return null;

  if (registration.deadline) {
    const isClosed = new Date(registration.deadline).getTime() < Date.now();

    if (isClosed) {
      return {
        label: "Registration Closed",
        color: "bg-red-500/20 text-red-300 border border-red-500/30",
        pulse: false,
      };
    }

    return {
      label: "Register Now",
      color: "bg-green-500/20 text-green-300 border border-green-500/30",
      pulse: true,
    };
  }

  if (registration.link) {
    return {
      label: "Register Now",
      color: "bg-green-500/20 text-green-300 border border-green-500/30",
      pulse: true,
    };
  }

  return {
    label: "On-spot Registration",
    color: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    pulse: false,
  };
};

export default function EventCard({ event }: { event: BaseEventData }) {
  const daysLeft = getDaysLeft(event.registration?.deadline);
  const imageSrc = isValidImageUrl(event.bannerUrl)
    ? event.bannerUrl
    : "/images/event-placeholder.png";
  const regStatus = getRegistrationStatus(event.registration);

  return (
    <div
      className="
        relative rounded-2xl
        bg-white/10 backdrop-blur-xl
        border border-white/10
        shadow-[0_8px_30px_rgba(0,0,0,0.25)]
        transition-all duration-300
        active:scale-[0.98]
        md:group
        md:hover:-translate-y-1
        md:hover:shadow-[0_25px_60px_rgba(124,58,237,0.4)]
      "
    >
      <div className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden rounded-t-2xl">
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-end">
          {regStatus && (
            <span className="relative inline-flex">
              {regStatus.pulse && (
                <span className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" />
              )}
              <span
                className={`relative px-3 py-1 rounded-full text-xs font-semibold backdrop-blur ${regStatus.color}`}
              >
                {regStatus.label}
              </span>
            </span>
          )}

          {daysLeft !== null && daysLeft <= 2 && daysLeft >= 0 && (
            <span className="bg-red-500/90 text-white text-xs px-3 py-1 rounded-full animate-pulse">
              Closing Soon
            </span>
          )}
        </div>

        {event.isPinned && (
          <span className="absolute top-3 left-3 bg-purple-600/90 text-white text-xs px-3 py-1 rounded-full shadow">
            📌 Pinned
          </span>
        )}

        {daysLeft !== null && daysLeft <= 2 && daysLeft >= 0 && (
          <span className="absolute top-3 right-3 bg-red-500/90 text-white text-xs px-3 py-1 rounded-full animate-pulse">
            Closing Soon
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {event.categories.map((cat) => (
            <span
              key={cat}
              className={`text-xs px-2 py-1 rounded-full font-semibold ${CATEGORY_COLORS[cat]}`}
            >
              {cat}
            </span>
          ))}

          <span className="ml-auto text-xs text-white/60">{event.campus}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2 py-1 rounded-full ${TAG_COLORS[tag]}`}
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white">
          {event.name}
        </h3>

        <p className="text-sm text-white/70 line-clamp-2">
          {event.shortDescription}
        </p>

        {daysLeft !== null && daysLeft >= 0 && (
          <div className="flex justify-between items-center pt-2 text-xs">
            <span className="text-purple-300 font-medium">
              Register by{" "}
              {event.registration.deadline?.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>

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
          </div>
        )}
      </div>
    </div>
  );
}
