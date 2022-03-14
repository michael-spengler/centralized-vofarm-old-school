import { Action, InvestmentAdvice, AssetInfo, LogLevel } from "../../mod.ts"
import { FinancialCalculator } from "../utilities/financial-calculator.ts"
import { VFLogger } from "../utilities/logger.ts";
import { VoFarmStrategy } from "./vofarm-strategy.ts";
import { AssetUnderPlay } from "../interfaces/asset-under-play.ts";

export abstract class MartingaleReloaded extends VoFarmStrategy {

    protected iterationCount = 0
    protected overallLSD: number = 0
    protected overallPNL: number = 0
    protected triggerForUltimateProfitTaking: number = 1 // 0.1
    protected generalClosingTrigger: number = 100
    protected historyLength = 1000
    protected pauseCounter = 0
    protected longBTCPosition: any
    protected shortBTCPosition: any
    protected longETHPosition: any
    protected shortETHPosition: any

    public constructor(logger: VFLogger) {
        super(logger)

    }

    public async getInvestmentAdvices(input: any): Promise<InvestmentAdvice[]> {

        this.iterationCount++

        if (this.pauseCounter > 0) {
            this.pauseCounter--
            return []
        }

        this.currentInvestmentAdvices = []


        if (input.fundamentals === undefined) {
            await this.collectFundamentals(input.exchangeConnector)
        } else {
            this.fundamentals.accountInfo = input.fundamentals.accountInfo
            this.fundamentals.positions = input.fundamentals.positions
        }

        this.liquidityLevel = (this.fundamentals.accountInfo.result.USDT.available_balance / this.fundamentals.accountInfo.result.USDT.equity) * 20

        this.overallLSD = this.getOverallLSD()

        this.initiate()
        if (this.currentInvestmentAdvices.length > 0) {
            if (this.currentInvestmentAdvices.length > 4) {
                this.pauseCounter = 20
            }
            return this.currentInvestmentAdvices
        }

        this.executeMartingale()
        if (this.currentInvestmentAdvices.length > 0) {
            if (this.currentInvestmentAdvices.length > 4) {
                this.pauseCounter = 20
            }
            return this.currentInvestmentAdvices
        }


        return []

    }



    protected initiate() {

        this.longBTCPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'BTCUSDT')[0]
        this.shortBTCPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Sell' && p.data.symbol === 'BTCUSDT')[0]
        this.longETHPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'ETHUSDT')[0]
        this.shortETHPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Sell' && p.data.symbol === 'ETHUSDT')[0]

        if (this.fundamentals.accountInfo.result.USDT.equity === 0) {
            throw new Error(`are you kidding me - how should I make money without an investment? :)`)
        } else if (this.fundamentals.accountInfo.result.USDT.equity > 0 && this.liquidityLevel < 3) {

            console.log('wo')
            this.closeAll()
            console.log('hier')

            // this.addInvestmentAdvice(Action.REDUCELONG, Number((this.longBTCPosition.data.size).toFixed(3)), this.longBTCPosition.data.symbol, `we close ${this.longBTCPosition.data.size} ${this.longBTCPosition.data.symbol} long due to a lack of liquidity.`)
            // this.addInvestmentAdvice(Action.REDUCESHORT, Number((this.shortBTCPosition.data.size).toFixed(3)), this.shortBTCPosition.data.symbol, `we close ${this.shortBTCPosition.data.size} ${this.shortBTCPosition.data.symbol} long due to a lack of liquidity.`)
            // this.addInvestmentAdvice(Action.REDUCELONG, Number((this.longETHPosition.data.size).toFixed(3)), this.longETHPosition.data.symbol, `we close ${this.longETHPosition.data.size} ${this.longETHPosition.data.symbol} long due to a lack of liquidity.`)
            // this.addInvestmentAdvice(Action.REDUCESHORT, Number((this.shortETHPosition.data.size).toFixed(3)), this.shortETHPosition.data.symbol, `we close ${this.shortETHPosition.data.size} ${this.shortETHPosition.data.symbol} long due to a lack of liquidity.`)
        } else if (this.longBTCPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 0.001, 'BTCUSDT', `we open a BTCUSDT long position to play the game`)
        } else if (this.shortBTCPosition === undefined) {
            this.addInvestmentAdvice(Action.SELL, 0.001, 'BTCUSDT', `we open a BTCUSDT short position to play the game`)
        } else if (this.longETHPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 0.01, 'ETHUSDT', `we open an ETHUSDT long position to play the game`)
        } else if (this.shortETHPosition === undefined) {
            this.addInvestmentAdvice(Action.SELL, 0.01, 'ETHUSDT', `we open an ETHUSDT short position to play the game`)
        }
    }

    protected closeAll() {
        for (const position of this.fundamentals.positions) {
            try {
                if (position.data.size > 0) {
                    if (position.data.side === 'Buy') {
                        this.addInvestmentAdvice(Action.REDUCELONG, Number(position.data.size), position.data.symbol, `we close ${position.data.size} ${position.data.symbol} long due to fuck it.`)
                    }
                    if (position.data.side === 'Sell') {
                        this.addInvestmentAdvice(Action.REDUCESHORT, Number(position.data.size), position.data.symbol, `we close ${position.data.size} ${position.data.symbol} long due to fuck it.`)
                    }
                }
            } catch (error) {
                console.log(`was geht: ${error.message}`)
            }
        }
    }

    protected executeMartingale() {


        const pnlBTCLong = FinancialCalculator.getPNLOfPositionInPercent(this.longBTCPosition)
        const pnlBTCShort = FinancialCalculator.getPNLOfPositionInPercent(this.shortBTCPosition)
        const pnlETHLong = FinancialCalculator.getPNLOfPositionInPercent(this.longETHPosition)
        const pnlETHShort = FinancialCalculator.getPNLOfPositionInPercent(this.shortETHPosition)

        if (this.liquidityLevel > 5) {
            if (pnlBTCLong < -50) {
                this.addInvestmentAdvice(Action.BUY, 0.001, 'BTCUSDT', `we enhance our BTCUSDT long position to fuck manipulators`)
            }
            if (pnlBTCShort < -50) {
                this.addInvestmentAdvice(Action.SELL, 0.001, 'BTCUSDT', `we enhance our BTCUSDT short position to fuck manipulators`)
            }
            if (pnlETHLong < -50) {
                this.addInvestmentAdvice(Action.BUY, 0.01, 'ETHUSDT', `we enhance our ETHUSDT long position to fuck manipulators`)
            }
            if (pnlETHShort < -50) {
                this.addInvestmentAdvice(Action.SELL, 0.01, 'ETHUSDT', `we enhance our ETHUSDT short position to fuck manipulators`)
            }
        }

        if (pnlBTCLong > 20) {
            this.addInvestmentAdvice(Action.REDUCELONG, this.longBTCPosition.data.size, 'BTCUSDT', `we enhance our BTCUSDT long position to fuck manipulators`)
        }
        if (pnlBTCShort > 20) {
            this.addInvestmentAdvice(Action.REDUCESHORT, this.shortBTCPosition.data.size, 'BTCUSDT', `we enhance our BTCUSDT short position to fuck manipulators`)
        }
        if (pnlETHLong > 20) {
            this.addInvestmentAdvice(Action.REDUCELONG, this.longETHPosition.data.size, 'ETHUSDT', `we enhance our ETHUSDT long position to fuck manipulators`)
        }
        if (pnlETHShort > 20) {
            this.addInvestmentAdvice(Action.REDUCESHORT, this.longETHPosition.data.size, 'ETHUSDT', `we enhance our ETHUSDT short position to fuck manipulators`)
        }




    }

}

