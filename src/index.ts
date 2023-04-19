import Koa from 'koa';
import Router from "@koa/router";
import { DefaultState, Context } from "koa";
import { koaBody } from "koa-body";
import koaCors from "@koa/cors";
import compose from "koa-compose";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";

import * as logger from "koa-logger";
import * as json from "koa-json";

import { addVacanciesToHubspotMiddleware, getParsedMatchmakedUsers, getParsedVacancies, getSitesMatchmakedUsersMiddleware, getTgMatchmakedUsersMiddleware } from './vacancies';
import { postMatchmakeValidation, postMatchmakeTgValidation } from './vacancies/validation';
import { authTimebaseMiddleware, getStaffPlaningListMiddleware, getUnderCapacityUsersMiddleware } from './timebase';
import { getStaffPlaningListValidation } from './timebase/validation';
import { getServerConfig } from './config';

import { initHubspotConnection } from './hubspot';
import { initTGConnection } from './tg';

import './cron';

require('dotenv').config();
dayjs.extend(weekday);

// logger
const app = new Koa();
const router = new Router<DefaultState, Context>();

app.use(koaBody());

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

initTGConnection();
initHubspotConnection();

const timebaseMiddleware = compose([authTimebaseMiddleware, getStaffPlaningListMiddleware]);

router.post('/vacancies/matchmake', postMatchmakeValidation, getParsedVacancies, timebaseMiddleware, getUnderCapacityUsersMiddleware, getParsedMatchmakedUsers);
router.post('/vacancies/matchmake-tg', postMatchmakeTgValidation, timebaseMiddleware, getUnderCapacityUsersMiddleware, getTgMatchmakedUsersMiddleware);
router.post('/vacancies/matchmake-sites', postMatchmakeTgValidation, timebaseMiddleware, getUnderCapacityUsersMiddleware, getSitesMatchmakedUsersMiddleware);
router.post('/vacancies/create-hubspot', postMatchmakeTgValidation, timebaseMiddleware, getUnderCapacityUsersMiddleware, getTgMatchmakedUsersMiddleware, getSitesMatchmakedUsersMiddleware, addVacanciesToHubspotMiddleware);
router.get('/timebase/staff-planing', getStaffPlaningListValidation, timebaseMiddleware);
router.get('/config', getServerConfig);

app.use(koaCors());
app.use(router.routes());

app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

app.listen(
  process.env.PORT || 8080,
  () =>
    console.info(
      `The Application has started successfully on port ${process.env.PORT || 8080
      }.\n`,
    ),
);
