import Image from "next/image";
import { Club } from "@/lib/types/club";
import { useMemo } from "react";

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

export default function ClubCard({
  club,
  query = "",
}: {
  club: Club;
  query?: string;
}) {
  const foundedYear = useMemo(
    () => new Date(club.foundedOn).getFullYear(),
    [club.foundedOn],
  );

  const bannerSrc = useMemo(
    () => club.banner?.url || "/placeholder-banner.png",
    [club.banner?.url],
  );

  const bannerAlt = useMemo(
    () => club.banner?.alt || club.name,
    [club.banner?.alt, club.name],
  );

  const displayedDomains = useMemo(
    () => club.domains?.slice(0, 4) || [],
    [club.domains],
  );

  const remainingDomains = useMemo(
    () => (club.domains?.length > 4 ? club.domains.length - 4 : 0),
    [club.domains],
  );

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
      <div className="hidden md:block absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/25 via-pink-500/10 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative h-28 sm:h-32 md:h-36 w-full overflow-hidden rounded-t-2xl shrink-0">
        <Image
          src={bannerSrc}
          alt={bannerAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className="object-cover md:transition-transform md:duration-300 md:group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40" />

        {club.isRecruiting && club.recruitingLink && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(club.recruitingLink, "_blank", "noopener,noreferrer");
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 active:scale-95 transition-transform"
            aria-label="Recruiting now"
          >
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" />
              <span className="relative px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur whitespace-nowrap">
                Recruiting
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-2">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white leading-snug line-clamp-2">
            {highlight(club.name, query)}
          </h3>

          <span className="text-[10px] sm:text-xs text-[#A3A3A3] shrink-0 mt-0.5 sm:mt-0">
            Est. {foundedYear}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#A3A3A3] mb-3 sm:mb-4 line-clamp-2 flex-1">
          {club.shortDescription
            ? highlight(club.shortDescription, query)
            : "No description available"}
        </p>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto">
          {displayedDomains.map((domain) => (
            <span
              key={domain.name}
              className="
                px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs
                bg-[#7C3AED]/20 border border-[#7C3AED]/30
                text-[#E9D5FF]
                whitespace-nowrap
              "
            >
              {highlight(domain.name, query)}
            </span>
          ))}

          {remainingDomains > 0 && (
            <span className="text-[10px] sm:text-xs text-[#A3A3A3]">
              +{remainingDomains} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
