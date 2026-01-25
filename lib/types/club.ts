export type ClubRank = {
  name: string;
  level: number;
};

export type ClubMemberRef = {
  srn: string;
  rank: string;
};

export type ClubDomain = {
  name: string;
  description?: string;
  domainLeads: ClubMemberRef[];
  members: ClubMemberRef[];
};

export type StaffCoordinator = {
  name: string;
  department: string;
};

export type ClubBanner = {
  url: string;
  alt?: string;
};

export type Club = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  foundedOn: string;
  banner?: ClubBanner;
  instagram?: string;
  ranks: ClubRank[];
  clubLeads: ClubMemberRef[];
  domains: ClubDomain[];
  staffCoordinator?: StaffCoordinator;
  createdAt: string;
  updatedAt: string;
};
