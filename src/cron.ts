import cron from "node-cron";
import axios from "axios";

import { authTimebase, getStaffPlaningList, getUnderCapacityUsers } from "./timebase/model";
import { getTgMatchmakedUsers, getSitesMatchmakedUsers, addVacanciesToHubspot } from "./vacancies/model";

import parserConfig from './parserConfig.json';

export const crontimeBaseApi = axios.create({
  baseURL: 'https://www.timebase.app/api/v1'
});

cron.schedule(parserConfig.cron, async () => {
  try {
    console.log('START createHubspotDeals job');

    await authTimebase(crontimeBaseApi);
    const usersWithCapacity = await getStaffPlaningList(crontimeBaseApi);
    const usersUnderCapacity = await getUnderCapacityUsers(crontimeBaseApi, usersWithCapacity);
    const [tgParsedChannels, sitesParsedVacancies] = await Promise.allSettled([getTgMatchmakedUsers({ usersUnderCapacity }), getSitesMatchmakedUsers({ usersUnderCapacity })]);
    const createdDeals = await addVacanciesToHubspot({
      tgParsedChannels: tgParsedChannels.status === 'fulfilled' ? tgParsedChannels.value : [],
      sitesParsedVacancies: sitesParsedVacancies.status === 'fulfilled' ? sitesParsedVacancies.value : []
    });

    console.log(`END createHubspotDeals job. Created deals: ${createdDeals.created}`);
  } catch (e) {
    console.log(e);
  }
});
