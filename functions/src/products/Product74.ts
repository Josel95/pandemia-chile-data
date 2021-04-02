import { ProductBase, ProductCasesResponse } from './ProductBase'

export class Product74 extends ProductBase<ProductCasesResponse> {
    constructor() {
        super('product74', 'output/producto74/paso_a_paso.csv')
    }

    process() {
        if(!this.content) {
            return null
        }

        let lines = this.content.split('\n')

        if(!lines || lines.length === 0) {
            return null
        }

        const header = lines.shift()?.split(',')

        if(!header) {
            return null
        }

        const result: ProductCasesResponse = {}

        lines.forEach(line => {
            if(!line) {
                return
            }

            const fields = line.split(',')

            const locationCode: number = parseInt(fields[2])
            const locationName: string = fields[3]
            const currentCases: number = parseInt(fields[fields.length - 1])
 
            if(isNaN(locationCode)) {
                return
            }

            if(!locationName.trim()) {
                return
            }

            if(isNaN(currentCases)) {
                return
            }
            
            result[locationCode] = {
                locationName,
                currentCases,
                historicalCases: null
            }
        })

        return result
    }
}