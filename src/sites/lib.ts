import { TStaffPlaningUser } from "../timebase/lib";

export type TOutstaffingVacancy = {
  createdAt: string;
  currentStatus: string;
  description: string;
  id: number | string;
  name: string;
  slug: string;
  descriptionPlain: string;
  type: 'site';
  siteId: string;
  vacancyId: string | number;
  assignedId: {
    id: number;
    firstName: string;
    lastName: string;
    image: string;
    shortName: string;
    email: string;
    skype: string;
    telephone: string;
    lastLogin: string;
  };
};

export type TSiteVacancy = TOutstaffingVacancy & {
  text: string;
  cleanText: string;
  tags: string[];
  matchedKeywords: string[];
  users: TStaffPlaningUser[];
};

export type TOutstaffingVacancies = {
  totalCount: number;
  items: TOutstaffingVacancy[];
};

export type TParsedSiteVacancy = {
  vacancies: TSiteVacancy[];
  siteId: string;
  keywords: string[];
};
