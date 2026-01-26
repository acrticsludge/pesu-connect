export type EventTag = "technical" | "cultural" | "sports";

export type Campus = {
  name: string;
  code: "EC" | "RR";
};

export type Club = {
  name: string;
  slug: string;
};

export type BannerImage = {
  url: string;
  alt: string;
};

export type Event = {
  _id: string;
  title: string;
  shortDescription: string;
  description: string;
  registrationDeadline: string;
  eventDate: string;
  venue: string;
  campus: Campus;
  club: Club;
  domains: string[];
  tags: EventTag[];
  isPinned: boolean;
  isActive: boolean;
  bannerImage: BannerImage;
  createdAt: string;
  updatedAt: string;
};
