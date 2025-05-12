import dotenv from "dotenv";
dotenv.config();

export const isProduction = process.env.IS_PRODUCT == "true";

export const AGENT_EVM_PRIVATE_KEY = process.env.AGENT_EVM_PRIVATE_KEY ?? "";
