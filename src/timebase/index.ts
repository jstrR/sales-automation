import { Context, Next, ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";
import axios from "axios";

import { authTimebase, getStaffPlaningList, getUnderCapacityUsers } from './model';
import { type TStaffPlaningUser } from "./lib";
import { type TParsedVacancies } from "../vacancies/lib";

interface State {
  parsedVacancies?: TParsedVacancies;
  usersWithCapacity?: TStaffPlaningUser[];
  usersUnderCapacity?: TStaffPlaningUser[];
  staffPlanningDuration: number;
}

export type RContext = ParameterizedContext<
  State,
  Context & IRouterParamContext<State, Context>
>;

export const timeBaseApi = axios.create({
  baseURL: 'https://www.timebase.app/api/v1'
});

export const authTimebaseMiddleware = async (ctx: RContext, next: Next) => {
  try {
    if (!timeBaseApi.defaults.headers.common["x-request-token"]) {
      const token = await authTimebase(timeBaseApi);
      ctx.state.timebase = { token };
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

export const getStaffPlaningListMiddleware = async (ctx: RContext, next: Next) => {
  try {
    if (timeBaseApi.defaults.headers.common["x-request-token"]) {
      const usersWithCapacity = await getStaffPlaningList(timeBaseApi, ctx.state.staffPlanningDuration);

      ctx.state.usersWithCapacity = usersWithCapacity;
      ctx.body = usersWithCapacity;
      await next();
      delete timeBaseApi.defaults.headers.common["x-request-token"];
    } else {
      ctx.body = null;
    }
  } catch (e) {
    console.log(e);
    ctx.body = null;
    ctx.status = 400;
  }
};

export const getUnderCapacityUsersMiddleware = async (ctx: RContext, next: Next) => {
  try {
    if (ctx.state.usersWithCapacity) {
      const mergedUsers = await getUnderCapacityUsers(timeBaseApi, ctx.state.usersWithCapacity);

      ctx.state.usersUnderCapacity = mergedUsers;
      ctx.body = mergedUsers;
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
