import axios from "axios";
import { CENTIC_API_KEYS } from "../../common/config/secrets";

class CenticService {
    private readonly CENTIC_API_KEYS = CENTIC_API_KEYS;
    constructor() {}

    public async getCompoundV3AprOnBase(usdcAddress: string): Promise<any> {
        usdcAddress = usdcAddress.toLowerCase();
        const url = "https://develop.centic.io/dev/v3/projects/lending/compound-v3/overview?chain=0x2105";

        try {
            const response = await axios.get(url, {
                headers: {
                    "Content-Type": "application/json",
                    "x-apikey": this.CENTIC_API_KEYS,
                },
            });
            const data = response.data;
            if (!data.markets || !Array.isArray(data.markets)) {
                console.error("API response invalid");
                return 0;
            }
            const market = data.markets.find((m: any) => m.address == usdcAddress);

            if (!market || !market.assets || !Array.isArray(market.assets)) {
                console.error("Not found market or assets invalid");
                return 0;
            }
            const asset = market.assets.find((a: any) => a.address === usdcAddress);
            return asset ? asset.supplyAPY * 100 : 0;
        } catch (error) {
            console.error("Error fetching Compound V3 APR:", error);
            throw error;
        }
    }
}

export const centic = new CenticService();
