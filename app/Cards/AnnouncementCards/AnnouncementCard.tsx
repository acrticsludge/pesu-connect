import { formatDistanceToNow } from "date-fns";

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
      className="w-5 h-5"
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
      className="w-5 h-5"
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
      className="w-5 h-5"
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
      className="w-5 h-5"
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
      className="w-5 h-5"
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
  return (
    <div
      className={`relative p-5 rounded-xl border ${typeStyles[announcement.type]} bg-white/5 backdrop-blur`}
    >
      {announcement.pinned && (
        <div className="absolute -top-2 -right-2">
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            📌 Pinned
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${typeStyles[announcement.type]}`}>
          {typeIcons[announcement.type]}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white">
              {announcement.title}
            </h3>
            {announcement.version && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
                v{announcement.version}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${typeStyles[announcement.type]}`}
            >
              {announcement.type}
            </span>
          </div>

          <div className="mt-3 text-white/80 prose prose-invert max-w-none">
            {announcement.content.split("\n").map((paragraph, i) => (
              <p key={i} className="text-sm sm:text-base">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-white/40">
              Posted by {announcement.createdBy.name} •{" "}
              {formatDistanceToNow(new Date(announcement.createdAt), {
                addSuffix: true,
              })}
            </div>

            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(announcement)}
                  className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs hover:bg-blue-500/30 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(announcement._id)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30 transition"
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
