const functions = require("firebase-functions");

const firebase = require('firebase-admin')

const dataComunas = require('./data/dataComunas.json')

const { Octokit } = require('@octokit/rest')

// Firebase initialization
firebase.initializeApp()

const db = firebase.firestore()

// Download csv from minsal github
// https://github.com/MinCiencia/Datos-COVID19

const downloadMinsalData = async () => {
    const octokit = new Octokit()

    const { data: { sha, content, encoding } } = await octokit.repos.getContent({
        owner: 'MinCiencia',
        repo: 'Datos-COVID19',
        path: 'input/Paso_a_paso/paso_a_paso.csv'
    })

    const decodedContent = Buffer.from(content, encoding).toString()

    return {sha, decodedContent}
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
            [item.key]: item.value
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

const getLastSha = async () => {
    const snapshot = await db.
        collection('lastSha')
        .doc('lastSha')
        .get('sha')

    const sha = snapshot.get('sha')

    return sha
}

const setLastSha = async (sha) => {
    await db.collection('lastSha')
        .doc('lastSha')
        .set({
            sha
        })
}

const compareWithLastSha = async (sha) => {
    const lastSha = await getLastSha()
    return lastSha === sha
}

const main = async () => {
    // Get, transform and consolidate data
    const {sha, decodedContent: minsalData} = await downloadMinsalData()

    if(await compareWithLastSha(sha)) {
        console.info('The data has not changed')
        return
    }

    const pasosByComuna = getPasosByComuna(minsalData)
    const consolidatedData = consolidateData(pasosByComuna, dataComunas)
    const convertedCoords = convertCoords(consolidatedData)
    const comunas = getNearComunas(convertedCoords, 15)

    console.info('Uploading new data')
    await uploadFirestore(comunas)

    await setLastSha(sha)
}

exports.pandemiaDataScheduled = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    await main()
    return null;
});

/* Test only */
// exports.pandemiaData = functions.https.onRequest(async (req, res) => {
//     await main()

//     res.json({
//         executed: true
//     })
// })