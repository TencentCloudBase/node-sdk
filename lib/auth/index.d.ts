import { CloudBase } from '../cloudbase';
import { ICustomReqOpts } from '../type';
export declare function auth(cloudbase: CloudBase): {
    getUserInfo(uid?: string, opts?: ICustomReqOpts): Promise<any> | {
        result: {
            openId: any;
            appId: any;
            uid: any;
            customUserId: any;
            isAnonymous: boolean;
        };
    };
    getAuthContext(context: any): Promise<any>;
    getClientIP(): any;
    createTicket: (uid: any, options?: any) => string;
};
