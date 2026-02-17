"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import AnnouncementCard from "../Cards/AnnouncementCards/AnnouncementCard";
import CreateAnnouncementModal from "../Cards/AnnouncementCards/createAnnouncementModal";

interface User {
  _id: string;
  srn: string;
  name: string;
  email: string;
  role: "admin" | "student";
  profilePic: string;
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

interface UserClub {
  club: Club;
  roles: {
    clubRanks: string[];
    domainRoles: Array<{
      domain: string;
      ranks: string[];
    }>;
  };
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
  const [user, setUser] = useState<User | null>(null);
  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [clubRequests, setClubRequests] = useState<ClubRequest[]>([]);
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [adminClubRequests, setAdminClubRequests] = useState<ClubRequest[]>([]);
  const [adminEventRequests, setAdminEventRequests] = useState<EventRequest[]>(
    [],
  );
  const [clubLogs, setClubLogs] = useState<ClubRequest[]>([]);
  const [eventLogs, setEventLogs] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "requests" | "logs" | "admin" | "announcements"
  >("overview");

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`Endpoint ${url} not found`);
          return { requests: [] };
        }
        const text = await res.text();
        console.warn(`Failed to fetch ${url}:`, text.substring(0, 100));
        return { requests: [] };
      }
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.warn(`Non-JSON response from ${url}:`, contentType);
        return { requests: [] };
      }
      return await res.json();
    } catch (error) {
      console.warn(`Error fetching ${url}:`, error);
      return { requests: [] };
    }
  };

  const fetchAnnouncements = async () => {
    const data = await safeFetch("/api/announcements");
    setAnnouncements(data.announcements || []);
  };

  const loadDashboardData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const currentUser = meData.user;
      await fetchAnnouncements();
      setUser(currentUser);

      if (currentUser?.role === "admin") {
        const [
          clubPending,
          eventPending,
          clubApproved,
          clubRejected,
          clubCompleted,
        ] = await Promise.all([
          safeFetch("/api/admin/club-requests?status=pending"),
          safeFetch("/api/admin/events/requests?status=pending"),
          safeFetch("/api/admin/club-requests?status=approved"),
          safeFetch("/api/admin/club-requests?status=rejected"),
          safeFetch("/api/admin/club-requests?status=completed"),
        ]);

        setAdminClubRequests(clubPending.requests || []);
        setAdminEventRequests(eventPending.requests || []);

        const allClubLogs = [
          ...(clubApproved.requests || []),
          ...(clubRejected.requests || []),
          ...(clubCompleted.requests || []),
        ].sort(
          (a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        setClubLogs(allClubLogs);
        setEventLogs([]);
      } else {
        const [clubsRes, clubRequestsData, eventRequestsData] =
          await Promise.all([
            fetch("/api/clubs"),
            safeFetch("/api/club-requests/me"),
            safeFetch("/api/events/requests/me"),
          ]);

        const allClubs = await clubsRes.json();

        const userClubRoles: UserClub[] = [];

        for (const club of allClubs) {
          const clubRanks: string[] = [];
          const domainRoles: { domain: string; ranks: string[] }[] = [];

          for (const rank of club.ranks || []) {
            if (rank.users?.some((u: any) => u.srn === currentUser.srn)) {
              clubRanks.push(rank.name);
            }
          }

          for (const domain of club.domains || []) {
            const domainRankNames: string[] = [];
            for (const rank of domain.ranks || []) {
              if (rank.users?.some((u: any) => u.srn === currentUser.srn)) {
                domainRankNames.push(rank.name);
              }
            }
            if (domainRankNames.length > 0) {
              domainRoles.push({
                domain: domain.name,
                ranks: domainRankNames,
              });
            }
          }

          if (clubRanks.length > 0 || domainRoles.length > 0) {
            userClubRoles.push({
              club,
              roles: {
                clubRanks,
                domainRoles,
              },
            });
          }
        }

        setUserClubs(userClubRoles);

        setClubRequests(clubRequestsData.requests || []);
        setEventRequests(eventRequestsData.requests || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard");
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;

    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Deleted!", { id: toastId });
      fetchAnnouncements();
    } catch {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const handleProfilePicUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading("Uploading...");

    try {
      const res = await fetch("/api/upload/profile-pic", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed", { id: toastId });
        return;
      }

      setUser((prev) => (prev ? { ...prev, profilePic: data.url } : null));
      toast.success("Profile picture updated!", { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      setClubRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "completed" } : r)),
      );

      const [approved, rejected, completed] = await Promise.all([
        safeFetch("/api/admin/club-requests?status=approved"),
        safeFetch("/api/admin/club-requests?status=rejected"),
        safeFetch("/api/admin/club-requests?status=completed"),
      ]);

      const allClubLogs = [
        ...(approved.requests || []),
        ...(rejected.requests || []),
        ...(completed.requests || []),
      ].sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setClubLogs(allClubLogs);
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
      setAdminClubRequests((prev) => prev.filter((r) => r._id !== id));

      const [approved, rejected, completed] = await Promise.all([
        safeFetch("/api/admin/club-requests?status=approved"),
        safeFetch("/api/admin/club-requests?status=rejected"),
        safeFetch("/api/admin/club-requests?status=completed"),
      ]);

      const allClubLogs = [
        ...(approved.requests || []),
        ...(rejected.requests || []),
        ...(completed.requests || []),
      ].sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setClubLogs(allClubLogs);
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
      setAdminEventRequests((prev) => prev.filter((r) => r._id !== id));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">Please log in to view dashboard</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      <div className="flex items-start gap-4">
        <div className="relative group">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold overflow-hidden">
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
            onChange={handleProfilePicUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1a1a2e] border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-400 hover:text-purple-300 transition disabled:opacity-50"
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
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-sm text-white/60 mt-1">
            {user.name} • {user.srn}
          </p>
          {user.role === "admin" && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "overview"
              ? "bg-purple-600/20 border-purple-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="text-sm text-white/60">Overview</div>
          <div className="text-xl font-bold text-white mt-1">
            {user.role === "admin"
              ? `${adminClubRequests.length + adminEventRequests.length} Pending`
              : `${userClubs.length} Clubs`}
          </div>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "requests"
              ? "bg-purple-600/20 border-purple-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="text-sm text-white/60">Requests</div>
          <div className="text-xl font-bold text-white mt-1">
            {user.role === "admin"
              ? `${adminClubRequests.length + adminEventRequests.length} Pending`
              : `${clubRequests.length + eventRequests.length} Total`}
          </div>
        </button>

        {user.role === "admin" && (
          <button
            onClick={() => setActiveTab("logs")}
            className={`p-4 rounded-xl border text-left transition ${
              activeTab === "logs"
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-sm text-white/60">Logs</div>
            <div className="text-xl font-bold text-white mt-1">
              {clubLogs.length} History
            </div>
          </button>
        )}

        {user.role === "admin" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`p-4 rounded-xl border text-left transition ${
              activeTab === "admin"
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-sm text-white/60">Admin</div>
            <div className="text-xl font-bold text-white mt-1">Controls</div>
          </button>
        )}

        {user.role !== "admin" && (
          <button
            onClick={() => setActiveTab("announcements")}
            className={`p-4 rounded-xl border text-left transition ${
              activeTab === "announcements"
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-sm text-white/60">Announcements</div>
            <div className="text-xl font-bold text-white mt-1">
              {announcements.length} Updates
            </div>
          </button>
        )}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Profile Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/40">Full Name</p>
                <p className="text-white font-medium mt-1">{user.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/40">SRN</p>
                <p className="text-white font-medium mt-1">{user.srn}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 sm:col-span-2">
                <p className="text-xs text-white/40">Email</p>
                <p className="text-white font-medium mt-1 break-all">
                  {user.email}
                </p>
              </div>
            </div>
          </section>

          {user.role !== "admin" && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                My Clubs & Roles
              </h2>
              {userClubs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">
                    You are not part of any clubs yet.
                  </p>
                  <Link
                    href="/clubs"
                    className="inline-block mt-4 px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 text-sm hover:bg-purple-600/40"
                  >
                    Browse Clubs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userClubs.map(({ club, roles }) => (
                    <div
                      key={club._id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <Link
                        href={`/clubs/${club._id}`}
                        className="text-lg font-semibold text-white hover:text-purple-400"
                      >
                        {club.name}
                      </Link>

                      {roles.clubRanks.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-white/40 mb-2">
                            Club Roles
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {roles.clubRanks.map((rank) => (
                              <span
                                key={rank}
                                className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              >
                                {rank}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {roles.domainRoles.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-white/40 mb-2">
                            Domain Roles
                          </p>
                          <div className="space-y-3">
                            {roles.domainRoles.map((dr) => (
                              <div
                                key={dr.domain}
                                className="pl-3 border-l-2 border-purple-500/30"
                              >
                                <p className="text-sm text-white/80">
                                  {dr.domain}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {dr.ranks.map((rank) => (
                                    <span
                                      key={rank}
                                      className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
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
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-8">
          {user.role === "admin" ? (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Pending Club Requests
                </h2>
                {adminClubRequests.length === 0 ? (
                  <p className="text-white/60 text-center py-4">
                    No pending club requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {adminClubRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-4 rounded-xl bg-white/5 border border-yellow-500/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">
                              {req.clubData.name}
                            </h3>
                            <p className="text-sm text-white/60 mt-1">
                              {req.clubData.shortDescription}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/40">
                              <span>By: {req.requestedBy.name}</span>
                              <span>SRN: {req.requestedBy.srn}</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300 w-fit">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() =>
                              handleAdminClubAction(req._id, "approve")
                            }
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminClubAction(req._id, "reject")
                            }
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Pending Event Requests
                </h2>
                {adminEventRequests.length === 0 ? (
                  <p className="text-white/60 text-center py-4">
                    No pending event requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {adminEventRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-4 rounded-xl bg-white/5 border border-yellow-500/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">
                              {req.eventData.name}
                            </h3>
                            <p className="text-sm text-white/60 mt-1">
                              {req.eventData.shortDescription}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/40">
                              <span>By: {req.requestedBy.name}</span>
                              <span>SRN: {req.requestedBy.srn}</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300 w-fit">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() =>
                              handleAdminEventAction(req._id, "approve")
                            }
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminEventAction(req._id, "reject")
                            }
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
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
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  My Club Requests
                </h2>
                {clubRequests.length === 0 ? (
                  <p className="text-white/60 text-center py-4">
                    No club requests found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {clubRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">
                              {req.clubData.name}
                            </h3>
                            <p className="text-sm text-white/60 mt-1">
                              {req.clubData.shortDescription}
                            </p>
                            <p className="text-xs text-white/40 mt-2">
                              {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs w-fit ${
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
                            className="mt-4 w-full sm:w-auto px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-sm hover:bg-[#6D28D9]"
                          >
                            Confirm Creation
                          </button>
                        )}
                        {req.status === "rejected" && req.adminRemark && (
                          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-xs text-red-400">
                              Reason: {req.adminRemark}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  My Event Requests
                </h2>
                {eventRequests.length === 0 ? (
                  <p className="text-white/60 text-center py-4">
                    No event requests found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {eventRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">
                              {req.eventData.name}
                            </h3>
                            <p className="text-sm text-white/60 mt-1">
                              {req.eventData.shortDescription}
                            </p>
                            <p className="text-xs text-white/40 mt-2">
                              {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs w-fit ${
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
                          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-xs text-red-400">
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
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Club Request History
            </h2>
            {clubLogs.length === 0 ? (
              <p className="text-white/60 text-center py-4">
                No club request history
              </p>
            ) : (
              <div className="space-y-4">
                {clubLogs.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">
                          {req.clubData.name}
                        </h3>
                        <p className="text-sm text-white/60 mt-1">
                          {req.clubData.shortDescription}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/40">
                          <span>By: {req.requestedBy.name}</span>
                          <span>SRN: {req.requestedBy.srn}</span>
                          <span>Email: {req.requestedBy.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/40">
                          <span>Requested: {formatDate(req.createdAt)}</span>
                          <span>Updated: {formatDate(req.updatedAt)}</span>
                        </div>
                        {req.handledBy && (
                          <p className="text-xs text-purple-400 mt-2">
                            Handled by: {req.handledBy.name}
                          </p>
                        )}
                        {req.adminRemark && (
                          <p className="text-xs text-white/40 mt-1">
                            Remark: {req.adminRemark}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs w-fit ${
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
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Admin Controls</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/clubs"
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <h3 className="text-white font-semibold">Manage Clubs</h3>
                <p className="text-sm text-white/60 mt-1">
                  View and manage all clubs
                </p>
              </Link>
              <Link
                href="/events"
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <h3 className="text-white font-semibold">Manage Events</h3>
                <p className="text-sm text-white/60 mt-1">
                  View and manage all events
                </p>
              </Link>
              <Link
                href="/admin/users"
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <h3 className="text-white font-semibold">Manage Users</h3>
                <p className="text-sm text-white/60 mt-1">
                  View and manage users
                </p>
              </Link>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setShowCreateModal(true);
                }}
                className="p-4 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition text-left"
              >
                <h3 className="text-white font-semibold">New Announcement</h3>
                <p className="text-sm text-white/60 mt-1">
                  Post updates, patch notes, etc.
                </p>
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Announcements</h2>
              {announcements.length > 0 && (
                <span className="text-sm text-white/40">
                  {announcements.length} total
                </span>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white/40"
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
                <p className="text-white/60">No announcements yet</p>
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setShowCreateModal(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 text-sm hover:bg-purple-600/40 transition"
                >
                  Create First Announcement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement._id}
                    announcement={announcement}
                    isAdmin={user.role === "admin"}
                    onDelete={handleDeleteAnnouncement}
                    onEdit={(a) => {
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
              fetchAnnouncements();
            }}
            editData={editingAnnouncement}
          />
        </div>
      )}

      {activeTab === "announcements" && user.role !== "admin" && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">All Announcements</h2>
            {announcements.length > 0 && (
              <span className="text-sm text-white/40">
                {announcements.length} total
              </span>
            )}
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white/40"
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
              <p className="text-white/60">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
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
