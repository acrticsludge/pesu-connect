import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useProfilePicture(user: any, onSuccess?: (user: any) => void) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      queryClient.invalidateQueries({ queryKey: ["user"] });
      if (onSuccess) {
        onSuccess({ ...user, profilePic: data.url });
      }
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

  return { uploading, fileInputRef, handleUpload };
}
