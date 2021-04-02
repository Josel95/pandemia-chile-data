import { Product1 } from './Product1'
import { Product19 } from './Product19'

export const getProductsData = async () => {
    const product1 = new Product1('output/producto1/Covid-19.csv')
    const product19 = new Product19('output/producto19/CasosActivosPorComuna.csv')

    return {
        product1: await product1.getData(),
        product19: await product19.getData(),
    }
}   