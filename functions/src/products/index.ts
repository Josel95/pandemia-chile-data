import { Products } from '../types'

import { Product1 } from './Product1'
import { Product19 } from './Product19'
import { Product38 } from './Product38'
import { Product74 } from './Product74'

export const getProductsData = async (): Promise<Products> => {
    const product1 = new Product1()
    const product19 = new Product19()
    const product38 = new Product38()
    const product74 = new Product74()

    return {
        product1: await product1.getData(),
        product19: await product19.getData(),
        product38: await product38.getData(),
        product74: await product74.getData(),
    }
}   