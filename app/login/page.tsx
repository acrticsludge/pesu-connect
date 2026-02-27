"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/hooks/useUser";

export default function LoginPage() {
  const [srn, setSrn] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && user) {
      router.push("/");
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Logging in...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ srn: srn.toUpperCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      await queryClient.invalidateQueries({ queryKey: ["user"] });

      toast.success("Logged in successfully!", { id: toastId });
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md border border-white/10 rounded-lg p-5 sm:p-6 bg-[#0A0A0A]/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Login
          </h1>
          <p className="text-[#A3A3A3] text-sm">
            Enter your SRN and password to access PESU Connect
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="srn"
              className="block text-sm font-medium text-white mb-2"
            >
              SRN
            </label>
            <input
              id="srn"
              type="text"
              required
              value={srn}
              onChange={(e) => setSrn(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-base bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] disabled:opacity-50"
              placeholder="Enter your SRN"
              disabled={isLoading}
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-base bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] disabled:opacity-50"
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-3 bg-[#7C3AED] text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-60 disabled:hover:shadow-none transition active:scale-[0.98]"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-[#A3A3A3]">
            Credentials are securely authenticated by{" "}
            <a
              href="https://github.com/pesu-dev/auth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7C3AED] hover:underline"
            >
              PESU Auth
            </a>
            . We only store your Name, SRN, and email. Your password is never stored on our servers.
            </p>
        </div>
      </div>
    </div>
  );
}
