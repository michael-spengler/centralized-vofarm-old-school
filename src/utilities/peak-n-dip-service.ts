import { AssetUnderPlay } from "../interfaces/asset-under-play.ts";
import { AssetInfo } from "../interfaces/investment-option.ts";
import { FinancialCalculator } from "./financial-calculator.ts";

export class PeakNDipService {

    public static getLowestSinceX(history: number[], current: number) {
        let counter = 0
        for (const entry of history) {
            if (current < entry) {
                counter++
            } else if (current > entry) {
                return counter
            }
        }

        return counter
    }

    public static getHighestSinceX(history: number[], current: number) {
        let counter = 0

        for (const entry of history) {
            if (current > entry) {
                counter++
            } else if (current < entry) {
                return counter
            }
        }

        return counter

    }

    public static getLongLowestLowestSinceX(assetInfos: AssetInfo[], longPosition: any[]): AssetUnderPlay {
        console.log(assetInfos)
        console.log(longPosition)

        let longLowestLowestSinceXAssetUnderPlay: AssetUnderPlay = {
            symbol: "",
            side: "",
            percentage: 0,
            lHHSX: 0,
            sHHSX: 0,
            lLLSX: 0,
            sLLSX: 0,
            minTradingAmount: 0,
        }
        let longLowestLowestSinceXOverall = 0
        for (const assetInfo of assetInfos) {
            let longLowestLowestSinceX = this.getLowestSinceX(assetInfo.longHistory, FinancialCalculator.getPNLOfPositionInPercent(longPosition))
            if (longLowestLowestSinceX > longLowestLowestSinceXOverall) {
                longLowestLowestSinceXOverall = longLowestLowestSinceX
                longLowestLowestSinceXAssetUnderPlay = {
                    symbol: assetInfo.pair, side: 'Buy',
                    lHHSX: 0,
                    sHHSX: 0,
                    lLLSX: longLowestLowestSinceX,
                    sLLSX: 0,
                    percentage: FinancialCalculator.getPNLOfPositionInPercent(longPosition),
                    minTradingAmount: assetInfo.minTradingAmount
                }
            }

        }
        return longLowestLowestSinceXAssetUnderPlay
    }
}