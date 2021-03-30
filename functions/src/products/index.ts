import { Product1 } from './Product1'

export const getProductsData = async () => {
    const product1 = new Product1('output/producto1/Covid-19.csv')

    return {
        product1: await product1.getData()
    }
}   