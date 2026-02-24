"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

export default function NavBar() {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-black/30 backdrop-blur-xl shadow-[0_8px_24px_-10px_rgba(168,85,247,0.45)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-purple-500/70 to-transparent" />

      <div className="relative mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
        <Link href="/" className="group flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="PES Logo"
            width={160}
            height={40}
            priority
            className="h-7 sm:h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_10px_rgba(168,85,247,0.55)] group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
          />
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="relative text-sm sm:text-lg font-semibold tracking-wide text-white hover:text-purple-300 transition-colors"
          >
            PES Events
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-purple-500/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </Link>
        </div>

        <div className="flex items-center shrink-0">
          {isLoading ? (
            <div className="w-16 sm:w-24 h-8 sm:h-10 bg-purple-600/30 rounded-full animate-pulse" />
          ) : user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="group relative rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600/90 shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:bg-purple-500 hover:shadow-[0_0_28px_rgba(168,85,247,0.7)] transition-all cursor-pointer active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">
                Welcome,{" "}
                <span className="text-purple-200">
                  {user.name.split(" ")[0] ?? user.name}
                </span>
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />
            </button>
          ) : (
            <Link href="/login">
              <button className="group relative rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600/90 shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:bg-purple-500 hover:shadow-[0_0_28px_rgba(168,85,247,0.7)] transition-all cursor-pointer active:scale-95 overflow-hidden">
                <span className="relative z-10 flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign in
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
