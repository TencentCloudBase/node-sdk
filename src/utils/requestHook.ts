/**
 * 处理wxopenapi返回
 *
 * @param err
 * @param response
 * @param body
 */
export const handleWxOpenApiData = (res: any, err: any, response: any, body: any): any => {
  // wx.openApi 调用时，需用content-type区分buffer or JSON
  const { headers } = response
  if (headers['content-type'] === 'application/json; charset=utf-8') {
    res = JSON.parse(res.toString()) // JSON错误时buffer转JSON
  }
  return res
}
