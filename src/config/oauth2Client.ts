import { google } from 'googleapis';

const CLIENT_ID =
    '492113110386-c3n2040dsegoqup3eog45gqjn83oo696.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:5173';

export const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
