import { AGENT_EVM_PRIVATE_KEY, IN_ROFL } from "./common/config/secrets";
import { fundFeeService } from "./funding/FungingSerivce";
import { FundingBase } from "./funding/networks/FundingBase";
import { FungingSapphire } from "./funding/networks/FundingSapphire";
import { BaseCompoundV3Module } from "./modules/networks/base/BaseCompoundv3Module";
import { OmniFarmingModule } from "./omni-farming/OmniFarmingModule";
import { OmniFarming } from "./omni-farming/OmniFarming";
import { FundingArbitrum } from "./funding/networks/FundingArbitrum";
import { ArbitrumAAVEV3Module } from "./modules/networks/arbitrum/ArbitrumAAVEV3Module";
import { RoflService } from "./services/rofl/RoflService";
import { Wallet } from "ethers";
import { logs } from "./services/logs/LogService";

async function main() {
    await logs.log("Starting...");
    let privateKey = AGENT_EVM_PRIVATE_KEY;
    const roflService = new RoflService();
    if (IN_ROFL) {
        try {
            let testPrivateKey = await roflService.getAgentKey();
            const wallet = new Wallet(testPrivateKey);
            await logs.log(`Agent wallet: ${wallet.address}`);
        } catch (error) {
            await logs.error(`Error getting agent key: ${error}`);
        }
    }

    const fungingSapphire = new FungingSapphire(privateKey);
    const fundingBase = new FundingBase(privateKey);
    const fundingArbitrum = new FundingArbitrum(privateKey);
    await fundFeeService.addFunding(fungingSapphire);
    await fundFeeService.addFunding(fundingBase);
    await fundFeeService.addFunding(fundingArbitrum);

    const omniFarming = new OmniFarmingModule(privateKey);
    const baseCompoundV3Module = new BaseCompoundV3Module(privateKey);
    const arbitrumAAVEV3Module = new ArbitrumAAVEV3Module(privateKey);

    const omni = new OmniFarming(omniFarming);
    await omni.addModule(baseCompoundV3Module);
    await omni.addModule(arbitrumAAVEV3Module);

    omni.setup();
}

main();
