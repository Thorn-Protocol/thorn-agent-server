import { FundFeeContract } from "./FundFeeContract";

export class FundFeeService {
    private fundFeeContracts: FundFeeContract[];
    constructor() {
        this.fundFeeContracts = [];
    }

    async addFundFeeContract(fundFeeContract: FundFeeContract) {
        this.fundFeeContracts.push(fundFeeContract);
    }

    async fundFee(amount: bigint, address: string, txnHash: string, chainId: string) {
        let amountWithBonus = (amount * 105n) / 100n;

        for (const fundFeeContract of this.fundFeeContracts) {
            if (fundFeeContract.chainId == chainId) {
                await fundFeeContract.fundFee(amountWithBonus, address, txnHash);
            }
        }
    }
}

export const fundFeeService = new FundFeeService();
