"use client";
import Image from "next/image";
import { useRef } from "react";

export default function Home() {
  const upcomingRef = useRef<HTMLDivElement>(null);

  const scrollToUpcoming = () => {
    upcomingRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-12 sm:pt-16 px-4 text-center pb-24">
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
          onClick={scrollToUpcoming}
          className="px-8 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-base sm:text-lg
    hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]
    transition-shadow cursor-pointer"
        >
          Explore
        </button>
      </div>
      <div ref={upcomingRef} className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 sm:mb-12 text-center sm:text-left">
            <h2
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Upcoming Events
            </h2>

            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
              <button
                data-testid="filter-all-btn"
                className="px-4 py-2 rounded-full text-sm font-medium
            bg-[#7C3AED] text-white transition-all"
              >
                All Events
              </button>

              <button
                data-testid="filter-technical-btn"
                className="px-4 py-2 rounded-full text-sm font-medium
            bg-[#0A0A0A] border border-white/10 text-[#A3A3A3]
            hover:bg-white/5 transition-all"
              >
                Technical
              </button>

              <button
                data-testid="filter-cultural-btn"
                className="px-4 py-2 rounded-full text-sm font-medium
            bg-[#0A0A0A] border border-white/10 text-[#A3A3A3]
            hover:bg-white/5 transition-all"
              >
                Cultural
              </button>

              <button
                data-testid="filter-sports-btn"
                className="px-4 py-2 rounded-full text-sm font-medium
            bg-[#0A0A0A] border border-white/10 text-[#A3A3A3]
            hover:bg-white/5 transition-all"
              >
                Sports
              </button>
            </div>
          </div>

          <div className="text-center py-16 sm:py-20">
            <p className="text-base sm:text-xl text-[#A3A3A3]">
              No events found in this category.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
