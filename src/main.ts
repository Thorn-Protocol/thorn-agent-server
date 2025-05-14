import { AGENT_EVM_PRIVATE_KEY } from "./common/config/secrets";
import { fundFeeService } from "./funding/FungingSerivce";
import { FundingBase } from "./funding/networks/FundingBase";
import { FungingSapphire } from "./funding/networks/FundingSapphire";
import { BaseCompoundV3Module } from "./modules/networks/base/BaseCompoundv3Module";
import { OmniFarmingModule } from "./omni-farming/OmniFarmingModule";
import { OmniFarming } from "./omni-farming/OmniFarming";
import { centic } from "./services/data/CenticService";
import { EVM_ADDRESS } from "./common/config/config";

async function main() {
    const fungingSapphire = new FungingSapphire(AGENT_EVM_PRIVATE_KEY);
    const fundingBase = new FundingBase(AGENT_EVM_PRIVATE_KEY);
    await fundFeeService.addFunding(fungingSapphire);
    await fundFeeService.addFunding(fundingBase);

    const omniFarming = new OmniFarmingModule(AGENT_EVM_PRIVATE_KEY);
    const baseCompoundV3Module = new BaseCompoundV3Module(AGENT_EVM_PRIVATE_KEY);
    const omni = new OmniFarming(omniFarming);
    await omni.addModule(baseCompoundV3Module);
    omni.setup();
}

main();
