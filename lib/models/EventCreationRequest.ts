import mongoose, { Schema, Types } from "mongoose";

const EventCreationRequestSchema = new Schema(
  {
    eventData: {
      name: { type: String, required: true, trim: true },
      shortDescription: { type: String, required: true },
      fullDescription: { type: String, required: true },

      bannerUrl: { type: String, required: true },

      involvedClubs: [
        {
          club: { type: Types.ObjectId, ref: "Club", required: true },
          domain: { type: Types.ObjectId, required: true },
        },
      ],

      tag: { type: String, required: true },
      category: {
        type: String,
        enum: ["TECHNICAL", "CULTURAL", "SPORTS"],
        required: true,
      },

      registration: {
        isRegister: { type: Boolean, required: true },
        deadline: Date,
        link: String,
        methodText: String,
      },

      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },

      venue: { type: String, required: true },
      campus: {
        type: String,
        enum: ["EC", "RR"],
        required: true,
      },

      isPinned: { type: Boolean, default: false },
    },

    requestedBy: {
      userId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      srn: String,
      email: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },

    handledBy: {
      adminId: { type: Types.ObjectId, ref: "User" },
      name: String,
    },

    adminRemark: String,
  },
  { timestamps: true },
);

export default mongoose.models.EventCreationRequest ||
  mongoose.model("EventCreationRequest", EventCreationRequestSchema);
