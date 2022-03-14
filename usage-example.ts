import { LogLevel } from "./mod.ts";
import { LongShortBaseETHStrategy } from "./src/strategies/long-short-base-eth-strategy.ts"
import { VFLogger } from "./src/utilities/logger.ts";

const longShortExploitStrategy: LongShortBaseETHStrategy = new LongShortBaseETHStrategy(new VFLogger("api key not secret e.g. in case you want to filter your logs for it... ", LogLevel.INFO))

const testInput1 = {
    accountInfo: { result: { USDT: { available_balance: 100, equity: 100 } } },
    positions: [],
}

let investmentAdvices = await longShortExploitStrategy.getInvestmentAdvices(testInput1)

console.log(`\ngiven testInput1, this strategy recommends to: ${JSON.stringify(investmentAdvices)}`)

const testInput2 = {
    accountInfo: { result: { USDT: { available_balance: 100, equity: 100 } } },
    positions: [
        { data: { side: "Buy", symbol: 'BTCUSDT', size: 0.01, position_value: 500, leverage: 100, unrealised_pnl: -20 } },
        { data: { side: "Sell", symbol: 'BTCUSDT', size: 0.01, position_value: 500, leverage: 100, unrealised_pnl: 1 } }],
}

investmentAdvices = await longShortExploitStrategy.getInvestmentAdvices(testInput2)

console.log(`\ngiven testInput2, this strategy recommends to: ${JSON.stringify(investmentAdvices)}`)
