import { Action, InvestmentAdvice } from "../../mod.ts"
import { FinancialCalculator } from "../utilities/financial-calculator.ts"
import { VFLogger } from "../utilities/logger.ts";
import { VoFarmStrategy } from "./vofarm-strategy.ts";
import { BollingerBandsService, IBollingerBands } from "https://deno.land/x/bollinger_bands/mod.ts"


export enum EDirection {
    LONG = "long",
    SHORT = "short"
}

export interface IPositionInsights {
    tradingPair: string,
    direction: EDirection,
    pnlHistory: number[],
    sma: number[],
    lowerBand: number[],
    upperBand: number[],
    tradingUnit: number,
    targetSize: number
}

export class BuyLowSellHigh extends VoFarmStrategy {

    protected historyLength = 100
    protected positionInsights: IPositionInsights[] = []

    public constructor(logger: VFLogger) {
        super(logger)
        this.initializePositionInsights()
    }



    public async getInvestmentAdvices(input: any): Promise<InvestmentAdvice[]> {

        this.currentInvestmentAdvices = []

        await this.collectFundamentals(input.exchangeConnector)

        this.enrichPortfolioInsights()

        console.log(this.positionInsights[0].sma.length)
        if (this.positionInsights[0].sma.length === this.historyLength) {
            this.executeBuyLowSellHigh()
        }

        return this.currentInvestmentAdvices

    }



    protected executeBuyLowSellHigh() {

        for (const positionInsightsEntry of this.positionInsights) {

            const side = (positionInsightsEntry.direction === EDirection.LONG) ? 'Buy' : 'Sell'
            const position = this.fundamentals.positions.filter((p: any) => p.data.side === side && p.data.symbol === positionInsightsEntry.tradingPair)[0]

            if (position === undefined) {
                this.addInvestmentAdvice(Action.BUY, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, `we open a ${positionInsightsEntry.tradingPair} ${positionInsightsEntry.direction} position to play the game`)
            }


            const pnl = positionInsightsEntry.pnlHistory[positionInsightsEntry.pnlHistory.length - 1]
            const sma = positionInsightsEntry.sma[positionInsightsEntry.sma.length - 2]
            const lower = positionInsightsEntry.lowerBand[positionInsightsEntry.lowerBand.length - 2]
            const upper = positionInsightsEntry.upperBand[positionInsightsEntry.upperBand.length - 2]

            console.log(`${positionInsightsEntry.tradingPair} ${positionInsightsEntry.direction} - ${pnl} - ${sma} - ${lower} - ${upper}`)

            if (this.liquidityLevel > 11) {
                if (pnl < lower) {
                    this.addInvestmentAdvice(Action.BUY, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, `we enhance our ${positionInsightsEntry.tradingPair} ${positionInsightsEntry.direction} position to fuck manipulators`)
                }
            }

            if (pnl > upper && position.data.size > positionInsightsEntry.targetSize) {
                this.addInvestmentAdvice(Action.REDUCELONG, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, `we reduce our ${positionInsightsEntry.tradingPair} ${positionInsightsEntry.direction} position to fuck manipulators`)
            }
        }

    }


    private enrichPortfolioInsights() {

        this.liquidityLevel = (this.fundamentals.accountInfo.result.USDT.available_balance / this.fundamentals.accountInfo.result.USDT.equity) * 20

        for (const positionInsightsEntry of this.positionInsights) {
            const position = this.fundamentals.positions.filter((e: any) => e.data.symbol === positionInsightsEntry.tradingPair && e.data.side === 'Buy')[0]

            if (position === undefined) continue

            const pnl = FinancialCalculator.getPNLOfPositionInPercent(position)
            if (this.positionInsights[0].sma.length === this.historyLength) {
                positionInsightsEntry.pnlHistory.splice(0, 1)
            }
            positionInsightsEntry.pnlHistory.push(pnl)

            const bollingerBands: IBollingerBands = BollingerBandsService.getBollingerBands(positionInsightsEntry.pnlHistory)

            positionInsightsEntry.sma = bollingerBands.sma
            positionInsightsEntry.lowerBand = bollingerBands.lower
            positionInsightsEntry.upperBand = bollingerBands.upper

        }

        // console.log(this.positionInsights)

    }


    private initializePositionInsights() {
        this.positionInsights = [{
            tradingPair: 'ETHUSDT',
            direction: EDirection.LONG,
            pnlHistory: [],
            sma: [],
            lowerBand: [],
            upperBand: [],
            tradingUnit: 0.01,
            targetSize: 11.11,
        }, {
            tradingPair: 'ENSUSDT',
            direction: EDirection.LONG,
            pnlHistory: [],
            sma: [],
            lowerBand: [],
            upperBand: [],
            tradingUnit: 0.1,
            targetSize: 1111.1,
        }, {
            tradingPair: 'BTCUSDT',
            direction: EDirection.LONG,
            pnlHistory: [],
            sma: [],
            lowerBand: [],
            upperBand: [],
            tradingUnit: 0.001,
            targetSize: 0.01,
        }, {
            tradingPair: 'ADAUSDT',
            direction: EDirection.LONG,
            pnlHistory: [],
            sma: [],
            lowerBand: [],
            upperBand: [],
            tradingUnit: 1,
            targetSize: 10,
        }, {
            tradingPair: 'SOLUSDT',
            direction: EDirection.LONG,
            pnlHistory: [],
            sma: [],
            lowerBand: [],
            upperBand: [],
            tradingUnit: 1,
            targetSize: 10,
        }, {
            tradingPair: 'DOTUSDT',
            direction: EDirection.LONG,
            pnlHistory: [],
            sma: [],
            lowerBand: [],
            upperBand: [],
            tradingUnit: 1,
            targetSize: 10,
        }]
    }

}

