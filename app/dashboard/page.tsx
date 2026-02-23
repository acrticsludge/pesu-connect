"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AnnouncementCard from "../Cards/AnnouncementCards/AnnouncementCard";
import CreateAnnouncementModal from "../Cards/AnnouncementCards/createAnnouncementModal";
import { useUser } from "@/lib/hooks/useUser";
import { useClubs } from "@/lib/hooks/useClubs";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { useUserClubs } from "@/lib/hooks/useUserClubs";
import { useClubRequests } from "@/lib/hooks/useClubRequests";
import { useEventRequests } from "@/lib/hooks/useEventRequests";
import { useProfilePicture } from "@/lib/hooks/useProfilePicture";
import { useQueryClient } from "@tanstack/react-query";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "patch" | "event";
  createdBy: {
    name: string;
  };
  createdAt: string;
  pinned: boolean;
  version?: string;
}

interface Club {
  _id: string;
  name: string;
  domains: Array<{
    name: string;
    ranks: Array<{
      name: string;
      level: number;
      users: Array<{ srn: string }>;
    }>;
  }>;
  ranks: Array<{
    name: string;
    level: number;
    users: Array<{ srn: string }>;
  }>;
}

interface ClubRequest {
  _id: string;
  clubData: {
    name: string;
    shortDescription: string;
    foundedOn: string;
    bannerUrl?: string;
    instagram?: string;
    staffName: string;
    staffDepartment: string;
  };
  requestedBy: {
    name: string;
    srn: string;
    email: string;
  };
  handledBy?: {
    name: string;
  };
  status: "pending" | "approved" | "rejected" | "completed";
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventRequest {
  _id: string;
  eventData: {
    name: string;
    shortDescription: string;
    fullDescription: string;
    bannerUrl: string;
    venue: string;
    campus: "EC" | "RR";
    startDate: string;
    endDate: string;
    category: string;
    tag: string;
    involvedClubs: Array<{
      club: { _id: string; name: string };
      domain: string;
    }>;
  };
  requestedBy: {
    name: string;
    srn: string;
    email: string;
  };
  handledBy?: {
    name: string;
  };
  status: "pending" | "approved" | "rejected" | "completed";
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "requests" | "logs" | "admin" | "announcements"
  >("overview");

  const { data: user, refetch: refetchUser } = useUser();
  const { data: clubs = [] } = useClubs();
  const { data: announcements = [], refetch: refetchAnnouncements } =
    useAnnouncements();
  const { data: userClubs = [] } = useUserClubs(user, clubs);
  const { data: clubRequests = [] } = useClubRequests(
    user?.role === "admin" ? "admin" : "user",
  );
  const { data: eventRequests = [] } = useEventRequests(
    user?.role === "admin" ? "admin" : "user",
  );

  const { refetch } = useUser();

  const { uploading, fileInputRef, handleUpload } = useProfilePicture(
    user,
    () => {
      refetchUser();
    },
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [adminClubRequests, setAdminClubRequests] = useState<ClubRequest[]>([]);
  const [adminEventRequests, setAdminEventRequests] = useState<EventRequest[]>(
    [],
  );
  const [clubLogs, setClubLogs] = useState<ClubRequest[]>([]);
  const [eventLogs, setEventLogs] = useState<EventRequest[]>([]);

  useEffect(() => {
    if (user?.role === "admin") {
      const pendingClubs = clubRequests.filter(
        (r: ClubRequest) => r.status === "pending",
      );
      const pendingEvents = eventRequests.filter(
        (r: EventRequest) => r.status === "pending",
      );
      const clubLogsData = clubRequests
        .filter((r: ClubRequest) => r.status !== "pending")
        .sort(
          (a: ClubRequest, b: ClubRequest) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

      const eventLogsData = eventRequests
        .filter((r: EventRequest) => r.status !== "pending")
        .sort(
          (a: EventRequest, b: EventRequest) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

      if (JSON.stringify(pendingClubs) !== JSON.stringify(adminClubRequests)) {
        setAdminClubRequests(pendingClubs);
      }
      if (
        JSON.stringify(pendingEvents) !== JSON.stringify(adminEventRequests)
      ) {
        setAdminEventRequests(pendingEvents);
      }
      if (JSON.stringify(clubLogsData) !== JSON.stringify(clubLogs)) {
        setClubLogs(clubLogsData);
      }
      if (JSON.stringify(eventLogsData) !== JSON.stringify(eventLogs)) {
        setEventLogs(eventLogsData);
      }
    }
  }, [
    clubRequests,
    eventRequests,
    user,
    adminClubRequests,
    adminEventRequests,
    clubLogs,
    eventLogs,
  ]);

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted!", { id: toastId });
      refetchAnnouncements();
    } catch {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      queryClient.clear();

      window.location.href = "/";

      toast.success("Logged out successfully", { id: toastId });
    } catch {
      toast.error("Failed to logout", { id: toastId });
    }
  };

  const confirmClubCreation = async (id: string) => {
    const toastId = toast.loading("Creating club...");
    try {
      const res = await fetch(`/api/club-requests/${id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to confirm", { id: toastId });
        return;
      }
      toast.success("Club created successfully!", { id: toastId });
    } catch {
      toast.error("Network error", { id: toastId });
    }
  };

  const handleAdminClubAction = async (
    id: string,
    action: "approve" | "reject",
  ) => {
    const toastId = toast.loading(`${action}ing request...`);
    try {
      const res = await fetch(`/api/admin/club-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed", { id: toastId });
        return;
      }
      toast.success(`Request ${action}d`, { id: toastId });

      queryClient.invalidateQueries({ queryKey: ["club-requests", "admin"] });
    } catch {
      toast.error("Network error", { id: toastId });
    }
  };

  const handleAdminEventAction = async (
    id: string,
    action: "approve" | "reject",
  ) => {
    const toastId = toast.loading(`${action}ing request...`);
    try {
      const res = await fetch(`/api/admin/events/requests/${id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed", { id: toastId });
        return;
      }
      toast.success(`Request ${action}d`, { id: toastId });

      queryClient.invalidateQueries({ queryKey: ["event-requests", "admin"] });
    } catch {
      toast.error("Network error", { id: toastId });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="relative group shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold overflow-hidden">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#1a1a2e] border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-400 hover:text-purple-300 transition disabled:opacity-50 active:scale-95"
            >
              {uploading ? (
                <svg
                  className="w-3 h-3 animate-spin"
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
              ) : (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 truncate">
              {user.name} • {user.srn}
            </p>
            {user.role === "admin" && (
              <span className="inline-block mt-1.5 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Admin
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-red-500/20 text-red-300 text-sm font-semibold border border-red-500/30 hover:bg-red-500/30 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`p-3 sm:p-4 rounded-xl border text-left transition active:scale-[0.98] ${
            activeTab === "overview"
              ? "bg-purple-600/20 border-purple-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="text-[10px] sm:text-xs text-white/60">Overview</div>
          <div className="text-sm sm:text-base md:text-xl font-bold text-white mt-0.5 sm:mt-1">
            {user.role === "admin"
              ? `${adminClubRequests.length + adminEventRequests.length} Pending`
              : `${userClubs.length} Clubs`}
          </div>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`p-3 sm:p-4 rounded-xl border text-left transition active:scale-[0.98] ${
            activeTab === "requests"
              ? "bg-purple-600/20 border-purple-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="text-[10px] sm:text-xs text-white/60">Requests</div>
          <div className="text-sm sm:text-base md:text-xl font-bold text-white mt-0.5 sm:mt-1">
            {user.role === "admin"
              ? `${adminClubRequests.length + adminEventRequests.length} Pending`
              : `${clubRequests.length + eventRequests.length} Total`}
          </div>
        </button>

        {user.role === "admin" && (
          <button
            onClick={() => setActiveTab("logs")}
            className={`p-3 sm:p-4 rounded-xl border text-left transition active:scale-[0.98] ${
              activeTab === "logs"
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-[10px] sm:text-xs text-white/60">Logs</div>
            <div className="text-sm sm:text-base md:text-xl font-bold text-white mt-0.5 sm:mt-1">
              {clubLogs.length + eventLogs.length} History
            </div>
          </button>
        )}

        {user.role === "admin" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`p-3 sm:p-4 rounded-xl border text-left transition active:scale-[0.98] ${
              activeTab === "admin"
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-[10px] sm:text-xs text-white/60">Admin</div>
            <div className="text-sm sm:text-base md:text-xl font-bold text-white mt-0.5 sm:mt-1">
              Controls
            </div>
          </button>
        )}

        {user.role !== "admin" && (
          <button
            onClick={() => setActiveTab("announcements")}
            className={`p-3 sm:p-4 rounded-xl border text-left transition active:scale-[0.98] ${
              activeTab === "announcements"
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-[10px] sm:text-xs text-white/60">
              Announcements
            </div>
            <div className="text-sm sm:text-base md:text-xl font-bold text-white mt-0.5 sm:mt-1">
              {announcements.length} Updates
            </div>
          </button>
        )}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6 sm:space-y-8">
          <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
              Profile Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/5">
                <p className="text-[10px] sm:text-xs text-white/40">
                  Full Name
                </p>
                <p className="text-sm sm:text-base text-white font-medium mt-0.5 sm:mt-1 truncate">
                  {user.name}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/5">
                <p className="text-[10px] sm:text-xs text-white/40">SRN</p>
                <p className="text-sm sm:text-base text-white font-medium mt-0.5 sm:mt-1">
                  {user.srn}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 sm:col-span-2">
                <p className="text-[10px] sm:text-xs text-white/40">Email</p>
                <p className="text-sm sm:text-base text-white font-medium mt-0.5 sm:mt-1 break-all">
                  {user.email}
                </p>
              </div>
            </div>
          </section>

          {user.role !== "admin" && (
            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                My Clubs & Roles
              </h2>
              {userClubs.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-white/60">
                    You are not part of any clubs yet.
                  </p>
                  <Link
                    href="/clubs"
                    className="inline-block mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-purple-600/30 text-purple-300 text-xs sm:text-sm hover:bg-purple-600/40 transition active:scale-95"
                  >
                    Browse Clubs
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {userClubs.map((item: any) => {
                    const club = item.club;
                    const roles = item.roles;
                    return (
                      <div
                        key={club._id}
                        className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <Link
                          href={`/clubs/${club._id}`}
                          className="text-base sm:text-lg font-semibold text-white hover:text-purple-400 transition"
                        >
                          {club.name}
                        </Link>

                        {roles.clubRanks.length > 0 && (
                          <div className="mt-2 sm:mt-3">
                            <p className="text-[10px] sm:text-xs text-white/40 mb-1.5 sm:mb-2">
                              Club Roles
                            </p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {roles.clubRanks.map((rank: string) => (
                                <span
                                  key={rank}
                                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                >
                                  {rank}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {roles.domainRoles.length > 0 && (
                          <div className="mt-3 sm:mt-4">
                            <p className="text-[10px] sm:text-xs text-white/40 mb-1.5 sm:mb-2">
                              Domain Roles
                            </p>
                            <div className="space-y-2 sm:space-y-3">
                              {roles.domainRoles.map((dr: any) => (
                                <div
                                  key={dr.domain}
                                  className="pl-2 sm:pl-3 border-l-2 border-purple-500/30"
                                >
                                  <p className="text-xs sm:text-sm text-white/80">
                                    {dr.domain}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                    {dr.ranks.map((rank: string) => (
                                      <span
                                        key={rank}
                                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                      >
                                        {rank}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          {user.role !== "admin" && (
            <>
              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Link href="/clubs/new">
                    <button className="w-full p-4 rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 transition text-left">
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        Create a Club
                      </h3>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        Start a new club on campus
                      </p>
                    </button>
                  </Link>

                  {clubs.some((club) =>
                    club.ranks?.some(
                      (rank) =>
                        rank.level === 1 &&
                        rank.users?.some((u) => u.srn === user?.srn),
                    ),
                  ) && (
                    <Link href="/events/new">
                      <button className="w-full p-4 rounded-xl bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 transition text-left">
                        <h3 className="text-sm sm:text-base font-semibold text-white">
                          Create Event
                        </h3>
                        <p className="text-xs sm:text-sm text-white/60 mt-1">
                          Host a new event for your club
                        </p>
                      </button>
                    </Link>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-6 sm:space-y-8">
          {user.role === "admin" ? (
            <>
              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Pending Club Requests
                </h2>
                {adminClubRequests.length === 0 ? (
                  <p className="text-sm sm:text-base text-white/60 text-center py-3 sm:py-4">
                    No pending club requests
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {adminClubRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-3 sm:p-4 rounded-xl bg-white/5 border border-yellow-500/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-white">
                              {req.clubData.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 line-clamp-2">
                              {req.clubData.shortDescription}
                            </p>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-white/40">
                              <span>By: {req.requestedBy.name}</span>
                              <span>SRN: {req.requestedBy.srn}</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-300 w-fit">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          <button
                            onClick={() =>
                              handleAdminClubAction(req._id, "approve")
                            }
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-600 text-white text-xs sm:text-sm hover:bg-green-700 transition active:scale-95"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminClubAction(req._id, "reject")
                            }
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 text-white text-xs sm:text-sm hover:bg-red-700 transition active:scale-95"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Pending Event Requests
                </h2>
                {adminEventRequests.length === 0 ? (
                  <p className="text-sm sm:text-base text-white/60 text-center py-3 sm:py-4">
                    No pending event requests
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {adminEventRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-3 sm:p-4 rounded-xl bg-white/5 border border-yellow-500/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-white">
                              {req.eventData.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 line-clamp-2">
                              {req.eventData.shortDescription}
                            </p>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-white/40">
                              <span>By: {req.requestedBy.name}</span>
                              <span>SRN: {req.requestedBy.srn}</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-300 w-fit">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          <button
                            onClick={() =>
                              handleAdminEventAction(req._id, "approve")
                            }
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-600 text-white text-xs sm:text-sm hover:bg-green-700 transition active:scale-95"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminEventAction(req._id, "reject")
                            }
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 text-white text-xs sm:text-sm hover:bg-red-700 transition active:scale-95"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  My Club Requests
                </h2>
                {clubRequests.length === 0 ? (
                  <p className="text-sm sm:text-base text-white/60 text-center py-3 sm:py-4">
                    No club requests found
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {clubRequests.map((req: ClubRequest) => (
                      <div
                        key={req._id}
                        className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-white">
                              {req.clubData.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 line-clamp-2">
                              {req.clubData.shortDescription}
                            </p>
                            <p className="text-[10px] sm:text-xs text-white/40 mt-1.5 sm:mt-2">
                              {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs w-fit ${
                              req.status === "approved"
                                ? "bg-green-500/20 text-green-300"
                                : req.status === "rejected"
                                  ? "bg-red-500/20 text-red-300"
                                  : req.status === "completed"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.status === "approved" && (
                          <button
                            onClick={() => confirmClubCreation(req._id)}
                            className="mt-3 sm:mt-4 w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#7C3AED] text-white text-xs sm:text-sm hover:bg-[#6D28D9] transition active:scale-95"
                          >
                            Confirm Creation
                          </button>
                        )}
                        {req.status === "rejected" && req.adminRemark && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-[10px] sm:text-xs text-red-400">
                              Reason: {req.adminRemark}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  My Event Requests
                </h2>
                {eventRequests.length === 0 ? (
                  <p className="text-sm sm:text-base text-white/60 text-center py-3 sm:py-4">
                    No event requests found
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {eventRequests.map((req: EventRequest) => (
                      <div
                        key={req._id}
                        className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-white">
                              {req.eventData.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 line-clamp-2">
                              {req.eventData.shortDescription}
                            </p>
                            <p className="text-[10px] sm:text-xs text-white/40 mt-1.5 sm:mt-2">
                              {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs w-fit ${
                              req.status === "approved"
                                ? "bg-green-500/20 text-green-300"
                                : req.status === "rejected"
                                  ? "bg-red-500/20 text-red-300"
                                  : req.status === "completed"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.status === "rejected" && req.adminRemark && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-[10px] sm:text-xs text-red-400">
                              Reason: {req.adminRemark}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {activeTab === "logs" && user.role === "admin" && (
        <div className="space-y-6 sm:space-y-8">
          <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
              Club Request History
            </h2>
            {clubLogs.length === 0 ? (
              <p className="text-sm sm:text-base text-white/60 text-center py-3 sm:py-4">
                No club request history
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {clubLogs.map((req) => (
                  <div
                    key={req._id}
                    className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-white">
                          {req.clubData.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 line-clamp-2">
                          {req.clubData.shortDescription}
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-white/40">
                          <span>By: {req.requestedBy.name}</span>
                          <span>SRN: {req.requestedBy.srn}</span>
                          <span>Email: {req.requestedBy.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-white/40">
                          <span>Requested: {formatDate(req.createdAt)}</span>
                          <span>Updated: {formatDate(req.updatedAt)}</span>
                        </div>
                        {req.handledBy && (
                          <p className="text-[10px] sm:text-xs text-purple-400 mt-1.5 sm:mt-2">
                            Handled by: {req.handledBy.name}
                          </p>
                        )}
                        {req.adminRemark && (
                          <p className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">
                            Remark: {req.adminRemark}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs w-fit ${
                          req.status === "approved"
                            ? "bg-green-500/20 text-green-300"
                            : req.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : req.status === "completed"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
              Event Request History
            </h2>
            {eventLogs.length === 0 ? (
              <p className="text-sm sm:text-base text-white/60 text-center py-3 sm:py-4">
                No event request history
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {eventLogs.map((req: EventRequest) => (
                  <div
                    key={req._id}
                    className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-white">
                          {req.eventData.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1 line-clamp-2">
                          {req.eventData.shortDescription}
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-white/40">
                          <span>By: {req.requestedBy.name}</span>
                          <span>SRN: {req.requestedBy.srn}</span>
                          <span>Email: {req.requestedBy.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-white/40">
                          <span>Requested: {formatDate(req.createdAt)}</span>
                          <span>Updated: {formatDate(req.updatedAt)}</span>
                        </div>
                        {req.handledBy && (
                          <p className="text-[10px] sm:text-xs text-purple-400 mt-1.5 sm:mt-2">
                            Handled by: {req.handledBy.name}
                          </p>
                        )}
                        {req.adminRemark && (
                          <p className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">
                            Remark: {req.adminRemark}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs w-fit ${
                          req.status === "approved"
                            ? "bg-green-500/20 text-green-300"
                            : req.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : req.status === "completed"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "admin" && user.role === "admin" && (
        <div className="space-y-6 sm:space-y-8">
          <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Admin Controls
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/clubs"
                className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-[0.98]"
              >
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  Manage Clubs
                </h3>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1">
                  View and manage all clubs
                </p>
              </Link>
              <Link
                href="/events"
                className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-[0.98]"
              >
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  Manage Events
                </h3>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1">
                  View and manage all events
                </p>
              </Link>
              <Link
                href="/admin/users"
                className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-[0.98]"
              >
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  Manage Users
                </h3>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1">
                  View and manage users
                </p>
              </Link>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setShowCreateModal(true);
                }}
                className="p-3 sm:p-4 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition text-left active:scale-[0.98]"
              >
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  New Announcement
                </h3>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1">
                  Post updates, patch notes, etc.
                </p>
              </button>
            </div>
          </section>

          <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Announcements
              </h2>
              {announcements.length > 0 && (
                <span className="text-[10px] sm:text-xs text-white/40">
                  {announcements.length} total
                </span>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-white/60">
                  No announcements yet
                </p>
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setShowCreateModal(true);
                  }}
                  className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-purple-600/30 text-purple-300 text-xs sm:text-sm hover:bg-purple-600/40 transition active:scale-95"
                >
                  Create First Announcement
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {announcements.map((announcement: Announcement) => (
                  <AnnouncementCard
                    key={announcement._id}
                    announcement={announcement}
                    isAdmin={user.role === "admin"}
                    onDelete={handleDeleteAnnouncement}
                    onEdit={(a: Announcement) => {
                      setEditingAnnouncement(a);
                      setShowCreateModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <CreateAnnouncementModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingAnnouncement(null);
            }}
            onSuccess={() => {
              refetchAnnouncements();
            }}
            editData={editingAnnouncement}
          />
        </div>
      )}

      {activeTab === "announcements" && user.role !== "admin" && (
        <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-white">
              All Announcements
            </h2>
            {announcements.length > 0 && (
              <span className="text-[10px] sm:text-xs text-white/40">
                {announcements.length} total
              </span>
            )}
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-white/60">
                No announcements yet
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {announcements.map((announcement: Announcement) => (
                <AnnouncementCard
                  key={announcement._id}
                  announcement={announcement}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
