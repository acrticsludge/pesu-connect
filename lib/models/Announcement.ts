import mongoose, { Schema, model, models } from "mongoose";

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "patch" | "event";
  createdBy: {
    _id: string;
    name: string;
    srn: string;
  };
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  expiresAt?: Date;
  version?: string;
}

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "patch", "event"],
      default: "info",
    },
    createdBy: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      srn: {
        type: String,
        required: true,
      },
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    version: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

AnnouncementSchema.index({ pinned: -1, createdAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.Announcement || model("Announcement", AnnouncementSchema);
