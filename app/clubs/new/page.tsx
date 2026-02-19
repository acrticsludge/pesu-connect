"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/lib/hooks/useUser";
import { useCreateClub } from "@/lib/hooks/useCreateClub";

export default function AddClubPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const isAdmin = user?.role === "admin";
  const createClub = useCreateClub(isAdmin);

  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    foundedOn: "",
    bannerUrl: "",
    instagram: "",
    staffName: "",
    staffDepartment: "",
  });

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.replace("/");
    return null;
  }

  const validate = () => {
    if (!form.name.trim()) return "Club name is required";
    if (!form.foundedOn) return "Founded date is required";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    createClub.mutate(form, {
      onSuccess: (data) => {
        if (user.role === "admin") {
          router.push(`/clubs/${data._id}`);
        } else {
          router.push("/dashboard");
        }
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">
        Create New Club
      </h1>

      <div className="space-y-3 sm:space-y-4">
        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
          placeholder="Club name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={createClub.isPending}
        />

        <textarea
          className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
          placeholder="Short description"
          rows={3}
          value={form.shortDescription}
          onChange={(e) =>
            setForm({ ...form, shortDescription: e.target.value })
          }
          disabled={createClub.isPending}
        />

        <div>
          <label className="block text-xs sm:text-sm text-white/60 mb-1">
            Founded Date *
          </label>
          <input
            type="date"
            className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
            value={form.foundedOn}
            onChange={(e) => setForm({ ...form, foundedOn: e.target.value })}
            disabled={createClub.isPending}
          />
        </div>

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
          placeholder="Banner image URL (optional)"
          value={form.bannerUrl}
          onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
          disabled={createClub.isPending}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
          placeholder="Instagram URL (optional)"
          value={form.instagram}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          disabled={createClub.isPending}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
          placeholder="Staff coordinator name"
          value={form.staffName}
          onChange={(e) => setForm({ ...form, staffName: e.target.value })}
          disabled={createClub.isPending}
        />

        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base outline-none focus:border-purple-500/50 transition disabled:opacity-50"
          placeholder="Staff coordinator department"
          value={form.staffDepartment}
          onChange={(e) =>
            setForm({ ...form, staffDepartment: e.target.value })
          }
          disabled={createClub.isPending}
        />

        <button
          onClick={handleSubmit}
          disabled={createClub.isPending}
          className="w-full mt-4 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
        >
          {createClub.isPending
            ? "Submitting..."
            : user?.role === "admin"
              ? "Create Club"
              : "Send Request"}
        </button>
      </div>
    </div>
  );
}
