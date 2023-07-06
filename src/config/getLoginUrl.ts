import { oauth2Client } from './oauth2Client';

// 'online' = default | 'offline' = gets refresh_token
const ACCESS_TYPE = 'offline';

// permissions
const SCOPE = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
];

export const getLoginUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: ACCESS_TYPE,
        scope: SCOPE,
    });
};
