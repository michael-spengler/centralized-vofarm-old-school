export interface IBollingerBands {
    sma: number[]
    lower: number[]
    upper: number[]
}

export class BollingerBandsService {


    public static getBollingerBands(sequence: number[]): IBollingerBands {

        const smaBand = BollingerBandsService.getSMABand(sequence)
        const lowerBand: number[] = []
        const upperBand: number[] = []

        let counter = 0

        for (const entry of smaBand) {
            const helperBand = [...smaBand]

            const splicedHelperBand = helperBand.splice(counter, helperBand.length)
            const standardDeviation = BollingerBandsService.getStandardDeviation(splicedHelperBand)

            const lower = entry - (standardDeviation * 2)
            const upper = entry + (standardDeviation * 2)
            lowerBand.push(lower)
            upperBand.push(upper)

            console.log(lower, upper)
            counter++
        }

        return {
            sma: smaBand,
            lower: lowerBand,
            upper: upperBand
        }
    }


    public static getSMABand(sequence: number[]): number[] {

        let counter = 0
        let sum = 0
        let result = []

        for (const entry of sequence) {
            counter++
            sum = sum + entry

            result.push(sum / counter)
        }

        return result

    }

    public static getStandardDeviation(sequence: number[]) {

        const average = BollingerBandsService.calculateAverage(sequence)

        const substractedMeanFromEachAndSquared = BollingerBandsService.substractMeanFromEachAndSquare(sequence, average)

        const meanOfSquaredDifferences = BollingerBandsService.calculateAverage(substractedMeanFromEachAndSquared)

        return Math.sqrt(meanOfSquaredDifferences)

    }


    public static calculateAverage(sequence: number[]) {

        let sum = 0

        for (const entry of sequence) {
            sum = sum + entry
        }

        return sum / sequence.length

    }

    private static substractMeanFromEachAndSquare(sequence: number[], average: number): number[] {

        let squaredDifferences = []

        for (const entry of sequence) {
            squaredDifferences.push((entry - average) ** 2)
        }

        return squaredDifferences
    }

}