import formidableLib from 'formidable';

export const formidable = () =>
    formidableLib({
        uploadDir: './temp',
        maxFileSize: 1024 * 1024 * 10,
    });
