
export const kMetadataBaseUrl = 'http://metadata.tencentyun.com'

export enum kMetadataVersions {
  'v20170919' = '2017-09-19',
  'v1.0'      = '1.0',
  'latest'    = 'latest'
}

import request from 'request'

export function lookup(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `${kMetadataBaseUrl}/${kMetadataVersions.latest}/${path}`
    request.get(url, (e: Error, res, body) => {
        if (e) {
          reject(e)
        } else {
          if (res.statusCode === 200) {
            resolve(body)
          }
        }
    })
  })
}

export function lookupAppId(): Promise<string> {
  return lookup('meta-data/app-id') as Promise<string>
}
