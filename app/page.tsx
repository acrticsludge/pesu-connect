import Image from "next/image";

export default function Home() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-12 sm:pt-16 px-4 text-center">
        <span className="px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#CCFF00] text-sm font-mono font-medium mb-4">
          PES University Events Portal
        </span>

        <div className="flex flex-col items-center">
          <div className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
            Discover Campus
          </div>
          <div className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#7C3AED] leading-tight mb-6">
            Events &amp; Activities
          </div>
        </div>

        <p className="text-base sm:text-lg text-[#A3A3A3] max-w-3xl mx-auto mb-10 text-center">
          Stay updated with all college events, club activities, and
          competitions in one place. Never miss out on what&apos;s happening at
          PES.
        </p>

        <button
          data-testid="manage-events-btn"
          className="px-8 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-base sm:text-lg
        hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]
        transition-shadow"
        >
          Explore
        </button>
      </div>
    </div>
  );
}
