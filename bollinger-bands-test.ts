// import { BollingerBandsService, IBollingerBands } from "https://deno.land/x/bollinger_bands@v0.1.0/mod.ts"
import { BollingerBandsService, IBollingerBands } from "./bollinger-bands-service.ts"

const testSequenceMayBePricesOrPNLs = [4, 50]

const bollingerBands: IBollingerBands = BollingerBandsService.getBollingerBands(testSequenceMayBePricesOrPNLs)

console.log(bollingerBands.sma)
console.log(bollingerBands.lower)
console.log(bollingerBands.upper) 