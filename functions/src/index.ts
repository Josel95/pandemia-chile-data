import * as functions from "firebase-functions";

export const pandemiaChile = functions.https.onRequest((request, response) => {
    response.json({
        executed: true
    })
})