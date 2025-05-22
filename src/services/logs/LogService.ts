import { Telegraf } from "telegraf";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID } from "../../common/config/secrets";

export class LogService {
    private bot: Telegraf;
    private chaiId: string;
    constructor() {
        this.bot = new Telegraf(TELEGRAM_BOT_TOKEN);
        this.chaiId = TELEGRAM_GROUP_ID;
        this.bot.launch().then(() => {
            this.log("🤖 Bot is running...");
        });
    }
    async log(message: string) {
        try {
            console.log(message);
            await this.bot.telegram.sendMessage(this.chaiId, message, { parse_mode: "Markdown" });
        } catch (error) {
            console.error(error);
        }
    }
    async error(message: string) {
        try {
            message = message.replace(/\./g, ".");
            message = message.replace(/-/g, "-");
            await this.bot.telegram.sendMessage(this.chaiId, message, { parse_mode: "Markdown" });
        } catch (error) {
            console.error(error);
        }
    }
}
export const logs = new LogService();
