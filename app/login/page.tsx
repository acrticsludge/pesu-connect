"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [srn, setSrn] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const toastID = toast.loading("Logging in...");
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srn, password }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
      toast.error(data.error || "Login failed", { id: toastID });
    }
    toast.success("Logged in successfully!", { id: toastID });
    setLoading(false);
  }

  return (
    <div
      className="
        min-h-[calc(100svh-6rem)]
        flex
        items-center
        justify-center
        px-4
        py-6
      "
    >
      <div
        className="
          w-full
          max-w-md
          border
          border-white/10
          rounded-lg
          p-5
          sm:p-6
          bg-[#0A0A0A]/50
          backdrop-blur-sm
        "
      >
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
              onChange={(e) => setSrn(e.target.value)}
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="
                w-full
                px-4
                py-3
                text-base
                bg-[#0A0A0A]
                border
                border-white/10
                rounded-lg
                text-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#7C3AED]
              "
              placeholder="Enter your SRN"
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
              autoComplete="current-password"
              enterKeyHint="done"
              className="
                w-full
                px-4
                py-3
                text-base
                bg-[#0A0A0A]
                border
                border-white/10
                rounded-lg
                text-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#7C3AED]
              "
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              px-8
              py-3
              bg-[#7C3AED]
              text-white
              rounded-lg
              font-bold
              hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]
              disabled:opacity-60
              transition
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#A3A3A3]">
            Your password is not saved on the server side.
          </p>
        </div>
      </div>
    </div>
  );
}
