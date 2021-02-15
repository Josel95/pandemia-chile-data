const functions = require("firebase-functions");

const fs = require('fs')

const path = require('path')

const firebase = require("firebase")

require("firebase/firestore")

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * This file have to contain the firebase credentials with the following format:
 * Documentation: https://firebase.google.com/docs/web/setup?hl=es
 *  {
 *      "apiKey": "AIzaSyDOCAbC123dEf456GhI789jKl01-MnO",
 *      "authDomain": "myapp-project-123.firebaseapp.com",
 *      "databaseURL": "https://myapp-project-123.firebaseio.com",
 *      "projectId": "myapp-project-123",
 *      "storageBucket": "myapp-project-123.appspot.com",
 *      "messagingSenderId": "65211879809",
 *      "appId": "1:65211879909:web:3ae38ef1cdcb2e01fe5f0c",
 *      "measurementId": "G-8GSGZQ44ST"
 *  }
 */
const firebaseCredentials = require('./firebaseCredentials.json')

const axios = require('axios')

const dataComunas = require('./data/dataComunas.json')

// Firebase initialization
const firebaseApp = firebase.initializeApp(firebaseCredentials)

const db = firebase.firestore()

// Download csv from minsal github
// https://github.com/MinCiencia/Datos-COVID19

const downloadMinsalData = async () => {
    const url = 'https://raw.githubusercontent.com/MinCiencia/Datos-COVID19/master/input/Paso_a_paso/paso_a_paso.csv'

    const { data } = await axios.get(url)

    return data
}

// Get the comuna id and the current paso
const getPasosByComuna = (minsalData) => {
    const lines = minsalData.split("\n")

    return lines.map((line, index) => {
        // If line is empty
        if (line === "") {
            return
        }

        // Header of csv
        if (index === 0) {
            return
        }

        const columns = line.split(',')
        const idComuna = parseInt(columns[2])
        const paso = parseInt(columns[columns.length - 1])

        return {
            key: idComuna,
            value: paso
        }
    }).reduce((object, item) => {
        if (!item) return object
        return {
            ...object,
            [item?.key]: item?.value
        }
    }, {})
}

/**
 * Calculate distances between two coordinates on spherical earth
 * https://www.movable-type.co.uk/scripts/latlong.html
 */
const calculateHaversine = (locationA, locationB) => {
    const lat1 = locationA.latitude
    const lat2 = locationB.latitude

    const lon1 = locationA.longitude
    const lon2 = locationB.longitude

    const R = 6371e3 // metres
    const φ1 = lat1 * Math.PI / 180 // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const d = R * c // in metres

    return d
}

const getNearLocations = (currentLocation, locations, top) => {
    const currentCoords = { latitude: currentLocation.latitude, longitude: currentLocation.longitude }

    const sorted = locations.sort((a, b) => {
        const aCoords = { latitude: a.latitude, longitude: a.longitude }
        const bCoords = { latitude: b.latitude, longitude: b.longitude }

        return calculateHaversine(currentCoords, aCoords) - calculateHaversine(currentCoords, bCoords)
    })

    const sliced = sorted.slice(1, top + 1)

    return sliced
}

const getNearComunas = (comunas, top = 10) => {
    const wtf = [...comunas]

    return wtf.map(comuna => {        
        const { latitude, longitude } = comuna

        const nearComunas = getNearLocations({ latitude, longitude }, comunas, top)
    
        return {
            ...comuna,
            nearComunas
        }
    })
}

const consolidateData = (pasosByComuna, dataComunas) => {
    return dataComunas.map(comuna => {
        return {
            ...comuna,
            paso: pasosByComuna[+comuna.id]
        }
    })
}

const sexagesimalToDecimal = (coord) => {
    const regex = /(?<degrees>[-+]?\d+)°(?<minutes>\d+(\.\d+)?)'(?<seconds>\d+(\.\d+)?)"?/
    const match = coord.match(regex)
    if (match) {
        const degrees = parseFloat(match.groups['degrees'])
        const minutes = parseFloat(match.groups['minutes'])
        const seconds = parseFloat(match.groups['seconds'])

        return degrees + (minutes / 60) + (seconds / 3600)
    }

    throw `Error converting coord ${coord}`
}

const convertCoords = (comunas) => {
    return comunas.map(comuna => {
        return {
            ...comuna,
            longitude: sexagesimalToDecimal(comuna.longitude),
            latitude: sexagesimalToDecimal(comuna.latitude),
        }
    })
}

const saveSnapshot = (comunas) => {
    fs.writeFileSync(`${__dirname}/data/snapshot.json`, JSON.stringify(comunas))
}

const readSnapshot = () => {
    const data = fs.readFileSync(`${__dirname}/data/snapshot.json`)
    return JSON.parse(data)
}

const checkSnapshotExists = () => {
    return fs.existsSync(`${__dirname}/data/snapshot.json`)
}

// Returns the elements where property paso has changed
const compareComunasWithSnapshot = (snapshot, comunas) => {
    return comunas.filter(comuna => {
        const comunaSnapshot = snapshot.find(s => s.id === comuna.id)

        return comuna.paso != comunaSnapshot.paso
    })
}

const uploadFirestore = async (comunas) => {
    const promises = comunas.map((object, index) => {
        return new Promise((resolve, reject) => {
            db.collection('comunas')
                .doc(object.name.toLowerCase())
                .set(object)
                .then(() => {
                    console.log(`comuna: ${object.name} -- ${index + 1}/${comunas.length}`)
                    resolve()
                })
                .catch(() => {
                    reject()
                })
        })
    })

    await Promise.all(promises)
}

(async () => {
    // Get, transform and consolidate data
    const minsalData = await downloadMinsalData()
    const pasosByComuna = getPasosByComuna(minsalData)
    const consolidatedData = consolidateData(pasosByComuna, dataComunas)
    const convertedCoords = convertCoords(consolidatedData)
    const comunas = getNearComunas(convertedCoords, 15)

    // Check what data has changed from last run

    if (checkSnapshotExists()) {
        const snapshotComunas = readSnapshot()
        const changedComunas = compareComunasWithSnapshot(snapshotComunas, comunas)
        await uploadFirestore(changedComunas)
    }else {
        await uploadFirestore(comunas)
    }

    console.log("Close connection")
    // Close firebase connection
    firebaseApp.delete()

    saveSnapshot(comunas)
})()
