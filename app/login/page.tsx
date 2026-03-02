"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/hooks/useUser";

export default function LoginPage() {
  const [srn, setSrn] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [srnError, setSrnError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && user) {
      router.push("/");
    }
  }, [user, userLoading, router]);

  const validateInputs = () => {
    let isValid = true;
    setSrnError("");
    setPasswordError("");

    if (!srn.trim()) {
      setSrnError("SRN is required");
      isValid = false;
    } else if (srn.length < 3) {
      setSrnError("Invalid SRN format");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 1) {
      setPasswordError("Invalid password");
      isValid = false;
    }

    return isValid;
  };

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

    if (!validateInputs()) {
      return;
    }

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
        if (res.status === 429) {
          throw new Error(
            "Too many login attempts. Please try again in an hour.",
          );
        }
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
              onChange={(e) => {
                setSrn(e.target.value.toUpperCase());
                setSrnError("");
              }}
              className={`w-full px-4 py-3 text-base bg-[#0A0A0A] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] disabled:opacity-50 transition ${
                srnError
                  ? "border-red-500/50 focus:ring-red-500"
                  : "border-white/10"
              }`}
              placeholder="Enter your SRN"
              disabled={isLoading}
              autoCapitalize="characters"
              autoCorrect="off"
              aria-label="SRN"
              aria-describedby={srnError ? "srn-error" : undefined}
            />
            {srnError && (
              <p id="srn-error" className="text-xs text-red-400 mt-1.5">
                {srnError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className={`w-full px-4 py-3 text-base bg-[#0A0A0A] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] disabled:opacity-50 transition pr-12 ${
                  passwordError
                    ? "border-red-500/50 focus:ring-red-500"
                    : "border-white/10"
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                aria-label="Password"
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="text-xs text-red-400 mt-1.5">
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-3 bg-[#7C3AED] text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-60 disabled:hover:shadow-none transition active:scale-[0.98] disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
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
            . We only store your Name, SRN, and email. Your password is never
            stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
