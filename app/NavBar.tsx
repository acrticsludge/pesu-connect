"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  name: string;
  srn: string;
} | null;

export default function NavBar() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <header
      className="
        sticky top-0 z-50
        w-full
        bg-black/30
        backdrop-blur-xl
        shadow-[0_8px_24px_-10px_rgba(168,85,247,0.45)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute inset-x-0 bottom-0 h-px
          bg-linear-to-r from-transparent via-purple-500/70 to-transparent
        "
      />

      <div
        className="
          relative
          mx-auto
          flex
          h-14 sm:h-16
          max-w-6xl
          items-center
          justify-between
          px-3 sm:px-6
        "
      >
        <div className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="PES Logo"
            width={160}
            height={40}
            priority
            className="
              h-7 sm:h-9
              w-auto
              object-contain
              drop-shadow-[0_0_10px_rgba(168,85,247,0.55)]
            "
          />
        </div>

        <div
          className="
            absolute left-1/2 -translate-x-1/2
            text-sm sm:text-lg
            font-semibold
            tracking-wide
            text-white
            whitespace-nowrap
          "
        >
          <Link href="/" className="hover:text-purple-300 transition">
            PES Events
          </Link>
        </div>

        <div className="flex items-center shrink-0">
          {loading ? null : user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="
                rounded-full
                px-3 sm:px-5
                py-1.5 sm:py-2
                text-xs sm:text-sm
                font-semibold
                text-white
                bg-purple-600/90
                shadow-[0_0_20px_rgba(168,85,247,0.45)]
                hover:bg-purple-500
                hover:shadow-[0_0_28px_rgba(168,85,247,0.7)]
                transition-all
                cursor-pointer
              "
            >
              Welcome,&nbsp;
              <span className="text-purple-200">{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <Link href="/login">
              <button
                className="
                  rounded-full
                  px-3 sm:px-5
                  py-1.5 sm:py-2
                  text-xs sm:text-sm
                  font-semibold
                  text-white
                  bg-purple-600/90
                  shadow-[0_0_20px_rgba(168,85,247,0.45)]
                  hover:bg-purple-500
                  hover:shadow-[0_0_28px_rgba(168,85,247,0.7)]
                  transition-all
                  cursor-pointer
                "
              >
                Sign in
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
