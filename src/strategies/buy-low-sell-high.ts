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
    targetPercentageOfEquity: number
}

export enum EOpinionatedMode {
    bullish = 1,
    bearish = -1,
    relaxed = 0
}

export class BuyLowSellHigh extends VoFarmStrategy {

    protected historyLength = 50
    protected positionInsights: IPositionInsights[] = []
    protected spreadFactor = 0
    protected minPNL = 0
    protected bearishBullishIndicator = 0

    public constructor(logger: VFLogger) {
        super(logger)
        this.positionInsights = initialPositionInsights
    }



    public async getInvestmentAdvices(input: any): Promise<InvestmentAdvice[]> {

        this.currentInvestmentAdvices = []

        await this.collectFundamentals(input.exchangeConnector)

        this.enrichPortfolioInsights()

        const date = new Date()
        if (((date.getDay() === 0 && date.getHours() > 17) || date.getDay() === 1 && date.getHours() < 18) && this.liquidityLevel > 11) {
            console.log("we're in a pretty bullish state of mind :) - enhancing early")
            this.bearishBullishIndicator = EOpinionatedMode.bullish
        } else if ((date.getDay() === 5 && date.getHours() > 17) || date.getDay() === 6 || date.getDay() === 0 && date.getHours() < 16) {
            console.log("we're in a pretty bearish state of mind :) - reducing early")
            this.bearishBullishIndicator = EOpinionatedMode.bearish
        } else {
            this.bearishBullishIndicator = EOpinionatedMode.relaxed
        }
        if (this.positionInsights[0].sma.length === this.historyLength) {
            // if (this.positionInsights[0].sma.length > 2) {
            this.executeBuyLowSellHigh()
        } else {
            console.log(this.positionInsights[0].sma.length)
        }

        this.tidyUpPortfolio()



        return this.currentInvestmentAdvices

    }

    private tidyUpPortfolio() {

        for (const p of this.fundamentals.positions) {
            if (p.data.side === 'Sell') {
                this.addInvestmentAdvice(Action.REDUCESHORT, p.data.size, p.data.symbol, 'inflation of fiat money suggests not to short crypto')
            }

            const direction = (p.data.side === 'Buy') ? EDirection.LONG : EDirection.SHORT

            const i = this.positionInsights.filter((e: IPositionInsights) => e.tradingPair === p.data.symbol && e.direction === direction)[0]
            if (i === undefined) {
                if (direction === EDirection.LONG) {
                    this.addInvestmentAdvice(Action.REDUCELONG, p.data.size, p.data.symbol, 'tidy up')
                } else {
                    this.addInvestmentAdvice(Action.REDUCESHORT, p.data.size, p.data.symbol, 'tidy up')
                }

            }
        }
    }
    private enrichPortfolioInsights() {

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

        for (const positionInsightsEntry of this.positionInsights) {

            const side = (positionInsightsEntry.direction === EDirection.LONG) ? 'Buy' : 'Sell'
            const position = this.fundamentals.positions.filter((p: any) => p.data.side === side && p.data.symbol === positionInsightsEntry.tradingPair)[0]
            if (position === undefined) continue
            const pnl = positionInsightsEntry.pnlHistory[positionInsightsEntry.pnlHistory.length - 1]

            const baseValue = position.data.position_value / position.data.leverage

            const percentageOfEquity = Number((baseValue * 100 / this.fundamentals.accountInfo.result.USDT.equity).toFixed(2))

            let enhancePositionTrigger = Number(positionInsightsEntry.lowerBand[positionInsightsEntry.lowerBand.length - 2].toFixed(2))
            let reducePositionTrigger = Number(positionInsightsEntry.upperBand[positionInsightsEntry.upperBand.length - 2].toFixed(2))

            if (this.bearishBullishIndicator === EOpinionatedMode.bullish) {
                enhancePositionTrigger = enhancePositionTrigger + 3
            } else if (this.bearishBullishIndicator === EOpinionatedMode.bearish) {
                reducePositionTrigger = enhancePositionTrigger + 20
            }

            console.log(`${position.data.size} ${positionInsightsEntry.tradingPair} (${Number(position.data.position_value.toFixed(0))}) ${positionInsightsEntry.direction} ${pnl} ${enhancePositionTrigger} ${reducePositionTrigger} ${percentageOfEquity} ${this.bearishBullishIndicator}`)

            if (this.liquidityLevel > 7) {
                if (pnl < enhancePositionTrigger) {
                    this.enhancePosition(positionInsightsEntry)
                }
            }

            if (((pnl > reducePositionTrigger && pnl > this.minPNL) || this.liquidityLevel === 0) && position.data.size > positionInsightsEntry.tradingUnit) {
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

