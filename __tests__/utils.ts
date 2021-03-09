import * as crypto from "crypto";

export const sha1 = (value: string): string => {
    const hash = crypto.createHash('sha1')
    hash.update(value)
    return hash.digest('hex')
}

export const clearEnvironmentVariables = (): void => {
    for (const key of Object.keys(process.env)) {
        if (key.toUpperCase().startsWith('REBUGIT_')) {
            delete process.env[key];
        }
    }
};
