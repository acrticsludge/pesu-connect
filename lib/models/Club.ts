import mongoose from "mongoose";

const RankUserRefSchema = new mongoose.Schema(
  {
    srn: { type: String, required: true },
  },
  { _id: false },
);

const ClubRankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true },
    users: { type: [RankUserRefSchema], default: [] },
  },
  { _id: false },
);

const DomainRankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true },
    users: { type: [RankUserRefSchema], default: [] },
  },
  { _id: false },
);

const DomainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    ranks: { type: [DomainRankSchema], default: [] },
  },
  { _id: false },
);

const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    shortDescription: { type: String, maxlength: 150 },
    fullDescription: String,

    foundedOn: { type: Date, required: true },

    banner: {
      url: String,
      alt: String,
    },

    instagram: String,

    isRecruiting: {
      type: Boolean,
      default: false,
      index: true,
    },

    recruitingLink: {
      type: String,
      required: function () {
        return this.isRecruiting;
      },
    },

    ranks: { type: [ClubRankSchema], default: [] },

    domains: { type: [DomainSchema], default: [] },

    staffCoordinator: {
      name: String,
      department: String,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Club || mongoose.model("Club", ClubSchema);
