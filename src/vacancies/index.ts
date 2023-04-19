import { Context, Next, ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";

import { type TStaffPlaningUser } from "../timebase/lib";
import { matchKeywords, clearVacanyText, findTags, matchmakeUsers, type TParsedVacancies, type TTgParsedChannels, type TMatchmakeRates, replacePositionsMappings } from "./lib";
import { type TParsedSiteVacancy } from "../sites/lib";

import { addVacanciesToHubspot, getSitesMatchmakedUsers, getTgMatchmakedUsers } from "./model";

interface State {
  parsedVacancies: TParsedVacancies;
  tgParsedChannels: TTgParsedChannels[];
  sitesParsedVacancies: TParsedSiteVacancy[];
  parsedQuery?: {
    keywords?: string[];
  };
  usersUnderCapacity?: TStaffPlaningUser[];
  matchmakeRates?: TMatchmakeRates;
}

export type RContext = ParameterizedContext<
  State,
  Context & IRouterParamContext<State, Context>
>;

export const getParsedVacancies = async (ctx: RContext, next: Next) => {
  try {
    if (ctx.parsedQuery) {
      const { vacancies, skillsKeywords }: { vacancies: string[]; skillsKeywords?: string[]; } = ctx.parsedQuery;
      ctx.body = {
        vacancies: vacancies.map(vacany => ({
          text: vacany, cleanText: replacePositionsMappings(clearVacanyText(vacany).toLowerCase()),
          tags: findTags(vacany),
          matchedKeywords: matchKeywords(vacany, skillsKeywords)
        })),
        keywords: skillsKeywords
      };
      ctx.status = 200;
    } else if (ctx.request.body) {
      const { vacancies, skillsKeywords }: { vacancies: string[]; skillsKeywords?: string[]; } = ctx.request.body;
      const parsedVacancies = {
        vacancies: vacancies.map(vacany => ({
          text: vacany,
          cleanText: replacePositionsMappings(clearVacanyText(vacany).toLowerCase()),
          tags: findTags(vacany),
          matchedKeywords: matchKeywords(vacany, skillsKeywords),
          type: 'custom' as const
        })),
        keywords: skillsKeywords,
      };
      ctx.state.parsedVacancies = parsedVacancies;
      ctx.body = parsedVacancies;
      ctx.status = 200;
      await next();
    } else {
      ctx.status = 400;
    }
  } catch (e) {
    console.log(e);
    ctx.status = 400;
  }
};

export const getParsedMatchmakedUsers = async (ctx: RContext, next: Next) => {
  try {
    if (ctx.state.usersUnderCapacity && ctx.state.parsedVacancies && !Array.isArray(ctx.state.parsedVacancies)) {
      ctx.state.parsedVacancies.vacancies = ctx.state.parsedVacancies.vacancies.map((parsedVacancy) => {
        parsedVacancy.users = matchmakeUsers(ctx.state.usersUnderCapacity!, parsedVacancy.cleanText, ctx.state.matchmakeRates);
        return parsedVacancy;
      }).filter(vacancy => !!vacancy.users?.length);
      ctx.body = ctx.state.parsedVacancies;
    } else {
      ctx.body = null;
    }
    await next();
  } catch (e) {
    console.log(e);
    ctx.body = null;
    ctx.status = 400;
  }
};

export const getTgMatchmakedUsersMiddleware = async (ctx: RContext, next: Next) => {
  try {
    if (ctx.state.usersUnderCapacity?.length) {
      const parsedChannels = await getTgMatchmakedUsers({
        usersUnderCapacity: ctx.state.usersUnderCapacity,
        matchmakeRates: ctx.state.matchmakeRates,
        searchKeywords: ctx.state.searchKeywords,
        skillsKeywords: ctx.request.body?.skillsKeywords
      });

      ctx.state.tgParsedChannels = parsedChannels;
      ctx.body = parsedChannels;
    } else {
      ctx.body = null;
    }
    await next();
  } catch (e) {
    console.log(e);
    ctx.body = null;
    ctx.status = 400;
  }
};

export const getSitesMatchmakedUsersMiddleware = async (ctx: RContext, next: Next) => {
  try {
    if (ctx.state.usersUnderCapacity?.length) {
      const parsedVacancies = await getSitesMatchmakedUsers({
        usersUnderCapacity: ctx.state.usersUnderCapacity,
        matchmakeRates: ctx.state.matchmakeRates,
        searchKeywords: ctx.state.searchKeywords,
        skillsKeywords: ctx.request.body?.skillsKeywords
      });

      ctx.state.sitesParsedVacancies = parsedVacancies;
      ctx.body = parsedVacancies;
    } else {
      ctx.body = null;
    }
    await next();
  } catch (e) {
    console.log(e);
    ctx.body = null;
    ctx.status = 400;
  }
};

export const addVacanciesToHubspotMiddleware = async (ctx: RContext, next: Next) => {
  try {
    if (ctx.state.tgParsedChannels?.length || ctx.state.sitesParsedVacancies?.length) {
      const createdDeals = await addVacanciesToHubspot({ tgParsedChannels: ctx.state.tgParsedChannels, sitesParsedVacancies: ctx.state.sitesParsedVacancies });
      ctx.body = createdDeals;
    }
    await next();
  } catch (e) {
    console.log(e);
    ctx.body = null;
    ctx.status = 400;
  }
};
