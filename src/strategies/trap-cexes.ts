import { InvestmentAdvice } from "../../mod.ts"
import { VFLogger } from "../utilities/logger.ts";
import { VoFarmStrategy } from "./vofarm-strategy.ts";
import { initialPositionInsights } from "../constants/initial-position-insights.ts";
import { IPositionInsights } from "../interfaces/insights.ts";


export class TrapCexes extends VoFarmStrategy {

    protected positionInsights: IPositionInsights[] = []

    public constructor(logger: VFLogger) {
        super(logger)
        this.positionInsights = initialPositionInsights
    }



    public async getInvestmentAdvices(input: any): Promise<InvestmentAdvice[]> {

        this.currentInvestmentAdvices = []

        await this.collectFundamentals(input.exchangeConnector)

        const pair = 'ENSUSDT'
        const ensPosition = this.fundamentals.positions.filter((p: any) => p.data.symbol === pair && p.data.side === 'Buy')[0]

        console.log(JSON.stringify(ensPosition))
        const price = Number((ensPosition.data.position_value / ensPosition.data.size).toFixed(2))
        console.log(price)
        // const result = await input.exchangeConnector.setStopLoss(pair, price - 1, 'Buy')

        // console.log(JSON.stringify(result))




        return this.currentInvestmentAdvices

    }



}

