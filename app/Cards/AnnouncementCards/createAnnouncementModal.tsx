import { useState, useEffect } from "react";
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
    title: "",
    content: "",
    type: "info",
    pinned: false,
    version: "",
    expiresAt: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || "",
        content: editData.content || "",
        type: editData.type || "info",
        pinned: editData.pinned || false,
        version: editData.version || "",
        expiresAt: editData.expiresAt
          ? new Date(editData.expiresAt).toISOString().split("T")[0]
          : "",
      });
    } else {
      setForm({
        title: "",
        content: "",
        type: "info",
        pinned: false,
        version: "",
        expiresAt: "",
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Content is required");
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
        throw new Error(data.error || "Failed to save");
      }

      toast.success(editData ? "Updated!" : "Created!", { id: toastId });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
        { id: toastId },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1a2e] p-4 sm:p-6 my-4 sm:my-8">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          {editData ? "Edit Announcement" : "Create Announcement"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm text-white/60 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
              placeholder="v1.2.0 - Major Update"
              disabled={submitting}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-white/60 mb-1">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50 resize-y min-h-30"
              placeholder="- Added new feature X\n- Fixed bug Y\n- Improved performance"
              disabled={submitting}
            />
            <p className="text-xs text-white/40 mt-1">
              Use bullet points with hyphens for better readability
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-white/60 mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as any })
                }
                className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                disabled={submitting}
              >
                <option value="info">📢 Info</option>
                <option value="warning">⚠️ Warning</option>
                <option value="success">✅ Success</option>
                <option value="patch">🔧 Patch Note</option>
                <option value="event">🎉 Event</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-white/60 mb-1">
                Version (optional)
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                placeholder="1.2.0"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-white/60 mb-1">
                Expires At (optional)
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                disabled={submitting}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-white text-sm sm:text-base cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) =>
                    setForm({ ...form, pinned: e.target.checked })
                  }
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                  disabled={submitting}
                />
                Pin this announcement
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition active:scale-[0.98] text-sm sm:text-base"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
            >
              {submitting ? "Saving..." : editData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
