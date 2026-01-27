/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

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

  const handleAction = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/club-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setRequests((prev) => prev.filter((r) => r._id !== id));
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
                <p className="text-green-400 mt-2">
                  Approved! Waiting for confirmation step.
                </p>
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
