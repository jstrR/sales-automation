import { Context, DefaultState, ParameterizedContext, Next } from "koa";
import { IRouterParamContext } from "koa-router";
import qs from 'qs';
import { z } from "zod";

export type RContext = ParameterizedContext<
  DefaultState,
  Context & IRouterParamContext<DefaultState, Context>
>;

export const getParsedVacanciesValidationSchema = z.object({
  vacancies: z.array(z.string()),
  skillsKeywords: z.array(z.string()).optional(),
  positionRate: z.union([z.number(), z.string()]),
  groupRate: z.union([z.number(), z.string()]),
  keySectorsRate: z.union([z.number(), z.string()]),
  functionalExpertiseRate: z.union([z.number(), z.string()]),
  skillsRate: z.union([z.number(), z.string()]),
  englishRate: z.union([z.number(), z.string()]),
  staffPlanningDuration: z.number()
});

const searchKeyword = z.record(z.array(z.string()));

export const getParsedTGVacanciesValidationSchema = z.object({
  searchKeywords: searchKeyword.optional(),
  skillsKeywords: z.array(z.string()).optional(),
  positionRate: z.union([z.number(), z.string()]),
  groupRate: z.union([z.number(), z.string()]),
  keySectorsRate: z.union([z.number(), z.string()]),
  functionalExpertiseRate: z.union([z.number(), z.string()]),
  skillsRate: z.union([z.number(), z.string()]),
  englishRate: z.union([z.number(), z.string()]),
  staffPlanningDuration: z.number()
});

export const postMatchmakeValidationSchema = getParsedVacanciesValidationSchema;
export const postMatchmakeTgValidationSchema = getParsedTGVacanciesValidationSchema;

export const getParsedVacanciesValidation = async (ctx: RContext, next: Next) => {
  try {
    ctx.parsedQuery = qs.parse(ctx.request.querystring);
    getParsedVacanciesValidationSchema.parse(ctx.parsedQuery);
    next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      ctx.body = e.issues;
      ctx.status = 400;
    }
  }
};

export const postParsedVacanciesValidation = async (ctx: RContext, next: Next) => {
  try {
    const parsedBody = JSON.parse(ctx.request.body);
    getParsedVacanciesValidationSchema.parse(parsedBody);
    ctx.request.body = parsedBody;
    next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      ctx.body = e.issues;
      ctx.status = 400;
    }
  }
};

export const postMatchmakeValidation = async (ctx: RContext, next: Next) => {
  try {
    const parsedBody = JSON.parse(ctx.request.body);
    postMatchmakeValidationSchema.parse(parsedBody);
    ctx.request.body = parsedBody;
    const { positionRate, groupRate, keySectorsRate, functionalExpertiseRate, skillsRate, englishRate, staffPlanningDuration } = parsedBody;
    ctx.state.staffPlanningDuration = staffPlanningDuration;
    ctx.state.matchmakeRates = { positionRate, groupRate, keySectorsRate, functionalExpertiseRate, skillsRate, englishRate };
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      ctx.body = e.issues;
      ctx.status = 400;
    }
  }
};

export const postMatchmakeTgValidation = async (ctx: RContext, next: Next) => {
  try {
    const parsedBody = JSON.parse(ctx.request.body);
    postMatchmakeTgValidationSchema.parse(parsedBody);

    ctx.request.body = parsedBody;
    const { positionRate, groupRate, keySectorsRate, functionalExpertiseRate, skillsRate, englishRate, searchKeywords, staffPlanningDuration } = parsedBody;
    ctx.state.matchmakeRates = { positionRate, groupRate, keySectorsRate, functionalExpertiseRate, skillsRate, englishRate };
    ctx.state.staffPlanningDuration = staffPlanningDuration;
    ctx.state.searchKeywords = searchKeywords;
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      ctx.body = e.issues;
      ctx.status = 400;
    }
  }
};
