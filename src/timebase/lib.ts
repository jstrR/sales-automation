import dayjs from 'dayjs';

type TCapacity = {
  date: string;
  value: number;
};

export type TStaffPlaningUser = {
  userId: number;
  fullname: string;
  occupation: string | null;
  capacity: TCapacity[],
  projects: {
    projectId: number;
    hours: TCapacity[];
  }[];
  staffingTeam?: {
    id?: number;
  };
  actualCapacity: number;
  plannedCapacity: number;
  underCapacity: number;
  positionRate: number;
  location: string;
  groupRate: number;
  keySectorsRate: number;
  functionalExpertiseRate: number;
  stackGroup: string;
  keySectors: string;
  functionalExpertise: string;
  englishRate: number;
  internalRate: number;
  externalRate: number;
  salary: number;
  matchmakeRate?: number;
  skills: TTimebaseUserSkill[];
  languages: TTimebaseUserLanguage[];
  englishLevel: { label: string; value: number; };
};

export type TTimebaseUserDetails = {
  count: number;
  data: {
    id: number;
    username: string;
    cv: string | null;
    location: string;
    staffing_team: {
      id: number;
      title: string;
      titleShort: string;
    };
    personalInformation: {
      id: number;
      summary: string;
      keySectors: string;
      functionalExpertise: string;
    };
  }[];
};

export type TTimebaseUserLanguage = {
  language: {
    id: number;
    title: string;
  };
  listeningLevel: number;
  speakingLevel: number;
  writingLevel: number;
  readingLevel: number;
  type: 1;
};

export type TTimebaseUserSkill = {
  skillLevel: number;
  title: string;
  type: 2;
};

export type TTimebaseUserRate = {
  id: number;
  period: string;
  internal_rate: number;
  external_rate: number;
  salary: number;
  pricelist_position_title: string;
};

export type TTimebaseUserSkills = {
  count: number;
  data: (TTimebaseUserSkill | TTimebaseUserLanguage)[];
};

export type TTimebaseUserRates = {
  count: number;
  data: TTimebaseUserRate[];
};

export type TStaffPlaningResponse = {
  data: TStaffPlaningUser[];
  count: number;
};

const EnglishLevelLabels = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'C2',
  'C2-Native',
];

const EnglishLevelKeywords = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'elementary', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'english: upper', 'advanced', 'proficiency'];

const EnglishLabelLevels = {
  'A1': 0,
  'beginner': 0,
  'elementary': 0,
  'A2': 1,
  'pre-intermediate': 1,
  'B1': 2,
  'intermediate': 2,
  'B2': 3,
  'upper-intermediate': 3,
  'english: upper': 3,
  'C1': 4,
  'advanced': 4,
  'C2': 5,
  'proficiency': 5
};

export const calculateUserEnglishLevel = (lang?: TTimebaseUserLanguage) => {
  const langValue = Math.floor((Number(lang?.listeningLevel) + Number(lang?.speakingLevel) + Number(lang?.speakingLevel) + Number(lang?.writingLevel)) / 4);
  return { value: langValue || 0, label: EnglishLevelLabels[langValue] || EnglishLevelLabels[0] };
};

export const getStafPlanningListPeriods = (staffPlanningDuration?: number) => {
  const startWeekDate = dayjs().day(1);
  const isStartWeek = dayjs().day() === 1 || dayjs().day() === 2;
  const manualEndDate = (staffPlanningDuration || 0) * 7;

  const startDate = isStartWeek ? startWeekDate.format('YYYY-MM-DD') : startWeekDate.day(8).format('YYYY-MM-DD');
  const endDate = isStartWeek ? startWeekDate.day(manualEndDate || 28).format('YYYY-MM-DD') : startWeekDate.day(manualEndDate || 35).format('YYYY-MM-DD');

  return [startDate, endDate];
};

export const getUnderCapacityRate = ({ underCapacity, plannedCapacity }: { underCapacity: number, plannedCapacity: number; }) => underCapacity >= Math.floor(plannedCapacity / 2);

export const getUserPositionRate = ({ user, vacancy, vacancyLength }: { user: TStaffPlaningUser; vacancy: string; vacancyLength: number; }) => {
  let FCount = 0;
  const position: string[] = user.occupation?.split(' ').filter(value => !!value) || [];
  position.forEach(subPosition => vacancy.includes(subPosition.toLowerCase()) ? FCount += 1 : null);
  return (FCount / vacancyLength);
};

export const getUserGroupRate = ({ user, vacancy, vacancyLength }: { user: TStaffPlaningUser; vacancy: string; vacancyLength: number; }) => {
  let FCount = 0;
  const group: string[] = user.stackGroup?.split(' ').filter(value => !!value) || [];
  group.forEach(subGroup => vacancy.includes(subGroup.toLowerCase()) ? FCount += 1 : null);
  return (FCount / vacancyLength);
};

export const getUserKeySectorsRate = ({ user, vacancy, vacancyLength }: { user: TStaffPlaningUser; vacancy: string; vacancyLength: number; }) => {
  let FCount = 0;
  const keySectors: string[] = user.keySectors?.split(' ').filter(value => !!value) || [];
  keySectors.forEach(keySector => vacancy.includes(keySector.toLowerCase()) ? FCount += 1 : null);
  return (FCount / vacancyLength);
};

export const getUserFunctionalExpertiseRate = ({ user, vacancy, vacancyLength }: { user: TStaffPlaningUser; vacancy: string; vacancyLength: number; }) => {
  let FCount = 0;
  const functionalExpertise: string[] = user.functionalExpertise?.split(' ').filter(value => !!value) || [];
  functionalExpertise.forEach(subExpertise => vacancy.includes(subExpertise.toLowerCase()) ? FCount += 1 : null);
  return (FCount / vacancyLength);
};

export const getUserSkillsRate = ({ user, vacancy, vacancyLength }: { user: TStaffPlaningUser; vacancy: string; vacancyLength: number; }) => {
  let FCount = 0;
  let FFCount = 0;
  const splittedSkills: string[] = user.skills?.flatMap(skill => skill.title.split(' ').filter(value => !!value)) || [];

  splittedSkills.forEach(splittedSkill => vacancy.includes(splittedSkill.toLowerCase()) ? FCount += 1 : null);
  user.skills?.forEach(skill => vacancy.includes(skill.title.toLowerCase()) ? FFCount += 1 : null);

  return ((2 * FFCount + FCount) / (3 * vacancyLength));
};

export const getUserEnglishLevelRate = ({ user, vacancy }: { user: TStaffPlaningUser; vacancy: string; }) => {
  const engKeyword = vacancy.match(new RegExp(`(${EnglishLevelKeywords.join('|')})`));
  if (engKeyword?.[0]) {
    const c0 = user.englishLevel?.value - EnglishLabelLevels[(engKeyword?.[0] as string) as keyof typeof EnglishLabelLevels] || 0;
    return c0 === 0 ? 1 : c0;
  }
  return 0;
};
