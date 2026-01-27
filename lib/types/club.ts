type RankUserRef = {
  srn: string;
};

export type ClubRank = {
  name: string;
  level: number;
  users: RankUserRef[];
};

export type DomainRank = {
  name: string;
  level: number;
  users: RankUserRef[];
};

export type ClubDomain = {
  name: string;
  description?: string;
  ranks: DomainRank[];
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
  shortDescription?: string;
  fullDescription?: string;

  foundedOn: string;

  banner?: ClubBanner;
  instagram?: string;

  isRecruiting: boolean;
  recruitingLink?: string;

  ranks: ClubRank[];
  domains: ClubDomain[];

  staffCoordinator?: StaffCoordinator;

  createdAt: string;
  updatedAt: string;
};
