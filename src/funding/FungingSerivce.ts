import { FungingTemplate } from "./FundFeeContract";

export class FundFeeService {
    private fundings: FungingTemplate[];
    constructor() {
        this.fundings = [];
    }

    async addFunding(funging: FungingTemplate) {
        this.fundings.push(funging);
    }

    async fundFee(amount: bigint, address: string, txnHash: string, chainId: string) {
        let amountWithBonus = (amount * 102n) / 100n;

        for (const fundFeeContract of this.fundings) {
            if (fundFeeContract.chainId == chainId) {
                await fundFeeContract.funding(amountWithBonus, address, txnHash);
            }
        }
    }
}

export const fundFeeService = new FundFeeService();
