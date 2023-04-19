import axios, { AxiosResponse } from "axios";
import dayjs from "dayjs";

import { matchKeywords } from "../vacancies/lib";
import { type TOutstaffingVacancies, type TOutstaffingVacancy } from "./lib";

const projectOutstaffingURL = 'https://proxy.talentscan.pro/publicVacancies';
const projectOutstaffingId = 'projects.it-outstaffing';

export const getProjectOustaffingVacancies = async (
  { sortField = 'createdAt', sortDirection = 'desc', searchKeywords }:
    { sortField?: string; sortDirection?: 'asc' | 'desc'; searchKeywords: { [key: string]: string[]; }; }
) => {
  try {
    const threeDaysAgo = dayjs().day(-2);

    const response: PromiseSettledResult<AxiosResponse<TOutstaffingVacancies[], any>>[] = await Promise.allSettled([
      axios.get(projectOutstaffingURL, { params: { pageNumber: 1, sortField, sortDirection, portalIds: 2, vacancyStatuses: [2, 5, 12, 13, 14, 15] } }),
      axios.get(projectOutstaffingURL, { params: { pageNumber: 2, sortField, sortDirection, portalIds: 2, vacancyStatuses: [2, 5, 12, 13, 14, 15] } }),
      axios.get(projectOutstaffingURL, { params: { pageNumber: 3, sortField, sortDirection, portalIds: 2, vacancyStatuses: [2, 5, 12, 13, 14, 15] } }),
    ]);

    const responseData = response.filter(result => result.status === 'fulfilled').reduce((prev, curr) => prev.concat((curr as any).value.data.items), [] as TOutstaffingVacancy[]);
    const vacancies = responseData.filter(
      (vacancy) => {
        let addToVacancies = true;
        const channelKeywords = searchKeywords[projectOutstaffingId];
        if (channelKeywords && vacancy.descriptionPlain) {
          addToVacancies = !!matchKeywords(vacancy.descriptionPlain, channelKeywords).length;
        }
        return addToVacancies && threeDaysAgo.diff(dayjs(vacancy.createdAt)) < 0;
      }
    ).map(vacancy => ({
      ...vacancy,
      type: 'site' as const,
      siteId: projectOutstaffingId,
      vacancyId: vacancy.id,
      id: `${projectOutstaffingId}-${vacancy.id}`
    }));

    const siteVacancies = {
      type: 'site' as const,
      siteId: projectOutstaffingId,
      vacancies: vacancies || null,
    };

    return siteVacancies;
  } catch (e) {
    console.log(e);
    return {
      type: 'site' as const,
      siteId: projectOutstaffingId,
      vacancies: null,
    };
  }
};