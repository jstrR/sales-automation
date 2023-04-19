import * as hubspot from '@hubspot/api-client';
import { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/deals';

import { type TDealCreate, createNoteBody } from './lib';

let hubspotClient: hubspot.Client | null = null;
const AssociationId = '12';

export const initHubspotConnection = async () => {
  try {
    hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_API_TOKEN });
    return hubspotClient;
  } catch (e) {
    console.log(e);
  }
};

export const associateNotesWithDeals = async (notesIds: string[], dealsIds: string[]) => {
  try {
    if (!hubspotClient) {
      throw new Error('No Hubspot Client identified');
    }
    const associationsToCreate = notesIds.map((noteId, i) => ({
      _from: { id: noteId },
      to: { id: dealsIds[i] },
      type: AssociationId
    }));

    if (associationsToCreate.length) {
      const apiResponse = await hubspotClient.crm.associations.batchApi.create('engagement', 'deal', { inputs: associationsToCreate });
      return apiResponse;
    }
    return [];
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const createNotes = async (deals: TDealCreate[]) => {
  try {
    if (!hubspotClient) {
      throw new Error('No Hubspot Client identified');
    }
    const notesToCreate = deals.map(deal => ({
      properties: {
        hs_timestamp: Date.now().toString(),
        hs_note_body: createNoteBody(deal.vacancyText, deal.link, deal.users),
        hubspot_owner_id: process.env.HUBSPOT_OWNER_ID!
      }
    }));

    if (notesToCreate.length) {
      const apiResponse = await hubspotClient.crm.objects.notes.batchApi.create({ inputs: notesToCreate });
      return apiResponse.results;
    }
    return [];
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const createDeals = async (deals: TDealCreate[]) => {
  try {
    if (!hubspotClient) {
      throw new Error('No Hubspot Client identified');
    }
    if (deals.length) {
      const dealsProperties = deals.map(deal => ({ properties: deal.properties }));

      const apiResponse = await hubspotClient.crm.deals.batchApi.create({ inputs: dealsProperties });
      const createdDealsIds = deals.map(deal => apiResponse.results.find(result => result.properties.dealname === deal.properties.dealname) || null).filter((result): result is SimplePublicObject => !!result).reduce((prev, curr) => [...prev, curr.id], [] as string[]);

      const createdNotes = await createNotes(deals);
      const createdNotesIds = deals.map(deal => createdNotes.find(result => result.properties.hs_note_body.includes(deal.link)) || null).filter((result): result is SimplePublicObject => !!result).reduce((prev, curr) => [...prev, curr.id], [] as string[]);

      await associateNotesWithDeals(createdNotesIds, createdDealsIds);
      return apiResponse.results;
    }
    return [];
  } catch (e) {
    console.log(e);
    return [];
  }
};
