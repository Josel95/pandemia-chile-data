import * as functions from "firebase-functions";

import { process } from './process'

export const pandemiaData = functions.https.onRequest(async (request, response) => {

    const data = await process()

    response.json({
        executed: data
    })
})