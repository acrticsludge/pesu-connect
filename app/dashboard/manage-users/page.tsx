"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser } from "@/lib/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  _id: string;
  name: string;
  srn: string;
  email: string;
  role: "student" | "admin";
  profilePic: string | null;
}

export default function ManageUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useUser();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [uploadingPicUserId, setUploadingPicUserId] = useState<string | null>(
    null,
  );
  const [deletingPicUserId, setDeletingPicUserId] = useState<string | null>(
    null,
  );

  // Redirect if not admin
  useEffect(() => {
    if (currentUser !== undefined && currentUser?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (error) {
        toast.error("Failed to load users");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [currentUser]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.srn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleRoleChange = async (
    userId: string,
    newRole: "student" | "admin",
  ) => {
    const toastId = toast.loading("Updating role...");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      const data = await res.json();
      setUsers(users.map((u) => (u._id === userId ? data.user : u)));
      setFilteredUsers(
        filteredUsers.map((u) => (u._id === userId ? data.user : u)),
      );
      toast.success("Role updated successfully", { id: toastId });
      setEditingUserId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
        { id: toastId },
      );
    }
  };

  const handleProfilePicUpload = async (userId: string, file: File) => {
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
    formData.append("userId", userId);

    setUploadingPicUserId(userId);
    const toastId = toast.loading("Uploading profile picture...");

    try {
      const res = await fetch("/api/upload/profile-pic", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Update the user in the list
      const updatedUser = users.find((u) => u._id === userId);
      if (updatedUser) {
        updatedUser.profilePic = data.url;
        setUsers([...users]);
        setFilteredUsers(
          filteredUsers.map((u) =>
            u._id === userId ? { ...u, profilePic: data.url } : u,
          ),
        );
      }

      toast.success("Profile picture updated!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      });
    } finally {
      setUploadingPicUserId(null);
    }
  };

  const handleDeleteProfilePic = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName}'s profile picture?`)) {
      return;
    }

    setDeletingPicUserId(userId);
    const toastId = toast.loading("Removing profile picture...");

    try {
      const res = await fetch(`/api/admin/users/${userId}/profile-pic`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove profile picture");
      }

      const data = await res.json();
      setUsers(users.map((u) => (u._id === userId ? data.user : u)));
      setFilteredUsers(
        filteredUsers.map((u) => (u._id === userId ? data.user : u)),
      );
      toast.success("Profile picture removed", { id: toastId });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove profile picture",
        { id: toastId },
      );
    } finally {
      setDeletingPicUserId(null);
    }
  };

  const handleForceLogout = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to force logout ${userName} from all devices?`,
      )
    ) {
      return;
    }

    const toastId = toast.loading("Logging out user...");
    try {
      const res = await fetch(`/api/admin/users/${userId}/logout`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to logout user");
      }

      toast.success(`${userName} has been logged out from all devices`, {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to logout user",
        { id: toastId },
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Manage Users
          </h1>
          <p className="text-white/60 mt-1 text-sm">
            Manage user roles, profile pictures, and sessions
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold border border-white/10 hover:bg-white/10 transition active:scale-95"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users by name, SRN, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">
              {searchTerm
                ? "No users found matching your search"
                : "No users found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="p-4 sm:p-5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold overflow-hidden">
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
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <svg
                        className="w-5 h-5 text-white"
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
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleProfilePicUpload(user._id, file);
                          }
                        }}
                        disabled={uploadingPicUserId === user._id}
                        className="hidden"
                      />
                    </label>
                    {uploadingPicUserId === user._id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {user.name}
                    </h3>
                    <p className="text-sm text-white/60">{user.srn}</p>
                    <p className="text-xs text-white/40 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-white/60">Role:</label>
                      {editingUserId === user._id ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user._id,
                              e.target.value as "student" | "admin",
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-purple-500 transition"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            user.role === "admin"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "bg-white/10 text-white/80 border border-white/20"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "Student"}
                        </span>
                      )}
                      {editingUserId === user._id && (
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                        >
                          Done
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editingUserId !== user._id && (
                        <button
                          onClick={() => setEditingUserId(user._id)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium border border-white/20 hover:bg-white/20 transition active:scale-95"
                          title="Edit role"
                        >
                          Edit
                        </button>
                      )}
                      {user.profilePic && (
                        <button
                          onClick={() =>
                            handleDeleteProfilePic(user._id, user.name)
                          }
                          disabled={deletingPicUserId === user._id}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 text-sm font-medium border border-orange-500/30 hover:bg-orange-500/30 transition active:scale-95 disabled:opacity-50"
                          title="Remove profile picture"
                        >
                          {deletingPicUserId === user._id
                            ? "Removing..."
                            : "Remove Pic"}
                        </button>
                      )}
                      <button
                        onClick={() => handleForceLogout(user._id, user.name)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium border border-red-500/30 hover:bg-red-500/30 transition active:scale-95 pointer-events-none"
                        title="Force logout from all devices"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-sm text-white/60">
          Total users: {users.length} | Showing: {filteredUsers.length}
        </div>
      </div>
    </div>
  );
}
