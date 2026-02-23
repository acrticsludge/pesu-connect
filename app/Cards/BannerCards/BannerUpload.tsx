"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface BannerUploadProps {
  currentImage?: string;
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
}

export function BannerUpload({
  currentImage,
  onUpload,
  folder = "banners",
  className = "",
}: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    setUploading(true);
    const toastId = toast.loading("Uploading image...");

    try {
      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onUpload(data.url);
      setShowUrlInput(false);
      toast.success("Image uploaded!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      });
      setPreview(currentImage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!urlValue.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(urlValue);
      onUpload(urlValue);
      setPreview(urlValue);
      setShowUrlInput(false);
      setUrlValue("");
      toast.success("Image URL set");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!preview ? (
        <div className="space-y-2">
          <div
            className="relative w-full h-32 sm:h-40 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500/50 transition cursor-pointer overflow-hidden bg-white/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs">Click to upload banner</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {showUrlInput ? "Hide URL input" : "Or enter image URL instead"}
          </button>

          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition text-sm"
              >
                Set URL
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden">
          <Image
            src={preview}
            alt="Banner preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(undefined);
                onUpload("");
                setUrlValue("");
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <p className="text-xs text-white/40">
        Recommended: 1200x400 pixels, max 5MB
      </p>
    </div>
  );
}
