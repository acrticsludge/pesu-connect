import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

interface AnnouncementCardProps {
  announcement: {
    _id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "patch" | "event";
    createdBy: {
      name: string;
    };
    createdAt: string;
    pinned: boolean;
    version?: string;
  };
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (announcement: any) => void;
}

const typeStyles = {
  info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  warning: "bg-yellow-500/20 border-yellow-500/30 text-yellow-300",
  success: "bg-green-500/20 border-green-500/30 text-green-300",
  patch: "bg-purple-500/20 border-purple-500/30 text-purple-300",
  event: "bg-pink-500/20 border-pink-500/30 text-pink-300",
};

const typeIcons = {
  info: (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  success: (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  patch: (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  ),
  event: (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
};

export default function AnnouncementCard({
  announcement,
  isAdmin,
  onDelete,
  onEdit,
}: AnnouncementCardProps) {
  const timeAgo = useMemo(
    () =>
      formatDistanceToNow(new Date(announcement.createdAt), {
        addSuffix: true,
      }),
    [announcement.createdAt],
  );

  const contentParagraphs = useMemo(
    () => announcement.content.split("\n").filter((p) => p.trim()),
    [announcement.content],
  );

  return (
    <div
      className={`
        relative p-4 sm:p-5 pt-6 sm:pt-7 rounded-xl border 
        ${typeStyles[announcement.type]} 
        bg-white/5 backdrop-blur
        transition-all active:scale-[0.99]
        ${announcement.pinned ? "ring-1 ring-yellow-500/50" : ""}
      `}
    >
      {announcement.pinned && (
        <div className="absolute top-8 right-4 sm:right-6 -translate-y-1/2 z-10">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shadow-lg backdrop-blur whitespace-nowrap">
            📌 Pinned
          </span>
        </div>
      )}
      <div className="flex items-start gap-2 sm:gap-3">
        <div
          className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${typeStyles[announcement.type]}`}
        >
          {typeIcons[announcement.type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-white wrap-break-word">
              {announcement.title}
            </h3>
            {announcement.version && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-white/10 text-white/70 whitespace-nowrap">
                v{announcement.version}
              </span>
            )}
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${typeStyles[announcement.type]} whitespace-nowrap`}
            >
              {announcement.type}
            </span>
          </div>

          <div className="mt-2 sm:mt-3 text-white/80 prose prose-invert max-w-none">
            {contentParagraphs.map((paragraph, i) => (
              <p
                key={i}
                className="text-xs sm:text-sm md:text-base mb-2 last:mb-0 wrap-break-word"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="text-[10px] sm:text-xs text-white/40 order-2 sm:order-1">
              Posted by {announcement.createdBy.name} • {timeAgo}
            </div>

            {isAdmin && (
              <div className="flex gap-1.5 sm:gap-2 order-1 sm:order-2">
                <button
                  onClick={() => onEdit?.(announcement)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs hover:bg-blue-500/30 transition active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(announcement._id)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-500/20 text-red-300 text-[10px] sm:text-xs hover:bg-red-500/30 transition active:scale-95"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
