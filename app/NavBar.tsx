import Image from "next/image";
export default function NavBar() {
  return (
    <div
      className="relative flex justify-center
    px-4 sm:px-6
    py-2.5 sm:py-3
    bg-black/30 backdrop-blur-xl
    shadow-[0_8px_24px_-10px_rgba(168,85,247,0.45)]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px
      bg-linear-to-r from-transparent via-purple-500/70 to-transparent"
      />

      <div className="flex items-center justify-between w-full max-w-6xl">
        <Image
          src="/logo.png"
          alt="PES Logo"
          width={160}
          height={40}
          priority
          className="h-8 sm:h-10 w-auto object-contain
        drop-shadow-[0_0_10px_rgba(168,85,247,0.55)]"
        />

        <div
          className="absolute left-1/2 -translate-x-1/2
        text-base sm:text-xl
        font-semibold tracking-wide
        text-purple-300
        drop-shadow-[0_0_8px_rgba(168,85,247,0.45)]
        cursor-pointer"
        >
          PES Events
        </div>

        <button
          className="rounded-full
        px-4 sm:px-6
        py-2 sm:py-2.5
        text-xs sm:text-sm
        font-semibold
        text-white
        bg-purple-600/90
        shadow-[0_0_20px_rgba(168,85,247,0.45)]
        hover:bg-purple-500
        hover:shadow-[0_0_28px_rgba(168,85,247,0.7)]
        transition-all duration-200"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
