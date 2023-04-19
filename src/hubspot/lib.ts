import { TStaffPlaningUser } from "src/timebase/lib";

export enum EDealCurrencyCode {
  eur = 'EUR',
  usd = 'USD'
};

export enum EDealPipeline {
  civitta = 'default',
  outstaffing = '43563199'
};

export enum EDealStage {
  leadIn = '118306237',
};

export enum EDealAnalyticsSource {
  otherCampaigns = 'OTHER_CAMPAIGNS',
};

export enum ELeadSource {
  outstaffRequestParsing = 'Outstaff request parsing',
};

export enum ELeadSourceDrillDown1 {
  tg = 'telegram',
  site = 'web_parsing'
};

export type TDealCreate = {
  properties: {
    deal_currency_code: EDealCurrencyCode;
    pipeline: EDealPipeline;
    dealstage: EDealStage;
    dealname: string;
    description: string;
  };
  users: TStaffPlaningUser[];
  link: string;
  vacancyText: string;
};

export const createNoteBody = (vacancy: string, link: string, users: TStaffPlaningUser[]) => {
  if (users.length) {
    const usersBody = users.reduce((prev, curr, i) => prev +
      `<p></p>\n
    <p>Employee ${i + 1} description:</p> \n
    <p>${curr.fullname}</p>\n
    https://www.timebase.app/user/show/${curr.userId} \n
    <p>${curr.occupation}</p>\n
    <p>Matching coefficient - ${curr.matchmakeRate || 0}</p>\n
    <p>Internal rate - ${curr.internalRate || 0}</p>\n
    <p>External rate - ${curr.externalRate || 0}</p>\n
    <p>Salary - ${curr.salary || 0}</p>\n
    <p>English level - ${curr.englishLevel.label || ''}</p>\n
    <p>Location - ${curr.location}</p>\n`
      , '');
    const body = `
      Vacancy description:\n
      <p>${vacancy.split('\n').join('</p><p>')}</p>\n<p></p>Original link - ${link}\n${usersBody}
    `;
    return body;
  }
  return '';
};
