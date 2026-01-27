import mongoose, { Schema } from "mongoose";

const ClubCreationRequestSchema = new Schema(
  {
    clubData: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      shortDescription: {
        type: String,
        required: true,
      },
      foundedOn: {
        type: Date,
        required: true,
      },
      bannerUrl: {
        type: String,
      },
      instagram: {
        type: String,
      },
      staffName: {
        type: String,
        required: true,
      },
      staffDepartment: {
        type: String,
        required: true,
      },
    },

    requestedBy: {
      userId: {
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
      email: {
        type: String,
        required: true,
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },

    handledBy: {
      adminId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
      },
    },

    adminRemark: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.ClubCreationRequest ||
  mongoose.model("ClubCreationRequest", ClubCreationRequestSchema);
