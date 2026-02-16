import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    srn: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
    },
    profilePic: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default models.User || model("User", UserSchema);
