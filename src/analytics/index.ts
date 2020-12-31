import httpRequest from '../utils/httpRequest'
import { IAnalyticsDataItem, IReportData } from '../type'
import { E } from '../utils/utils'
import { ERROR } from '../const/code'
import { CloudBase } from '../cloudbase'


const reportTypes = ['mall']


function validateAnalyticsData(data: IReportData): boolean {
    if (Object.prototype.toString.call(data).slice(8, -1) !== 'Object') {
        return false
    }

    const { report_data, report_type } = data

    if (reportTypes.includes(report_type) === false) {
        return false
    }

    if (Object.prototype.toString.call(report_data).slice(8, -1) !== 'Object') {
        return false
    }

    if (!Number.isInteger(report_data.action_time)) {
        return false
    }

    if (typeof report_data.action_type !== 'string') {
        return false
    }
    return true

}

export async function analytics(
    cloudbase: CloudBase,
    requestData: IReportData,
): Promise<void> {
    // 获取openid, wxappid
    const {
        WX_OPENID,
        WX_APPID,
    } = CloudBase.getCloudbaseContext()

    if (!validateAnalyticsData(requestData)) {
        throw E({
            ...ERROR.INVALID_PARAM,
            message:
                '当前的上报数据结构不符合规范'
        })
    }

    const transformRequestData: IAnalyticsDataItem = {
        analytics_scene: requestData.report_type,
        analytics_data: { openid: WX_OPENID,
            wechat_mini_program_appid: WX_APPID, ...requestData.report_data}
    }

    const params = {
        action: 'analytics.report',
        requestData: transformRequestData
    }

    return httpRequest({
        config: cloudbase.config,
        params,
        method: 'post',
        headers: {
            'content-type': 'application/json'
        }
    })
}

