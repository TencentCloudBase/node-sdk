import { CloudBase } from '../cloudbase';
export declare function auth(cloudbase: CloudBase): {
    getUserInfo(): {
        openId: string;
        appId: string;
        uid: string;
        customUserId: string;
    };
    getClientIP(): string;
    createTicket: (uid: any, options?: any) => string;
};
