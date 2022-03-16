import { Action, InvestmentAdvice } from "../../mod.ts"
import { FinancialCalculator } from "../utilities/financial-calculator.ts"
import { VFLogger } from "../utilities/logger.ts";
import { VoFarmStrategy } from "./vofarm-strategy.ts";


export abstract class BuyLowSellHigh extends VoFarmStrategy {

    protected iterationCount = 0
    protected overallLSD: number = 0
    protected overallPNL: number = 0
    protected triggerForUltimateProfitTaking: number = 1 // 0.1
    protected generalClosingTrigger: number = 100
    protected historyLength = 1000
    protected pauseCounter = 0
    protected longBTCPosition: any
    protected longETHPosition: any
    protected longARPosition: any
    protected longSOLPosition: any
    protected longADAPosition: any
    protected longENSPosition: any
    protected longDOTPosition: any

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

        this.executeBuyLowSellHigh()
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
        this.longETHPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'ETHUSDT')[0]
        this.longENSPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'ENSUSDT')[0]
        this.longDOTPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'DOTUSDT')[0]
        this.longADAPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'ADAUSDT')[0]
        this.longSOLPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'SOLUSDT')[0]
        this.longARPosition = this.fundamentals.positions.filter((p: any) => p.data.side === 'Buy' && p.data.symbol === 'ARUSDT')[0]

        if (this.fundamentals.accountInfo.result.USDT.equity === 0) {
            throw new Error(`are you kidding me - how should I make money without an investment? :)`)
        } else if (this.longBTCPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 0.001, 'BTCUSDT', `we open a BTCUSDT long position to play the game`)
        } else if (this.longETHPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 0.01, 'ETHUSDT', `we open an ETHUSDT long position to play the game`)
        } else if (this.longENSPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 0.1, 'ENSUSDT', `we open a ENSUSDT long position to play the game`)
        } else if (this.longSOLPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 1, 'SOLUSDT', `we open an SOLUSDT long position to play the game`)
        } else if (this.longADAPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 1, 'ADAUSDT', `we open a ADAUSDT long position to play the game`)
        } else if (this.longDOTPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 1, 'DOTUSDT', `we open an DOTUSDT long position to play the game`)
        } else if (this.longARPosition === undefined) {
            this.addInvestmentAdvice(Action.BUY, 1, 'ARUSDT', `we open an ARUSDT long position to play the game`)
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

    protected executeBuyLowSellHigh() {


        const pnlBTCLong = FinancialCalculator.getPNLOfPositionInPercent(this.longBTCPosition)
        const pnlETHLong = FinancialCalculator.getPNLOfPositionInPercent(this.longETHPosition)
        const pnlARLong = FinancialCalculator.getPNLOfPositionInPercent(this.longARPosition)
        const pnlSOLLong = FinancialCalculator.getPNLOfPositionInPercent(this.longSOLPosition)
        const pnlADALong = FinancialCalculator.getPNLOfPositionInPercent(this.longADAPosition)
        const pnlENSLong = FinancialCalculator.getPNLOfPositionInPercent(this.longENSPosition)
        const pnlDOTLong = FinancialCalculator.getPNLOfPositionInPercent(this.longDOTPosition)

        if (this.liquidityLevel > 11) {
            if (pnlBTCLong < -11) {
                this.addInvestmentAdvice(Action.BUY, 0.001, 'BTCUSDT', `we enhance our BTCUSDT long position to fuck manipulators`)
            }
            if (pnlETHLong < -11) {
                this.addInvestmentAdvice(Action.BUY, 0.01, 'ETHUSDT', `we enhance our ETHUSDT long position to fuck manipulators`)
            }
            if (pnlENSLong < -11) {
                this.addInvestmentAdvice(Action.BUY, 0.1, 'ENSUSDT', `we enhance our ENSUSDT long position to fuck manipulators`)
            }
            if (pnlSOLLong < -11) {
                this.addInvestmentAdvice(Action.BUY, 1, 'SOLUSDT', `we enhance our SOLUSDT long position to fuck manipulators`)
            }
            if (pnlADALong < -11) {
                this.addInvestmentAdvice(Action.BUY, 1, 'ADAUSDT', `we enhance our ADAUSDT long position to fuck manipulators`)
            }
            if (pnlDOTLong < -11) {
                this.addInvestmentAdvice(Action.BUY, 1, 'DOTUSDT', `we enhance our DOTUSDT long position to fuck manipulators`)
            }
            if (pnlARLong < -11) {
                this.addInvestmentAdvice(Action.BUY, 1, 'ARUSDT', `we enhance our ARUSDT long position to fuck manipulators`)
            }
        }

        if (pnlETHLong > 20 && this.longETHPosition.data.size > 11.11) {
            this.addInvestmentAdvice(Action.REDUCELONG, 0.01, 'ETHUSDT', `we reduce our ETHUSDT long position to fuck manipulators`)
        }
        // if (pnlENSLong > 20 && this.longENSPosition.data.size > 1111.1) { // we're not selling :) :) 
        //     this.addInvestmentAdvice(Action.REDUCELONG, 0.1, 'ENSUSDT', `we reduce our ENSUSDT long position to fuck manipulators`)
        // }
        if ((pnlBTCLong > 20 && this.longBTCPosition.data.size > 0.001) || (pnlBTCLong > 100 && this.longBTCPosition.data.size === 0.001)) {
            this.addInvestmentAdvice(Action.REDUCELONG, 0.001, 'BTCUSDT', `we reduce our BTCUSDT long position to fuck manipulators`)
        }
        if ((pnlSOLLong > 20 && this.longSOLPosition.data.size > 1 || (pnlSOLLong > 100 && this.longSOLPosition.data.size === 0.001))) {
            this.addInvestmentAdvice(Action.REDUCELONG, 1, 'SOLUSDT', `we reduce our SOLUSDT long position to fuck manipulators`)
        }
        if ((pnlADALong > 20 && this.longADAPosition.data.size > 1) || (pnlADALong > 100 && this.longADAPosition.data.size === 0.001)) {
            this.addInvestmentAdvice(Action.REDUCELONG, 1, 'ADAUSDT', `we reduce our ADAUSDT long position to fuck manipulators`)
        }
        if ((pnlDOTLong > 20 && this.longDOTPosition.data.size > 1) || (pnlDOTLong > 100 && this.longDOTPosition.data.size === 0.001)) {
            this.addInvestmentAdvice(Action.REDUCELONG, 1, 'DOTUSDT', `we reduce our ENSUSDT long position to fuck manipulators`)
        }
        if ((pnlARLong > 20 && this.longARPosition.data.size > 1) || (pnlARLong > 100 && this.longARPosition.data.size === 0.001)) {
            this.addInvestmentAdvice(Action.REDUCELONG, 1, 'ARUSDT', `we reduce our ENSUSDT long position to fuck manipulators`)
        }




    }

}

