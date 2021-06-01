import axios, { AxiosResponse } from 'axios'

export const kMetadataBaseUrl = 'http://metadata.tencentyun.com'

export enum kMetadataVersions {
  'v20170919' = '2017-09-19',
  'v1.0'      = '1.0',
  'latest'    = 'latest'
}

export function isAppId(appIdStr: string) {
  return /^[1-9][0-9]{4,64}$/gim.test(appIdStr)
}

export async function lookup(path: string): Promise<string> {
  const url = `${kMetadataBaseUrl}/${kMetadataVersions.latest}/${path}`
  const resp: AxiosResponse = await axios.get(url)
  if (resp.status === 200) {
    return resp.data
  }
  else {
    throw new Error(`[ERROR] GET ${url} status: ${resp.status}`)
  }
}

const metadataCache = {
  appId: undefined
}
export async function lookupAppId(): Promise<string> {
  if (metadataCache.appId === undefined) {
    metadataCache.appId = ''
    try {
      const appId = await lookup('meta-data/app-id')
      if (isAppId(appId)) {
        metadataCache.appId = appId
      }
    }
    catch (e) {
      console.warn('[WARN] lookupAppId error: ', e.message)
    }
  }
  return metadataCache.appId || ''
}
