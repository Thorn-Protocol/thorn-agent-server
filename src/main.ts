import { AGENT_EVM_PRIVATE_KEY, IN_ROFL } from "./common/config/secrets";
import { fundFeeService } from "./funding/FungingSerivce";
import { FundingBase } from "./funding/networks/FundingBase";
import { FungingSapphire } from "./funding/networks/FundingSapphire";
import { BaseCompoundV3Module } from "./modules/networks/base/BaseCompoundv3Module";
import { OmniFarmingModule } from "./omni-farming/OmniFarmingModule";
import { OmniFarming } from "./omni-farming/OmniFarming";
import { centic } from "./services/data/CenticService";
import { EVM_ADDRESS } from "./common/config/config";
import { FundingArbitrum } from "./funding/networks/FundingArbitrum";
import { ArbitrumAAVEV3Module } from "./modules/networks/arbitrum/ArbitrumAAVEV3Module";
import { routerService } from "./services/bridges/RouterService";

async function main() {
    let privateKey = AGENT_EVM_PRIVATE_KEY;

    if (IN_ROFL) {
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
