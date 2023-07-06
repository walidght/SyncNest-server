import jwt from 'jsonwebtoken';

type Payload = {
    email: string;
};

export const generateCookie = (
    name: string,
    value: string,
    options?: { maxAge?: number }
) => {
    const maxAge = options?.maxAge || 3600000;

    return [
        name,
        value,
        {
            maxAge: maxAge,
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        },
    ] as const;
};

export const signCookie = (payload: Payload) => {
    // TODO: get the secret from env variable instead
    const secret = 'tempsecret';
    const age = '1h';

    if (secret === undefined) {
        throw new Error(`Could not find secret in environment variable`);
    }

    return jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn: age,
    });
};

export const verifyCookie = (token: string) => {
    try {
        // TODO: get the secret from env variable instead
        const secret = 'tempsecret';

        if (secret === undefined) {
            throw new Error(`Could not find secret in environment variable`);
        }

        const result = jwt.verify(token, secret);

        return result as jwt.JwtPayload;
    } catch (error) {
        return null;
    }
};
