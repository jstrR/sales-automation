import { getUserPositionRate, getUserGroupRate, getUserKeySectorsRate, getUserFunctionalExpertiseRate, getUserSkillsRate, type TStaffPlaningUser, getUserEnglishLevelRate } from "../timebase/lib";

import parserConfig from '../parserConfig.json';

export const prepositionsAndArticlesList = ['aboard', 'about', 'above', 'across', 'after', 'against', 'along', 'amid', 'among', 'anti', 'around', 'as', 'at', 'before', 'behind', 'below',
  'beneath', 'beside', 'besides', 'between', 'beyond', 'but', 'by', 'concerning', 'considering', 'despite', 'down', 'during', 'except', 'excepting', 'excluding', 'following',
  'for', 'or', 'and', 'from', 'in', 'inside', 'into', 'like', 'minus', 'near', 'of', 'off', 'on', 'onto', 'opposite', 'outside', 'over', 'past', 'per', 'plus', 'regarding', 'round',
  'save', 'since', 'than', 'through', 'to', 'toward', 'towards', 'under', 'underneath', 'unlike', 'until', 'up', 'upon', 'versus', 'via', 'with', 'within', 'without', 'a', 'an', 'the'];

export type TParsedVacancy = {
  text: string;
  cleanText: string;
  tags: string[];
  matchedKeywords: string[];
  messageId?: string | number;
  users?: TStaffPlaningUser[];
  id?: string | number;
  type: 'custom';
};

export type TTgParsedVacancy = {
  text: string;
  cleanText: string;
  tags: string[];
  matchedKeywords: string[];
  messageId: string | number;
  chatId: string | number;
  chatName: string;
  bot: boolean;
  private: boolean;
  users: TStaffPlaningUser[];
  id: string | number;
  type: 'telegram';
};

export type TParsedVacancies = {
  vacancies: TParsedVacancy[];
  keywords?: string[];
};

export type TTgParsedChannels = {
  vacancies: TTgParsedVacancy[];
  chatId: number;
  chatName: string;
  keywords: string[];
};

export type TMatchmakeRates = {
  positionRate: number;
  groupRate: number;
  keySectorsRate: number;
  functionalExpertiseRate: number;
  skillsRate: number;
  englishRate: number;
};

export const matchKeywords = (text: string, keywords?: string[]) => keywords?.filter(keyword => text.toLowerCase().includes(keyword.toLowerCase())) || [];

export const clearVacanyText = (text: string) => text.replace(new RegExp('\\b(' + prepositionsAndArticlesList.join('|') + ')\\b', 'gi'), '');

export const findTags = (text: string) => text.split(' ').filter(word => word.startsWith('#'));

export const matchmakeUsers = (users: TStaffPlaningUser[], vacancy: string, rates?: TMatchmakeRates) => {
  const vacancyLength = vacancy.length;
  const filteredUsers = users.map((user) => {
    const englishRate = getUserEnglishLevelRate({ user, vacancy: vacancy });
    const positionRate = getUserPositionRate({ user, vacancy: vacancy, vacancyLength });
    const groupRate = getUserGroupRate({ user, vacancy: vacancy, vacancyLength });
    const keySectorsRate = getUserKeySectorsRate({ user, vacancy: vacancy, vacancyLength });
    const functionalExpertiseRate = getUserFunctionalExpertiseRate({ user, vacancy: vacancy, vacancyLength });
    const skillsRate = getUserSkillsRate({ user, vacancy: vacancy, vacancyLength });

    return {
      ...user,
      positionRate,
      groupRate,
      keySectorsRate,
      functionalExpertiseRate,
      skillsRate,
      englishRate,
      matchmakeRate: (positionRate * Number(rates?.positionRate || parserConfig.rates.matchmakePosition || 1))
        + (groupRate * Number(rates?.groupRate || parserConfig.rates.matchmakeGroup || 1))
        + (keySectorsRate * Number(rates?.keySectorsRate || parserConfig.rates.matchmakeKeySectors || 1))
        + (functionalExpertiseRate * Number(rates?.functionalExpertiseRate || parserConfig.rates.matchmakeFunctionalExpertise || 1))
        + (skillsRate * Number(rates?.skillsRate || parserConfig.rates.matchmakeSkills || 1))
        + (englishRate * Number(rates?.englishRate || parserConfig.rates.matchmakeEnglish || 1))
    };
  }).filter((user) => !!user.matchmakeRate && user.englishRate >= 0);
  filteredUsers.sort((prevUser, nextUser) => nextUser.matchmakeRate - prevUser.matchmakeRate);
  return filteredUsers;
};

export const replacePositionsMappings = (positions: string) => {
  let string = positions;
  for (const [key, value] of Object.entries(parserConfig.positionsMapping)) {
    const valuesToReplace = value.join('|');
    string = string.replaceAll(new RegExp(valuesToReplace, 'gi'), key);
  }

  return string;
};
