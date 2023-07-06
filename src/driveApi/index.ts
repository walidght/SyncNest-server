import { Auth } from 'googleapis';
import { driveApi } from '../config/driveApi';
import { ReadStream } from 'fs';

type FileData = {
    fileMetadata: {
        name: string;
        parents: string[];
    };
    media: {
        mimeType: string;
        body: ReadStream;
    };
};

export const uploadFile = async (
    oauth2Client: Auth.OAuth2Client,
    fileData: FileData
) => {
    const drive = driveApi(oauth2Client);

    const response = await drive.files.create({
        requestBody: fileData.fileMetadata,
        media: fileData.media,
        fields: 'id',
    });

    return response;
};
