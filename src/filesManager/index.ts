import { File } from 'formidable';
import { renameSync } from 'fs';
import { z } from 'zod';

export const renameFile = (tempFile: File | File[]) => {
    const fileSchema = z.object({
        originalFilename: z.string(),
        filepath: z.string(),
        newFilename: z.string(),
        mimetype: z.string(),
    });

    if (Array.isArray(tempFile)) tempFile = tempFile[0];

    const { originalFilename, filepath, newFilename } =
        fileSchema.parse(tempFile);

    const newFilepath = filepath.replace(
        `\\${newFilename}`,
        `\\${originalFilename}`
    );

    renameSync(filepath, newFilepath);

    return { filename: originalFilename, filepath: newFilepath };
};
