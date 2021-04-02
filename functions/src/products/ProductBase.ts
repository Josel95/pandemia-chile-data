import { Octokit } from '@octokit/rest'

import { DataResponse } from '../types'

export interface Product<T> {
    download: () => void
    process: () => T | null
    getData: () => Promise<DataResponse<T>>
}

export class ProductBase<T> implements Product<T> {
    octokit: Octokit
    path: string
    sha: string | null
    content: string | null

    productName: string

    constructor(productName: string, path: string) {
        this.octokit = new Octokit()
        this.path = path
        this.sha = null
        this.content = null

        this.productName = productName
    }

    async download() {
        const response = await this.octokit.repos.getContent({
            owner: 'MinCiencia',
            repo: 'Datos-COVID19',
            path: this.path
        })

        const { sha, content, encoding } = { ...response.data }

        if(!sha || !content || !encoding) {
            return
        }

        const decodedContent = Buffer.from(content, encoding).toString()

        this.sha = sha

        this.content = decodedContent
    }

    process(): T | null {
        return null
    }

    async getData() {
        await this.download()

        return {
            sha: this.sha,
            content: this.process() 
        }
    }
}