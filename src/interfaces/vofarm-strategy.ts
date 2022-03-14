import { InvestmentAdvice } from "./investment-advice.ts";
import { AssetInfo } from "./investment-option.ts";

export interface IVoFarmStrategy {
    getInvestmentAdvices(investmentDecisionBase: any): Promise<InvestmentAdvice[]>
}