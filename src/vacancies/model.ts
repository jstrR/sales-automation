import { EDealAnalyticsSource, ELeadSource, ELeadSourceDrillDown1 } from './../hubspot/lib';
import parserConfig from '../parserConfig.json';

import { getSavedTgVacanciesIds, getTgVacancies, saveTgVacanciesIds } from "../tg";
import { initialChannels } from '../tg/config';

import { getProjectOustaffingVacancies } from '../sites';
import { type TParsedSiteVacancy } from '../sites/lib';

import { createDeals } from "../hubspot";
import { EDealCurrencyCode, EDealPipeline, EDealStage } from "../hubspot/lib";

import { type TStaffPlaningUser } from '../timebase/lib';

import { clearVacanyText, findTags, matchKeywords, matchmakeUsers, replacePositionsMappings, type TMatchmakeRates, type TTgParsedChannels } from "./lib";

export const getTgMatchmakedUsers = async ({
  usersUnderCapacity,
  matchmakeRates,
  skillsKeywords,
  searchKeywords
}: {
  usersUnderCapacity: TStaffPlaningUser[];
  matchmakeRates?: TMatchmakeRates;
  skillsKeywords?: string[];
  searchKeywords?: { [key: string]: string[]; };
}) => {
  try {
    let parsedChannels: TTgParsedChannels[] = [];

    const keywords = skillsKeywords || [];
    const tgVacancies = await getTgVacancies(Object.keys(parserConfig.tg.channels) || initialChannels, searchKeywords || parserConfig.tg.channels || {});

    if (tgVacancies.length) {
      parsedChannels = tgVacancies.map(tgVacancy => ({
        ...tgVacancy,
        vacancies: tgVacancy.vacancies.map(vacancy => {
          const cleanedVacancy = replacePositionsMappings(clearVacanyText(vacancy.message || '').toLowerCase());
          const parsedVacancy = {
            text: vacancy.message || '',
            cleanText: cleanedVacancy,
            tags: findTags(cleanedVacancy),
            matchedKeywords: matchKeywords(cleanedVacancy, keywords),
            users: matchmakeUsers(usersUnderCapacity, cleanedVacancy, matchmakeRates) || [],
            messageId: vacancy.id,
            chatId: tgVacancy.chatId,
            chatName: tgVacancy.chatName,
            bot: tgVacancy.bot,
            private: tgVacancy.private,
            id: `${tgVacancy.chatId}-${vacancy.id}`,
            type: 'telegram' as const
          };
          return parsedVacancy;
        }).filter(vacancy => !!vacancy.users.length),
        keywords,
      }));
    }

    return parsedChannels;
  } catch (e) {
    throw new Error(e as any);
  }
};

export const getSitesMatchmakedUsers = async ({
  usersUnderCapacity,
  matchmakeRates,
  skillsKeywords,
  searchKeywords
}: {
  usersUnderCapacity: TStaffPlaningUser[];
  matchmakeRates?: TMatchmakeRates;
  skillsKeywords?: string[];
  searchKeywords?: { [key: string]: string[]; };
}) => {
  try {
    let parsedVacancies: TParsedSiteVacancy[] = [];

    const keywords = skillsKeywords || [];
    const sitesVacancies = await getProjectOustaffingVacancies({ searchKeywords: searchKeywords || parserConfig.sites || {} });

    if (sitesVacancies.vacancies?.length) {
      parsedVacancies = [{
        siteId: sitesVacancies.siteId,
        vacancies: sitesVacancies.vacancies.map(siteVacancy => {
          const cleanedVacancy = replacePositionsMappings(clearVacanyText(siteVacancy.descriptionPlain || '').toLowerCase());
          const parsedVacancy = {
            ...siteVacancy,
            text: siteVacancy.descriptionPlain || '',
            cleanText: cleanedVacancy,
            tags: findTags(cleanedVacancy),
            matchedKeywords: matchKeywords(cleanedVacancy, keywords),
            users: matchmakeUsers(usersUnderCapacity, cleanedVacancy, matchmakeRates) || []
          };
          return parsedVacancy;
        }).filter(vacancy => !!vacancy.users.length),
        keywords
      }];
    }

    return parsedVacancies;
  } catch (e) {
    throw new Error(e as any);
  }
};

export const addVacanciesToHubspot = async ({
  tgParsedChannels,
  sitesParsedVacancies
}: {
  tgParsedChannels?: TTgParsedChannels[];
  sitesParsedVacancies?: TParsedSiteVacancy[];
}) => {
  try {
    if (tgParsedChannels?.length || sitesParsedVacancies?.length) {
      const savedVacanciesIds = await getSavedTgVacanciesIds();
      const tgVacanciesToCreate = tgParsedChannels?.flatMap(tgVacancy => tgVacancy.vacancies.filter(vacancy => savedVacanciesIds.indexOf(vacancy.id.toString()) < 0)) || [];
      const tgDealsToCreate = tgVacanciesToCreate.map(vacancy => ({
        properties: {
          deal_currency_code: EDealCurrencyCode.eur,
          pipeline: EDealPipeline.outstaffing,
          dealstage: EDealStage.leadIn,
          dealname: `${vacancy.chatName} - ${vacancy.matchedKeywords.join(' - ')} - ${vacancy.messageId}`,
          description: 'Automatically generated deal',
          hs_analytics_source: EDealAnalyticsSource.otherCampaigns,
          lead_source: ELeadSource.outstaffRequestParsing,
          lead_source_drill_down_1: ELeadSourceDrillDown1.tg,
          lead_source_drill_down_2: vacancy.chatName
        },
        users: vacancy.users.slice(0, 5),
        link: vacancy.private ? `https://t.me/c/${vacancy.chatName}/${vacancy.messageId}` : `https://t.me/${vacancy.chatName}/${vacancy.messageId}`,
        vacancyText: vacancy.text
      }));

      const sitesVacanciesToCreate = sitesParsedVacancies?.flatMap(siteVacancy => siteVacancy.vacancies.filter(vacancy => savedVacanciesIds.indexOf(vacancy.id.toString()) < 0)) || [];
      const sitesDealsToCreate = sitesVacanciesToCreate.map(vacancy => ({
        properties: {
          deal_currency_code: EDealCurrencyCode.eur,
          pipeline: EDealPipeline.outstaffing,
          dealstage: EDealStage.leadIn,
          dealname: `${vacancy.siteId} - ${vacancy.matchedKeywords.join(' - ')} - ${vacancy.vacancyId}`,
          description: 'Automatically generated deal',
          hs_analytics_source: EDealAnalyticsSource.otherCampaigns,
          lead_source: ELeadSource.outstaffRequestParsing,
          lead_source_drill_down_1: ELeadSourceDrillDown1.site,
          lead_source_drill_down_2: vacancy.siteId
        },
        users: vacancy.users.slice(0, 5),
        link: `https://projects.it-outstaffing.com/en/${vacancy.slug}`,
        vacancyText: vacancy.description
      }));

      const createdDeals = await createDeals(tgDealsToCreate.concat(sitesDealsToCreate));
      await saveTgVacanciesIds(tgVacanciesToCreate.reduce((prev, curr) => [...prev, `${curr.id}`], [] as string[]).concat(sitesVacanciesToCreate.reduce((prev, curr) => [...prev, `${curr.id}`], [] as string[])));
      return { created: createdDeals.length };
    }
    return { created: 0 };
  } catch (e) {
    throw new Error(e as any);
  }
};
