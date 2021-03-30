import * as functions from "firebase-functions";

import { getProductsData } from './products'

export const pandemiaData = functions.https.onRequest(async (request, response) => {

    const data = await getProductsData()

    response.json({
        executed: data
    })
})