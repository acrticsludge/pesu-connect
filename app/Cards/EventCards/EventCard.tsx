import Image from "next/image";
import { BaseEventData } from "@/lib/types/event";
import { useMemo } from "react";

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
  DEFAULT: "bg-gray-600/20 text-gray-200",
};

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function highlight(text: string, query: string) {
  if (!query?.trim()) return text;

  const words = query.toLowerCase().split(" ").filter(Boolean).map(escapeRegex);
  const regex = new RegExp(`(${words.join("|")})`, "gi");

  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-purple-500/30 text-purple-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const isValidImageUrl = (url?: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function EventCard({
  event,
  query = "",
}: {
  event: BaseEventData;
  query?: string;
}) {
  const reg = event.registration;

  const regStatus = useMemo(() => {
    if (!reg?.isRegister) return null;

    const now = Date.now();
    const endDate = new Date(event.endDate).getTime();
    const isPast = endDate < now;

    const regDeadline = reg?.deadline ? new Date(reg.deadline).getTime() : null;
    const isRegClosed = regDeadline ? regDeadline < now : false;
    const daysLeft = regDeadline
      ? Math.ceil((regDeadline - now) / (1000 * 60 * 60 * 24))
      : null;

    if (isPast) {
      return {
        label: "Event Ended",
        color: "bg-red-500/20 text-red-300 border border-red-500/30",
        pulse: false,
      };
    }

    if (isRegClosed) {
      return {
        label: "Registration Closed",
        color: "bg-red-500/20 text-red-300 border border-red-500/30",
        pulse: false,
      };
    }

    if (daysLeft !== null && daysLeft <= 2) {
      return {
        label: "Closing Soon",
        color: "bg-red-500/20 text-red-300 border border-red-500/30",
        pulse: true,
      };
    }

    if (regDeadline || reg?.link) {
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
  }, [reg, event.endDate]);

  const imageSrc = useMemo(
    () =>
      isValidImageUrl(event.bannerUrl)
        ? event.bannerUrl
        : "/images/event-placeholder.png",
    [event.bannerUrl],
  );

  const regDeadlineText = useMemo(
    () =>
      event.registration?.deadline
        ? new Date(event.registration.deadline).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })
        : null,
    [event.registration?.deadline],
  );

  const daysLeft = useMemo(() => {
    if (!reg?.deadline) return null;
    const now = Date.now();
    const deadline = new Date(reg.deadline).getTime();
    if (deadline < now) return null;
    return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  }, [reg?.deadline]);

  const now = Date.now();
  const endDate = new Date(event.endDate).getTime();
  const isPast = endDate < now;
  const isRegClosed = reg?.deadline
    ? new Date(reg.deadline).getTime() < now
    : false;

  return (
    <div
      className="
        relative rounded-2xl
        bg-white/10 backdrop-blur-xl
        border border-white/10
        shadow-[0_8px_30px_rgba(0,0,0,0.25)]
        transition-all duration-300
        active:scale-[0.98]
        md:hover:-translate-y-1
        md:hover:shadow-[0_25px_60px_rgba(124,58,237,0.4)]
        h-full flex flex-col
      "
    >
      <div className="relative h-32 sm:h-36 md:h-40 w-full overflow-hidden rounded-t-2xl shrink-0">
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className="object-cover md:group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex flex-col gap-1.5 sm:gap-2 items-end">
          {regStatus && (
            <span className="relative inline-flex">
              {regStatus.pulse && (
                <span className="absolute inset-0 rounded-full bg-red-400/40 animate-ping" />
              )}
              <span
                className={`relative px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur whitespace-nowrap ${regStatus.color}`}
              >
                {regStatus.label}
              </span>
            </span>
          )}
        </div>

        {event.isPinned && !isPast && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-purple-600/90 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow">
            📌 Pinned
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
        <div className="flex gap-1.5 sm:gap-2 flex-wrap items-start">
          {event.categories?.map((cat) => (
            <span
              key={cat}
              className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.DEFAULT}`}
            >
              {cat}
            </span>
          ))}

          <span className="ml-auto text-[10px] sm:text-xs text-white/60 shrink-0">
            {event.campus}
          </span>
        </div>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {event.tags?.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${TAG_COLORS[tag]}`}
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white leading-tight line-clamp-2">
          {query ? highlight(event.name, query) : event.name}
        </h3>

        <p className="text-xs sm:text-sm text-white/70 line-clamp-2 flex-1">
          {query
            ? highlight(event.shortDescription || "", query)
            : event.shortDescription}
        </p>

        {daysLeft !== null && daysLeft >= 0 && !isPast && !isRegClosed && (
          <div className="flex justify-between items-center pt-1 sm:pt-2 text-[10px] sm:text-xs border-t border-white/10 mt-auto">
            {regDeadlineText && (
              <span className="text-purple-300 font-medium truncate max-w-[60%]">
                Register by {regDeadlineText}
              </span>
            )}

            <span
              className={`font-medium shrink-0 ${
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
