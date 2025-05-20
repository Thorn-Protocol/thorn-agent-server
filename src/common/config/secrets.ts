import dotenv from "dotenv";
dotenv.config();

export const IN_ROFL: boolean = process.env.IN_ROFL == "true";

export const AGENT_EVM_PRIVATE_KEY = process.env.AGENT_EVM_PRIVATE_KEY ?? "";

export const CENTIC_API_KEYS = process.env.CENTIC_API_KEYS ?? "";

// Telegram

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
export const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID ?? "";
