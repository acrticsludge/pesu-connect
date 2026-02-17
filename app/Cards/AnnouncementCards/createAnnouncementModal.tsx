import { useState } from "react";
import toast from "react-hot-toast";

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: CreateAnnouncementModalProps) {
  const [form, setForm] = useState({
    title: editData?.title || "",
    content: editData?.content || "",
    type: editData?.type || "info",
    pinned: editData?.pinned || false,
    version: editData?.version || "",
    expiresAt: editData?.expiresAt
      ? new Date(editData.expiresAt).toISOString().split("T")[0]
      : "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(editData ? "Updating..." : "Creating...");

    try {
      const url = editData
        ? `/api/announcements/${editData._id}`
        : "/api/announcements";

      const res = await fetch(url, {
        method: editData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save", { id: toastId });
        return;
      }

      toast.success(editData ? "Updated!" : "Created!", { id: toastId });
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1a2e] p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          {editData ? "Edit Announcement" : "Create Announcement"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-purple-500/50 focus:outline-none"
              placeholder="v1.2.0 - Major Update"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">
              Content *
            </label>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-purple-500/50 focus:outline-none"
              placeholder="- Added new feature X\n- Fixed bug Y\n- Improved performance"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as any })
                }
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-purple-500/50 focus:outline-none"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="patch">Patch Note</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">
                Version (optional)
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-purple-500/50 focus:outline-none"
                placeholder="1.2.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Expires At (optional)
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-purple-500/50 focus:outline-none"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) =>
                    setForm({ ...form, pinned: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                Pin this announcement
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : editData ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
