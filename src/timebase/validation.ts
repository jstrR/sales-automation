import { Context, DefaultState, ParameterizedContext, Next } from "koa";
import { IRouterParamContext } from "koa-router";
import qs from 'qs';
import { z } from "zod";

export type RContext = ParameterizedContext<
  DefaultState,
  Context & IRouterParamContext<DefaultState, Context>
>;

export const getStaffPlaningListValidation = async (ctx: RContext, next: Next) => {
  try {
    ctx.state.timebase = qs.parse(ctx.request.querystring);
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      ctx.body = e.issues;
      ctx.status = 400;
    }
  }
};
