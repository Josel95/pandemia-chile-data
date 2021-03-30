interface SummableObject {
    [key: string]: any
}

export const addObjects = (a: SummableObject, b: SummableObject) => {
    if(a === null) return {...b}
    if(b === null) return {...a}

    const c: SummableObject = {}
    Object.keys(a).forEach((aKey) => {
        c[aKey] = a[aKey] + b[aKey]
    })
    return c
}