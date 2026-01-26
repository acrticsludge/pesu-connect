import Image from "next/image";
import { Club } from "@/lib/types/club";

export default function ClubCard({
  club,
  query = "",
}: {
  club: Club;
  query?: string;
}) {
  function highlight(text: string, query: string) {
    if (!query.trim()) return text;

    const words = query.toLowerCase().split(" ").filter(Boolean);
    const regex = new RegExp(`(${words.join("|")})`, "gi");

    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-purple-500/30 text-purple-200 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  }

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
      <div className="hidden md:block absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/25 via-pink-500/10 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative h-32 sm:h-36 md:h-40 w-full">
        <Image
          src={club.banner?.url || "/placeholder-banner.png"}
          alt={club.banner?.alt || club.name}
          fill
          className="object-cover md:transition-transform md:duration-300 md:group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40" />

        {club.isRecruiting && (
          <a
            href={club.recruitingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3"
          >
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" />
              <span className="relative px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur">
                Recruiting
              </span>
            </span>
          </a>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug">
            {highlight(club.name, query)}
          </h3>

          <span className="text-xs text-[#A3A3A3] shrink-0">
            Est. {new Date(club.foundedOn).getFullYear()}
          </span>
        </div>

        <p className="text-sm text-[#A3A3A3] mb-4 line-clamp-2">
          {club.shortDescription
            ? highlight(club.shortDescription, query)
            : null}
        </p>

        <div className="flex flex-wrap gap-2">
          {club.domains.slice(0, 4).map((domain) => (
            <span
              key={domain.name}
              className="
                px-3 py-1 rounded-full text-xs
                bg-[#7C3AED]/20 border border-[#7C3AED]/30
                text-[#E9D5FF]
                whitespace-nowrap
              "
            >
              {highlight(domain.name, query)}
            </span>
          ))}

          {club.domains.length > 4 && (
            <span className="text-xs text-[#A3A3A3]">
              +{club.domains.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
