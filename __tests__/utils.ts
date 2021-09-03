import * as crypto from "crypto";
import util from 'util';
import dns from 'dns';
const lookup = util.promisify(dns.lookup);

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

export async function nslookup(domainName) {
    return (await (lookup(domainName))).address
}