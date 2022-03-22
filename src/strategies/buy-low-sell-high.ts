import { Action, EDirection, InvestmentAdvice } from "../../mod.ts"
import { FinancialCalculator } from "../utilities/financial-calculator.ts"
import { VFLogger } from "../utilities/logger.ts";
import { VoFarmStrategy } from "./vofarm-strategy.ts";
import { BollingerBandsService, IBollingerBands } from "https://deno.land/x/bollinger_bands@v0.2.0/mod.ts"
import { initialPositionInsights } from "../constants/initial-position-insights.ts";


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

    protected historyLength = 50
    protected positionInsights: IPositionInsights[] = []
    protected spreadFactor = 0
    protected minPNL = 0

    public constructor(logger: VFLogger) {
        super(logger)
        this.positionInsights = initialPositionInsights
    }



    public async getInvestmentAdvices(input: any): Promise<InvestmentAdvice[]> {

        this.currentInvestmentAdvices = []

        await this.collectFundamentals(input.exchangeConnector)

        this.enrichPortfolioInsights()

        if (this.positionInsights[0].sma.length === this.historyLength) {
            this.executeBuyLowSellHigh()
        } else {
            console.log(this.positionInsights[0].sma.length)
        }

        return this.currentInvestmentAdvices

    }

    private enrichPortfolioInsights() {

        this.spreadFactor = Number((20 - this.liquidityLevel).toFixed(0))
        this.minPNL = 20 - this.spreadFactor
        console.log('spreadFactor:', this.spreadFactor, ' / minPNL:', this.minPNL)

        for (const positionInsightsEntry of this.positionInsights) {
            const side = (positionInsightsEntry.direction === EDirection.LONG) ? 'Buy' : 'Sell'
            const position = this.fundamentals.positions.filter((e: any) => e.data.symbol === positionInsightsEntry.tradingPair && e.data.side === side)[0]
            if (position === undefined) {
                this.enhancePosition(positionInsightsEntry)
            }

            const pnl = FinancialCalculator.getPNLOfPositionInPercent(position)

            if (this.positionInsights[0].sma.length === this.historyLength) {
                positionInsightsEntry.pnlHistory.splice(0, 1)
            }
            positionInsightsEntry.pnlHistory.push(pnl)
            const bollingerBands: IBollingerBands = BollingerBandsService.getBollingerBands(positionInsightsEntry.pnlHistory, this.spreadFactor)

            positionInsightsEntry.sma = bollingerBands.sma

            positionInsightsEntry.lowerBand = bollingerBands.lower
            positionInsightsEntry.upperBand = bollingerBands.upper

        }

    }


    private executeBuyLowSellHigh() {

        for (const positionInsightsEntry of this.positionInsights) {

            const side = (positionInsightsEntry.direction === EDirection.LONG) ? 'Buy' : 'Sell'
            const position = this.fundamentals.positions.filter((p: any) => p.data.side === side && p.data.symbol === positionInsightsEntry.tradingPair)[0]
            if (position === undefined) continue
            const pnl = positionInsightsEntry.pnlHistory[positionInsightsEntry.pnlHistory.length - 1]
            const lower = Number(positionInsightsEntry.lowerBand[positionInsightsEntry.lowerBand.length - 2].toFixed(2))
            const upper = Number(positionInsightsEntry.upperBand[positionInsightsEntry.upperBand.length - 2].toFixed(2))

            // console.log(JSON.stringify(position))
            console.log(`${position.data.size} ${positionInsightsEntry.tradingPair} (${Number(position.data.position_value.toFixed(0))}) ${positionInsightsEntry.direction} ${pnl} ${lower} ${upper}`)

            if (this.liquidityLevel > 3) {
                if (pnl < lower) {
                    this.enhancePosition(positionInsightsEntry)
                }
            }

            if (pnl > upper && pnl > this.minPNL && position.data.size > positionInsightsEntry.targetSize) {
                this.reducePosition(positionInsightsEntry)
            }
        }

    }


    private enhancePosition(positionInsightsEntry: IPositionInsights) {
        const pnl = positionInsightsEntry.pnlHistory[positionInsightsEntry.pnlHistory.length - 1]
        const text = `we enhance our ${positionInsightsEntry.tradingPair} ${positionInsightsEntry.direction} position at a pnl of ${pnl} to fuck manipulators`
        if (positionInsightsEntry.direction === EDirection.LONG) {
            this.addInvestmentAdvice(Action.BUY, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, text)
        } else {
            this.addInvestmentAdvice(Action.SELL, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, text)
        }
    }

    private reducePosition(positionInsightsEntry: IPositionInsights) {
        const pnl = positionInsightsEntry.pnlHistory[positionInsightsEntry.pnlHistory.length - 1]
        const text = `we reduce our ${positionInsightsEntry.tradingPair} ${positionInsightsEntry.direction} position at a pnl of ${pnl} to fuck manipulators`
        if (positionInsightsEntry.direction === EDirection.LONG) {
            this.addInvestmentAdvice(Action.REDUCELONG, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, text)
        } else {
            this.addInvestmentAdvice(Action.REDUCESHORT, positionInsightsEntry.tradingUnit, positionInsightsEntry.tradingPair, text)
        }
    }




}

