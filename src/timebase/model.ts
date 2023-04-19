import { AxiosInstance } from "axios";

import { replacePositionsMappings } from "../vacancies/lib";
import parserConfig from '../parserConfig.json';

import {
  getStafPlanningListPeriods,
  getUnderCapacityRate,
  calculateUserEnglishLevel,
  type TStaffPlaningUser,
  type TStaffPlaningResponse,
  type TTimebaseUserDetails,
  type TTimebaseUserSkills,
  type TTimebaseUserRates,
  type TTimebaseUserLanguage,
  type TTimebaseUserSkill,
} from "./lib";

export const authTimebase = async (api: AxiosInstance) => {
  try {
    const token = await (await api.get(`/request-token?grant_type=password&email=${process.env.TIMEBASE_USER_EMAIL}&password=${process.env.TIMEBASE_USER_PASSWORD}`)).data.token;
    api.defaults.headers.common["x-request-token"] = token;
    return token;
  } catch (e) {
    throw new Error(e as any);
  }
};

export const getStaffPlaningList = async (api: AxiosInstance, staffPlanningDuration?: number) => {
  try {
    const [startDate, endDate] = getStafPlanningListPeriods(staffPlanningDuration);

    const staffPlaningList: TStaffPlaningResponse = await (await api.get(`/staff-planing/hours/teams/?period_from=${startDate}&period_to=${endDate}&branch_group_id=19`)).data;

    const usersWithCapacity = staffPlaningList.data.filter(user => user.staffingTeam?.id && !(parserConfig.timebase.usersFilterOccupations || '').toLowerCase().match(user.occupation?.toLowerCase() || ''))
      .map((user) => {
        user.plannedCapacity = user.capacity.reduce((weekCapacity: number, nextWeek) => weekCapacity + nextWeek.value, 0);
        user.actualCapacity = user.projects.reduce((actualCapacity: number, project) => actualCapacity + project.hours.reduce((weekCapacity: number, nextWeek) => weekCapacity + nextWeek.value, 0), 0);
        user.underCapacity = user.plannedCapacity - user.actualCapacity;
        return user;
      });

    return usersWithCapacity;
  } catch (e) {
    throw new Error(e as any);
  }
};

export const getUnderCapacityUsers = async (api: AxiosInstance, usersWithCapacity: TStaffPlaningUser[]) => {
  try {
    const usersUnderCapacity = usersWithCapacity.filter((user) => getUnderCapacityRate({ underCapacity: user.underCapacity, plannedCapacity: user.plannedCapacity }));
    const [usersDetailsDataResponse, usersSkillsDataResponse, userRatesDataResponse] = await Promise.allSettled([
      Promise.allSettled(usersUnderCapacity.map(user => api.get(`/user/${user.userId}?_format=json`))),
      Promise.allSettled(usersUnderCapacity.map(user => api.get(`/user/${user.userId}/experiences/?_format=json`))),
      Promise.allSettled(usersUnderCapacity.map(user => api.get(`/user/rates/?user_id=${user.userId}`)))
    ]);

    const usersDetailsData: (TTimebaseUserDetails | null)[] = usersDetailsDataResponse.status === 'fulfilled' ? usersDetailsDataResponse.value?.map(res => res.status === 'fulfilled' ? res.value?.data || null : null) : [];
    const usersSkillsData: (TTimebaseUserSkills | null)[] = usersSkillsDataResponse.status === 'fulfilled' ? usersSkillsDataResponse.value?.map(res => res.status === 'fulfilled' ? res.value?.data || null : null) : [];
    const userRatesData: (TTimebaseUserRates | null)[] = userRatesDataResponse.status === 'fulfilled' ? userRatesDataResponse.value?.map(res => res.status === 'fulfilled' ? res.value?.data || null : null) : [];

    const mergedUsers: TStaffPlaningUser[] = usersUnderCapacity.map((user, i) => usersDetailsData[i]
      ? ({
        ...user,
        occupation: replacePositionsMappings(user.occupation || ''),
        location: usersDetailsData[i]?.data?.[0]?.location || '',
        stackGroup: replacePositionsMappings(usersDetailsData[i]?.data?.[0]?.staffing_team?.title || ''),
        keySectors: replacePositionsMappings(usersDetailsData[i]?.data?.[0]?.personalInformation?.keySectors || ''),
        functionalExpertise: replacePositionsMappings(usersDetailsData[i]?.data?.[0]?.personalInformation?.functionalExpertise || ''),
        skills: (usersSkillsData[i]?.data?.filter(skill => skill.type === 2 && skill.title) as TTimebaseUserSkill[]).map(skill => ({ ...skill, title: replacePositionsMappings(skill.title.toLowerCase() || '') })) || [],
        languages: usersSkillsData[i]?.data?.filter(skill => skill.type === 1 && skill.language) as TTimebaseUserLanguage[] || [],
        internalRate: userRatesData[i]?.data?.[0]?.internal_rate || 0,
        externalRate: userRatesData[i]?.data?.[0]?.external_rate || 0,
        salary: userRatesData[i]?.data?.[0]?.salary || 0,
        englishLevel: calculateUserEnglishLevel(usersSkillsData[i]?.data?.find(skill => skill.type === 1 && skill.language.title === 'English') as TTimebaseUserLanguage)
      })
      : ({ ...user })
    );

    return mergedUsers;
  } catch (e) {
    throw new Error(e as any);
  }
};
