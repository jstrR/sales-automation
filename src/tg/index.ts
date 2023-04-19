import dayjs from "dayjs";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
// @ts-ignore
import input from "input";
import fs from "fs/promises";

import parserConfig from '../parserConfig.json';

import { matchKeywords } from "../vacancies/lib";
import { canAccessFile, type TTelegramMessage, type TTelegramVacancies } from "./lib";

let stringSession = '';
let tgClient: TelegramClient | null = null;
const tgVacanciesFilePath = './src/tgVacancies.txt';

export const initTGConnection = async () => {
  try {
    stringSession = process.env.TG_APP_SESSION_TOKEN || '';
    tgClient = new TelegramClient(new StringSession(stringSession),
      Number(process.env.TG_APP_ID), process.env.TG_APP_HASH!, {
      connectionRetries: 2,
      requestRetries: 2,
      autoReconnect: false,
    });

    if (stringSession) {
      await tgClient?.connect();
    } else {
      await tgClient?.start({
        phoneNumber: process.env.TG_APP_PHONE!,
        password: async () => process.env.TG_APP_PASSWORD!,
        phoneCode: async () => await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
      });
      stringSession = tgClient.session.save() as any;
      console.log(stringSession);
    }
  } catch (e) {
    console.log(e);
  }
};

export const getTgVacancies = async (channels: string[], searchKeywords: { [key: string]: string[]; }): Promise<TTelegramVacancies[]> => {
  try {
    if (!tgClient) {
      throw new Error('No Telegram Client identified');
    }
    const threeDaysAgo = dayjs().day(-2);

    const results = await Promise.allSettled(channels.map(async (channel) => {
      return await tgClient?.invoke(
        new Api.messages.GetHistory({
          peer: channel,
          addOffset: 0,
          limit: Number(parserConfig.tg.vacanciesNumber) || 20,
        })
      );
    }));

    const receivedVacancies: TTelegramVacancies[] = results.filter(result => result.status === 'fulfilled').map(result => {
      const botUser = (result as any).value?.chats?.length ? null : (result as any).value?.users.find((user: any) => user.bot);
      return {
        chatId: !botUser ? (result as any).value.chats?.[0]?.id as number : (botUser?.firstName || botUser?.id),
        chatName: !botUser ? ((result as any).value?.chats?.[0]?.username || (result as any).value.chats?.[0]?.id) as string : botUser?.username,
        bot: !!botUser,
        private: !(result as any).value?.chats?.[0]?.username,
        vacancies: (result as any).value?.messages?.filter(
          (messageData: TTelegramMessage) => {
            let addToVacancies = true;
            const channelKeywords = !botUser ? searchKeywords[((result as any).value?.chats?.[0]?.username || `-100${(result as any).value.chats?.[0]?.id}`) as string] : searchKeywords[botUser?.username];
            if (channelKeywords?.length && messageData.message) {
              addToVacancies = !!matchKeywords(messageData.message, channelKeywords).length;
            }
            return addToVacancies && threeDaysAgo.diff(dayjs(messageData.date * 1000)) < 0;
          }
        ) || []
      };
    }) || [];

    return receivedVacancies;
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const getSavedTgVacanciesIds = async () => {
  try {
    const tgVacanciesExists = await canAccessFile(tgVacanciesFilePath);
    if (tgVacanciesExists) {
      const existingTgVacanciesFile = (await fs.readFile(tgVacanciesFilePath)).toString();
      return existingTgVacanciesFile.split(',\n');
    } else {
      return [];
    }
  } catch (e) {
    throw e;
  }
};

export const saveTgVacanciesIds = async (data: string[]) => {
  let dataToWrite = data;
  try {
    const savedIds = await getSavedTgVacanciesIds();
    if (savedIds) {
      dataToWrite = data.filter(i => savedIds.indexOf(i) < 0);
    }
    if (dataToWrite.length) {
      await fs.appendFile(tgVacanciesFilePath, dataToWrite.join(',\n') + ',\n');
    }
  } catch (e) {
    throw e;
  }
};
