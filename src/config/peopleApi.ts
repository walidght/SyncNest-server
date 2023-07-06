import { google, Auth } from 'googleapis';

export const peopleApi = (oauth2Client: Auth.OAuth2Client) => {
    const people = google.people({ version: 'v1', auth: oauth2Client });

    return people;
};
