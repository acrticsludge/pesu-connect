"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

interface RequestDetailModalProps {
  isOpen: boolean;
  request: ClubRequest | EventRequest | null;
  type: "club" | "event";
  onClose: () => void;
  isAdmin: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, remark: string) => void;
  onConfirm?: (id: string) => void;
  isLoading?: boolean;
  formatDate: (date: string) => string;
}

export default function RequestDetailModal({
  isOpen,
  request,
  type,
  onClose,
  isAdmin,
  onApprove,
  onReject,
  onConfirm,
  isLoading = false,
  formatDate,
}: RequestDetailModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShowRejectForm(false);
      setRejectRemark("");
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const clubRequest = request as ClubRequest;
  const eventRequest = request as EventRequest;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleOverlayClick}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
          <div className="flex justify-end p-4 sm:p-6 border-b border-white/10">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition p-1"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            {type === "club" ? (
              <>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        {clubRequest.clubData.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(
                          clubRequest.status,
                        )}`}
                      >
                        {clubRequest.status}
                      </span>
                    </div>
                    <p className="text-white/60">
                      {clubRequest.clubData.shortDescription}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Requested By
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-white/60">Name:</span>{" "}
                        {clubRequest.requestedBy.name}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">SRN:</span>{" "}
                        {clubRequest.requestedBy.srn}
                      </p>
                      <p className="text-white break-all">
                        <span className="text-white/60">Email:</span>{" "}
                        {clubRequest.requestedBy.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Club Details
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-white/60">Founded On:</span>{" "}
                        {clubRequest.clubData.foundedOn}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Staff Name:</span>{" "}
                        {clubRequest.clubData.staffName}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Staff Department:</span>{" "}
                        {clubRequest.clubData.staffDepartment}
                      </p>
                      {clubRequest.clubData.instagram && (
                        <p className="text-white">
                          <span className="text-white/60">Instagram:</span>{" "}
                          <a
                            href={`https://instagram.com/${clubRequest.clubData.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition"
                          >
                            @{clubRequest.clubData.instagram}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white/80 text-sm">
                        <span className="text-white/60">Requested:</span>{" "}
                        {formatDate(clubRequest.createdAt)}
                      </p>
                      <p className="text-white/80 text-sm">
                        <span className="text-white/60">Updated:</span>{" "}
                        {formatDate(clubRequest.updatedAt)}
                      </p>
                      {clubRequest.handledBy && (
                        <p className="text-purple-400 text-sm">
                          <span className="text-white/60">Handled by:</span>{" "}
                          {clubRequest.handledBy.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {clubRequest.adminRemark && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                      <p className="text-red-300 text-sm">
                        <span className="font-semibold">Remark:</span>{" "}
                        {clubRequest.adminRemark}
                      </p>
                    </div>
                  )}

                  {clubRequest.clubData.bannerUrl && (
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={clubRequest.clubData.bannerUrl}
                        alt={clubRequest.clubData.name}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        {eventRequest.eventData.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(
                          eventRequest.status,
                        )}`}
                      >
                        {eventRequest.status}
                      </span>
                    </div>
                    <p className="text-white/60 mb-3">
                      {eventRequest.eventData.shortDescription}
                    </p>
                  </div>

                  {eventRequest.eventData.bannerUrl && (
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={eventRequest.eventData.bannerUrl}
                        alt={eventRequest.eventData.name}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Description
                    </h3>
                    <p className="text-white/80 whitespace-pre-wrap">
                      {eventRequest.eventData.fullDescription}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Event Details
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-white/60">Venue:</span>{" "}
                        {eventRequest.eventData.venue}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Campus:</span>{" "}
                        {eventRequest.eventData.campus}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Category:</span>{" "}
                        {eventRequest.eventData.category}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Tag:</span>{" "}
                        {eventRequest.eventData.tag}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Start Date:</span>{" "}
                        {formatDate(eventRequest.eventData.startDate)}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">End Date:</span>{" "}
                        {formatDate(eventRequest.eventData.endDate)}
                      </p>
                    </div>
                  </div>

                  {eventRequest.eventData.involvedClubs.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h3 className="text-sm font-semibold text-white/60 mb-3">
                        Involved Clubs
                      </h3>
                      <div className="space-y-2">
                        {eventRequest.eventData.involvedClubs.map((item) => (
                          <p key={item.club._id} className="text-white">
                            <span className="text-white/60">
                              {item.club.name}:
                            </span>{" "}
                            {item.domain}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Requested By
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-white/60">Name:</span>{" "}
                        {eventRequest.requestedBy.name}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">SRN:</span>{" "}
                        {eventRequest.requestedBy.srn}
                      </p>
                      <p className="text-white break-all">
                        <span className="text-white/60">Email:</span>{" "}
                        {eventRequest.requestedBy.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white/80 text-sm">
                        <span className="text-white/60">Requested:</span>{" "}
                        {formatDate(eventRequest.createdAt)}
                      </p>
                      <p className="text-white/80 text-sm">
                        <span className="text-white/60">Updated:</span>{" "}
                        {formatDate(eventRequest.updatedAt)}
                      </p>
                      {eventRequest.handledBy && (
                        <p className="text-purple-400 text-sm">
                          <span className="text-white/60">Handled by:</span>{" "}
                          {eventRequest.handledBy.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {eventRequest.adminRemark && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                      <p className="text-red-300 text-sm">
                        <span className="font-semibold">Remark:</span>{" "}
                        {eventRequest.adminRemark}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-white/10 p-4 sm:p-6 bg-white/5">
            {showRejectForm ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Rejection Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={rejectRemark}
                    onChange={(e) => setRejectRemark(e.target.value)}
                    placeholder="Please provide a reason for rejecting this request (visible to the user)..."
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none resize-none"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectRemark("");
                    }}
                    disabled={isLoading}
                    className="px-4 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition active:scale-95 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectRemark.trim()) {
                        toast.error("Please provide a rejection reason");
                        return;
                      }
                      onReject?.(request._id, rejectRemark);
                    }}
                    disabled={isLoading || !rejectRemark.trim()}
                    className="px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading && (
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
                    )}
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition active:scale-95 disabled:opacity-50"
                >
                  Close
                </button>

                {isAdmin && request?.status === "pending" && (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading && (
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
                      )}
                      Reject
                    </button>
                    <button
                      onClick={() => onApprove?.(request._id)}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading && (
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
                      )}
                      Approve
                    </button>
                  </>
                )}

                {!isAdmin &&
                  type === "club" &&
                  (request as ClubRequest).status === "approved" &&
                  onConfirm && (
                    <button
                      onClick={() => onConfirm(request._id)}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading && (
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
                      )}
                      Confirm Creation
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
