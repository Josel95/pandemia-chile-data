
export interface NearLocation {
    id: string
    name: string
    paso: number
}

export interface LocationFirebase {
    id: string
    name: string
    latitude: number
    longitude: number
    paso: number
    activeCases: number
    deathCases: number
    totalCases: number
    nearComunas: NearLocation[]
}
