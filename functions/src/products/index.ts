import { Product1 } from './Product1'
import { Product19 } from './Product19'
import { Product38 } from './Product38'

export const getProductsData = async () => {
    const product1 = new Product1()
    const product19 = new Product19()
    const product38 = new Product38()

    return {
        product1: await product1.getData(),
        product19: await product19.getData(),
        product38: await product38.getData(),
    }
}   