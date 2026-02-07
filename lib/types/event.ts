export type EventCategory = "TECHNICAL" | "CULTURAL" | "SPORTS";

export type EventTag =
  | "WORKSHOP"
  | "HACKATHON"
  | "SEMINAR"
  | "COMPETITION"
  | "MEETUP"
  | "OTHER";

export type RegistrationInfo = {
  isRegister: boolean;
  deadline?: Date;
  link?: string;
  methodText?: string;
};

export type InvolvedClub = {
  club: string;
  domains: string[];
};

export interface BaseEventData {
  name: string;
  shortDescription: string;
  fullDescription: string;

  bannerUrl: string;

  involvedClubs: InvolvedClub[];

  categories: EventCategory[];
  tags: EventTag[];

  registration: RegistrationInfo;

  startDate: Date;
  endDate: Date;

  venue: string;
  campus: "EC" | "RR";

  isPinned: boolean;
}
