import mongoose from "mongoose";

const MemberRefSchema = new mongoose.Schema(
  {
    srn: { type: String, required: true },
    rank: { type: String, required: true },
  },
  { _id: false },
);

const RankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true },
  },
  { _id: false },
);

const DomainRankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true },
  },
  { _id: false },
);

const DomainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    ranks: [DomainRankSchema],

    domainLeads: [MemberRefSchema],
    members: [MemberRefSchema],
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
    },

    ranks: [RankSchema],

    clubLeads: [MemberRefSchema],

    domains: [DomainSchema],

    staffCoordinator: {
      name: String,
      department: String,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Club || mongoose.model("Club", ClubSchema);
