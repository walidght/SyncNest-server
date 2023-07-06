import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as fs from 'fs';
import cookieParser from 'cookie-parser';

import { formidable } from './config/formidable';
import { oauth2Client } from './config/oauth2Client';
import { getLoginUrl } from './config/getLoginUrl';
import { sortByName } from './utils/sortByName';
import { driveApi } from './config/driveApi';
import { getUserProfile } from './google/peopleService';
import { z } from 'zod';
import { uploadFile } from './driveApi';
import { renameFile } from './filesManager';
import { generateCookie, verifyCookie } from './cookiesManager';

const url = getLoginUrl();

/**/

const app = express();
app.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173',
    })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(async (req, res, next) => {
    const access_token_cookie = req.cookies?.access_token;
    const refresh_token_cookie = req.cookies?.refresh_token;

    try {
        const parsedAccessToken = verifyCookie(access_token_cookie);
        if (access_token_cookie && parsedAccessToken) {
            res.locals.payload = parsedAccessToken;
            res.locals.access_token = parsedAccessToken.access_token;
            res.locals.refresh_token = refresh_token_cookie;
        } else if (refresh_token_cookie) {
            // make new access token
            oauth2Client.setCredentials({
                refresh_token: refresh_token_cookie,
            });
            const access_token = await oauth2Client.getAccessToken();

            if (!access_token.token) throw new Error('User Unauthenticated');

            const payload = { email: '', access_token: access_token.token };

            const access_token_cookie = [
                'access_token',
                generateCookie(payload),
                {
                    maxAge: 3600000,
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                },
            ] as const;

            res.locals.payload = payload;
            res.locals.access_token = access_token.token;
            res.locals.refresh_token = refresh_token_cookie;
            res.cookie(...access_token_cookie);
        } else {
            throw new Error('User Unauthenticated');
        }
        next();
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message);
        } else {
            console.error('An unknown error occurred');
        }

        res.locals.payload = null;
        res.locals.access_token = null;
        res.locals.refresh_token = null;
        next();
    }
});

app.get('/api/check-auth', async (req, res) => {
    if (res.locals.access_token) res.status(200).send({ success: true });
    else res.status(401).send({ success: false });
});

app.get('/api/login-url', async (req: Request, res: Response) => {
    res.send({ success: true, loginUrl: url });
});

app.get('/api/logout', async (req: Request, res: Response) => {
    const access_token_cookie = [
        'access_token',
        '',
        {
            maxAge: 1,
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        },
    ] as const;

    const refresh_token_cookie = [
        'refresh_token',
        '',
        {
            maxAge: 1,
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        },
    ] as const;

    res.cookie(...refresh_token_cookie)
        .cookie(...access_token_cookie)
        .send({ success: true });
});

app.get('/api/make-tokens', async (req: Request, res: Response) => {
    try {
        const params = req.query;
        const code = z.string().parse(params.code);

        const response = await oauth2Client.getToken(code);
        const { access_token, refresh_token } = response.tokens;

        if (!access_token || !refresh_token)
            return res.status(401).send({ success: false });

        oauth2Client.setCredentials({ access_token });
        const userProfile = await getUserProfile(oauth2Client);
        const payload = {
            email: userProfile.email,
            access_token: access_token,
        };

        const access_token_cookie = [
            'access_token',
            generateCookie(payload),
            {
                maxAge: 3600000,
                httpOnly: true,
                sameSite: 'none',
                secure: true,
            },
        ] as const;

        const refresh_token_cookie = [
            'refresh_token',
            refresh_token,
            {
                maxAge: 15552000000,
                httpOnly: true,
                sameSite: 'none',
                secure: true,
            },
        ] as const;

        res.cookie(...refresh_token_cookie)
            .cookie(...access_token_cookie)
            .send({ access_token, refresh_token });
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
        res.status(401).send({ success: false });
    }
});

app.get('/api/user', async (req: Request, res: Response) => {
    try {
        const credentials = { access_token: res.locals.access_token };
        oauth2Client.setCredentials(credentials);

        const userProfile = await getUserProfile(oauth2Client);

        if (!userProfile)
            throw new Error('Something went wrong while getting user data');
        res.status(200).send({ success: true, userProfile });
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
        res.status(401).send({ success: false });
    }
});

app.post('/api/file', async (req: Request, res: Response) => {
    try {
        const credentials = { access_token: res.locals.access_token };
        oauth2Client.setCredentials(credentials);

        const form = formidable();
        const [fields, files] = await form.parse(req);

        // getting upload data
        const { folderId } = {
            folderId: fields.folderId[0],
        };

        // renaming temp file
        const { filename, filepath } = renameFile(files['document']);

        const fileObject = {
            fileMetadata: {
                name: filename,
                parents: [folderId],
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fs.createReadStream(filepath),
            },
        };

        const response = await uploadFile(oauth2Client, fileObject);

        // deleting file from local storage after upload
        fs.unlinkSync(filepath);

        res.status(200).send({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
        res.status(401).send({ success: false });
    }
});

/**/

app.get('/drive', async (req: Request, res: Response) => {
    const params = req.query;

    const credentialsSchema = z.object({
        access_token: z.string(),
        refresh_token: z.string(),
    });
    const paramsSchema = z.object({ credentials: z.string() });

    try {
        const credentialsString = paramsSchema.parse(params).credentials;
        const credentials = credentialsSchema.parse(
            JSON.parse(credentialsString)
        );

        oauth2Client.setCredentials(credentials);
        const drive = driveApi(oauth2Client);
        // const response = await drive.files.create({
        //     requestBody: {
        //         name: 'Test',
        //         mimeType: 'text/plain',
        //     },
        //     media: {
        //         mimeType: 'text/plain',
        //         body: 'Hello World',
        //     },
        // });

        // info about a folder
        // try {
        //     const folder = await drive.files.get({
        //         fileId: '1NkN2zHkXDkWW4u9XK-QtyIF0efnG-C8a',
        //         fields: 'id, name, mimeType, createdTime, modifiedTime, parents',
        //     });
        //     console.log(folder.data);
        // } catch (err) {
        //     console.log('failed to get folder 403, getting new access token');
        //     const refresh_token = credentials.refresh_token;
        //     const access_token = await getAccessTokenFromRefreshToken(
        //         credentials.refresh_token
        //     );
        //     oauth2Client.setCredentials({ refresh_token, access_token });
        //     const drive = google.drive({
        //         version: 'v3',
        //         auth: oauth2Client,
        //     });
        //     const folder = await drive.files.get({
        //         fileId: '1NkN2zHkXDkWW4u9XK-QtyIF0efnG-C8a',
        //         fields: 'id, name, mimeType, createdTime, modifiedTime, parents',
        //     });
        //     console.log(folder.data);
        // }

        // content of a folder
        // const folders = await drive.files.list({
        //     q: `'1NkN2zHkXDkWW4u9XK-QtyIF0efnG-C8a' in parents`,
        //     fields: 'files(id, name, mimeType)',
        // });

        //  lists all folders in "my drive"
        const folders = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false",
        });

        // console.log(folders.data);

        const folderList = folders.data.files;
        if (!folderList) return;

        const sortedFolderList = sortByName(folderList);
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
    }
});

app.listen(5500, () => {
    console.log('Listening on port 5500');
});
