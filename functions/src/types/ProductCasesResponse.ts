
export interface ProductCasesResponse {
    [locationCode: string]: {
        locationName: string
        currentCases: number
        historicalCases: {
            [date: string]: number
        } | null
    }
}