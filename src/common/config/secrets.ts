import dotenv from "dotenv";
dotenv.config();

export const isProduction = process.env.IS_PRODUCT == "true";

export const IN_ROFL = process.env.IN_ROFL == "false";

export const AGENT_EVM_PRIVATE_KEY = process.env.AGENT_EVM_PRIVATE_KEY ?? "";

export const CENTIC_API_KEYS = process.env.CENTIC_API_KEYS ?? "";
