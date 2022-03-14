import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts"
import { PeakNDipService } from "./peak-n-dip-service.ts";


Deno.test("should return EBloomBool.NO if entry is not yet added", async () => {

    let lowestSinceX

    const array1 = [1, 2, 3, 4, 5]
    lowestSinceX = PeakNDipService.getLowestSinceX(array1, 1)
    assertEquals(lowestSinceX, 4)

    const array2 = [2, 1, 3, 4, 5]
    lowestSinceX = PeakNDipService.getLowestSinceX(array2, 2)
    assertEquals(lowestSinceX, 0)

})