/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ClubRequest = {
  _id: string;
  clubData: {
    name: string;
    shortDescription: string;
  };
  requestedBy: {
    name: string;
    srn: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected" | "completed";
  adminRemark?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<ClubRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"pending" | "logs">("pending");
  const [logs, setLogs] = useState<ClubRequest[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        if (data.user?.role === "admin") {
          fetch("/api/admin/club-requests?status=pending")
            .then((res) => res.json())
            .then((data) => {
              setRequests(data.requests || []);
              setLoading(false);
            });
        } else {
          fetch("/api/club-requests/me")
            .then((res) => res.json())
            .then((data) => {
              setRequests(data.requests || []);
              setLoading(false);
            });
        }
      });
  }, []);

  const confirmCreation = async (id: string) => {
    const res = await fetch(`/api/club-requests/${id}/confirm`, {
      method: "POST",
    });

    if (res.ok) {
      toast.success("Club created successfully 🎉");

      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "completed" } : r)),
      );
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to confirm club creation");
    }
  };

  const loadLogs = async () => {
    const statuses = ["approved", "rejected", "completed"];

    const results: ClubRequest[] = [];

    for (const status of statuses) {
      const res = await fetch(`/api/admin/club-requests?status=${status}`);
      const data = await res.json();
      if (data.requests) {
        results.push(...data.requests);
      }
    }

    results.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setLogs(results);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/club-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      toast.success(
        action === "approve" ? "Request approved" : "Request rejected",
      );
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } else {
      const data = await res.json();
      toast.error(data.error || "Action failed");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-white">Loading dashboard...</div>
    );
  }

  // ---------------- ADMIN VIEW ----------------
  if (user?.role === "admin") {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-6">
          Club Creation Requests
        </h1>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setView("pending")}
            className={`px-4 py-2 rounded-lg ${
              view === "pending"
                ? "bg-[#7C3AED] text-white"
                : "bg-white/10 text-white/70"
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => {
              setView("logs");
              loadLogs();
            }}
            className={`px-4 py-2 rounded-lg ${
              view === "logs"
                ? "bg-[#7C3AED] text-white"
                : "bg-white/10 text-white/70"
            }`}
          >
            Logs
          </button>
        </div>

        {view === "pending" && (
          <div>
            {requests.length === 0 && (
              <div className="text-white/60">No pending requests</div>
            )}
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <h2 className="text-xl font-semibold text-white">
                    {req.clubData.name}
                  </h2>
                  <p className="text-white/70 mt-1">
                    {req.clubData.shortDescription}
                  </p>

                  <div className="text-sm text-white/60 mt-3">
                    Requested by {req.requestedBy.name} ({req.requestedBy.srn})
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAction(req._id, "approve")}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(req._id, "reject")}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === "logs" && (
          <div className="space-y-4">
            {logs.length === 0 && (
              <div className="text-white/60">No handled requests yet.</div>
            )}

            {logs.map((req) => (
              <div
                key={req._id}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-xl font-semibold text-white">
                  {req.clubData.name}
                </h2>

                <p className="text-white/70 mt-1">
                  {req.clubData.shortDescription}
                </p>

                <div className="text-sm text-white/60 mt-2">
                  Requested by {req.requestedBy.name} ({req.requestedBy.srn})
                </div>

                <div className="mt-3 text-sm">
                  Status:{" "}
                  <span
                    className={`font-semibold capitalize ${
                      req.status === "approved"
                        ? "text-green-400"
                        : req.status === "rejected"
                          ? "text-red-400"
                          : "text-blue-400"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {req.adminRemark && (
                  <div className="mt-2 text-sm text-white/60">
                    Admin remark: {req.adminRemark}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------- STUDENT VIEW ----------------
  if (user?.role === "student") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-6">
          Your Club Requests
        </h1>

        {requests.length === 0 && (
          <div className="text-white/60">
            You haven’t submitted any club requests yet.
          </div>
        )}

        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-xl font-semibold text-white">
                {req.clubData.name}
              </h2>

              <p className="text-white/70 mt-2">
                Status:{" "}
                <span className="font-semibold capitalize">{req.status}</span>
              </p>

              {req.status === "approved" && (
                <div className="mt-4">
                  <p className="text-green-400 mb-2">
                    Approved! Confirm to officially create the club.
                  </p>
                  <button
                    onClick={() => confirmCreation(req._id)}
                    className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9]"
                  >
                    Confirm Creation
                  </button>
                </div>
              )}

              {req.status === "rejected" && req.adminRemark && (
                <p className="text-red-400 mt-2">Rejected: {req.adminRemark}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="text-white p-10">Dashboard</div>;
}
