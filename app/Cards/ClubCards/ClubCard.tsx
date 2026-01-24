import Image from "next/image";
import { Club } from "@/lib/types/club";

export default function ClubCard({ club }: { club: Club }) {
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
      <div className="relative h-36 sm:h-40 w-full">
        <Image
          src={club.banner?.url || "/placeholder-banner.png"}
          alt={club.banner?.alt || club.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {club.name}
          </h3>
          <span className="text-xs text-[#A3A3A3]">
            Est. {new Date(club.foundedOn).getFullYear()}
          </span>
        </div>

        <p className="text-sm text-[#A3A3A3] mb-4 line-clamp-2">
          {club.shortDescription}
        </p>

        <div className="flex flex-wrap gap-2">
          {club.domains.slice(0, 4).map((domain) => (
            <span
              key={domain.name}
              className="px-3 py-1 rounded-full text-xs bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#E9D5FF]"
            >
              {domain.name}
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
