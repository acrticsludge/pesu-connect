import mongoose, { Schema, model, models } from "mongoose";

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
    },

    registrationDeadline: {
      type: Date,
      required: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    venue: {
      type: String,
      required: true,
    },

    campus: {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        enum: ["EC", "RR"],
        required: true,
      },
    },

    club: {
      name: {
        type: String,
        required: true,
      },
      slug: {
        type: String,
        required: true,
      },
    },

    tags: {
      type: [String],
      enum: ["technical", "cultural", "sports"],
      default: [],
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    bannerImage: {
      url: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  },
);

export default models.Event || model("Event", EventSchema);
