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

        this.hedge()

        return this.currentInvestmentAdvices

    }

    private hedge() {
        const shortENSPosition = this.fundamentals.positions.filter((e: any) => e.data.symbol === "ENSUSDT" && e.data.side === 'Sell')[0]
        const shortENSPositionPNL = FinancialCalculator.getPNLOfPositionInPercent(shortENSPosition)
        const insights = this.positionInsights.filter((e: IPositionInsights) => e.tradingPair === 'ENSUSDT' && e.direction === EDirection.SHORT)[0]
        const overallLSDInPercent = this.getOverallLSDInPercent()

        console.log(overallLSDInPercent)

        if (overallLSDInPercent > 65 && insights.sma.length > 1 && shortENSPositionPNL < insights.sma[insights.sma.length - 2]) {
            this.enhancePosition(insights)
        } else if (overallLSDInPercent < 75 && shortENSPositionPNL > 24) {
            this.reducePosition(insights)

        }
    }

    private enrichPortfolioInsights() {

        // this.spreadFactor = Number((42 - (this.liquidityLevel * 2)))
        if (this.liquidityLevel === 0) {
            this.spreadFactor = 111
        } else {
            this.spreadFactor = Number(((111 / this.liquidityLevel) + 3).toFixed(0))
        }

        this.minPNL = 20 - this.spreadFactor
        console.log('spreadFactor:', this.spreadFactor, ' / minPNL:', this.minPNL)

        for (const positionInsightsEntry of this.positionInsights) {
            const side = (positionInsightsEntry.direction === EDirection.LONG) ? 'Buy' : 'Sell'
            const position = this.fundamentals.positions.filter((e: any) => e.data.symbol === positionInsightsEntry.tradingPair && e.data.side === side)[0]
            if (position === undefined && this.liquidityLevel > 1) {
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
        const d = new Date();
        let day = d.getDay()
        console.log(day)
        const ratherCloseOperand = 0

        for (const positionInsightsEntry of this.positionInsights) {

            const side = (positionInsightsEntry.direction === EDirection.LONG) ? 'Buy' : 'Sell'
            const position = this.fundamentals.positions.filter((p: any) => p.data.side === side && p.data.symbol === positionInsightsEntry.tradingPair)[0]
            if (position === undefined) continue
            const pnl = positionInsightsEntry.pnlHistory[positionInsightsEntry.pnlHistory.length - 1]

            const enhancePositionTrigger = Number(positionInsightsEntry.lowerBand[positionInsightsEntry.lowerBand.length - 2].toFixed(2))
            const reducePositionTrigger = Number(positionInsightsEntry.upperBand[positionInsightsEntry.upperBand.length - 2].toFixed(2)) - ratherCloseOperand

            // console.log(JSON.stringify(position))
            console.log(`${position.data.size} ${positionInsightsEntry.tradingPair} (${Number(position.data.position_value.toFixed(0))}) ${positionInsightsEntry.direction} ${pnl} ${enhancePositionTrigger} ${reducePositionTrigger}`)

            if (this.liquidityLevel > 0.5) {
                if (pnl < enhancePositionTrigger) {
                    this.enhancePosition(positionInsightsEntry)
                }
            }

            if (pnl > reducePositionTrigger && pnl > this.minPNL && position.data.size > positionInsightsEntry.targetSize) {
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

