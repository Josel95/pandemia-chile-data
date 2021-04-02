import { Location, Products, LocationFirebase } from '../types'

import * as locations from '../data/locations.json'

import { getProductsData } from '../products'

export const process = async () => {
    const products = await getProductsData()
    return consolidate(products, locations)
}

const consolidate = (products: Products, locations: Location[]): (LocationFirebase | null)[] => {
    return locations.map(location => {

        // TODO: Log if a product content is null
        if(!products.product1.content) {
            return null
        }

        if(!products.product19.content) {
            return null
        }

        if(!products.product38.content) {
            return null
        }

        if(!products.product74.content) {
            return null
        }

        return {
            id: location.locationCode,
            name: location.locationName,
            latitude: location.latitude,
            longitude: location.longitude,
            paso: products.product74.content[location.locationCode].currentCases,
            activeCases: products.product19.content[location.locationCode].currentCases,
            deathCases: products.product38.content[location.locationCode].currentCases,
            totalCases: products.product1.content[location.locationCode].currentCases,
            nearComunas: []
        }
    })
}