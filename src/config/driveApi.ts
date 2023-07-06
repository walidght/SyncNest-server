import { google, Auth } from 'googleapis';

export const driveApi = (oauth2Client: Auth.OAuth2Client) => {
    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client,
    });

    return drive;
};
