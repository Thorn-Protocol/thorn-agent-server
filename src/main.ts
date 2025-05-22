import { AGENT_EVM_PRIVATE_KEY, IN_ROFL } from "./common/config/secrets";
import { BaseCompoundV3Module } from "./modules/networks/base/BaseCompoundv3Module";
import { OmniFarmingModule } from "./omni-farming/OmniFarmingModule";
import { OmniFarming } from "./omni-farming/OmniFarming";
import { ArbitrumAAVEV3Module } from "./modules/networks/arbitrum/ArbitrumAAVEV3Module";
import { RoflService } from "./services/rofl/RoflService";
import { Wallet } from "ethers";
import { logs } from "./services/logs/LogService";
import { FundingFee } from "./services/funding/FundingSapphire";
import { bridge } from "./services/bridges/RouterService";

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
    const fundingFee = new FundingFee(privateKey);
    bridge.setup(fundingFee);
    const omniFarming = new OmniFarmingModule(privateKey);
    const baseCompoundV3Module = new BaseCompoundV3Module(privateKey);
    const arbitrumAAVEV3Module = new ArbitrumAAVEV3Module(privateKey);
    const omni = new OmniFarming(omniFarming, privateKey);
    await omni.addModule(baseCompoundV3Module);
    await omni.addModule(arbitrumAAVEV3Module);
    omni.setup();
}

main();
