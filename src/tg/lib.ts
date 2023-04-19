import fs from "fs/promises";

export type TTelegramMessage = {
  id: number;
  date: number;
  message?: string;
  views: number;
};

export type TTelegramVacancies = {
  chatId: number;
  chatName: string;
  bot: boolean;
  private: boolean;
  vacancies: TTelegramMessage[];
};

export const canAccessFile = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch (e) {
    return false;
  }
};
