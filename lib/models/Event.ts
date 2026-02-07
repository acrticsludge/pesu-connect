import mongoose, { Schema, Types } from "mongoose";

const EventSchema = new Schema(
  {
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },

    bannerUrl: { type: String, required: true },

    involvedClubs: [
      {
        club: {
          type: Schema.Types.ObjectId,
          ref: "Club",
          required: true,
        },
        domains: {
          type: [String],
          required: true,
          validate: {
            validator: (v: string[]) => v.length > 0,
            message: "At least one domain is required",
          },
        },
      },
    ],

    categories: {
      type: [String],
      enum: ["TECHNICAL", "CULTURAL", "SPORTS"],
      required: true,
    },

    tags: {
      type: [String],
      enum: [
        "WORKSHOP",
        "HACKATHON",
        "SEMINAR",
        "COMPETITION",
        "MEETUP",
        "OTHER",
      ],
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

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

EventSchema.index({ name: "text" });
EventSchema.index({ isPinned: -1, startDate: 1 });

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
