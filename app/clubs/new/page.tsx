/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddClubPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    foundedOn: "",
    bannerUrl: "",
    instagram: "",
    staffName: "",
    staffDepartment: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/");
        } else {
          setUser(data.user);
          setLoading(false);
        }
      });
  }, [router]);

  const submit = async () => {
    if (submitting || !user) return;

    setSubmitting(true);
    setError(null);

    const endpoint =
      user.role === "admin" ? "/api/clubs/create" : "/api/club-requests";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Something went wrong");
      setSubmitting(false);
      return;
    }

    if (user.role === "admin") {
      router.push(`/clubs/${data._id}`);
    } else {
      router.push("/dashboard");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-[#A3A3A3]">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
        Create New Club
      </h1>

      <div className="space-y-4">
        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="Club name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="Short description"
          rows={3}
          value={form.shortDescription}
          onChange={(e) =>
            setForm({ ...form, shortDescription: e.target.value })
          }
        />

        <input
          type="date"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          value={form.foundedOn}
          onChange={(e) => setForm({ ...form, foundedOn: e.target.value })}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="Banner image URL (optional)"
          value={form.bannerUrl}
          onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="Instagram URL (optional)"
          value={form.instagram}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="Staff coordinator name"
          value={form.staffName}
          onChange={(e) => setForm({ ...form, staffName: e.target.value })}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="Staff coordinator department"
          value={form.staffDepartment}
          onChange={(e) =>
            setForm({ ...form, staffDepartment: e.target.value })
          }
        />

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full mt-4 px-6 py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition"
        >
          {user?.role === "admin" ? "Create Club" : "Send Request"}
        </button>
      </div>
    </div>
  );
}
