function info(message: any, namespace: string) {
    if (process.env.REBUGIT_LOG === "ALL") {
        console.log(_getNamespace(namespace, 'INFO'), JSON.stringify(message, null, 2))
    }
}

function error(err: Error, namespace: string) {
    if (process.env.REBUGIT_LOG === "ALL") {
        console.log(_getNamespace(namespace, 'ERROR'), err.message, err.stack)
    }
}

function _getNamespace(namespace: string, level: string): string {
    return namespace ? `[REBUGIT] ${level} <${namespace}>:` : `[REBUGIT] ${level}:`
}

module.exports = {
    info,
    error
}
