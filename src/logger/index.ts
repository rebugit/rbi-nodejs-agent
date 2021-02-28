function info(message: any, namespace: string) {
    if (process.env.REBUGIT_DEBUG === "ALL") {
        console.log(_getNamespace(namespace), JSON.stringify(message, null, 2))
    }
}

function error(err: Error, namespace: string) {
    if (process.env.REBUGIT_DEBUG === "ALL") {
        console.log(_getNamespace(namespace), err.message, err.stack)
    }
}

function _getNamespace(namespace: string): string {
    return namespace ? `[REBUGIT] <${namespace}>:` : '[REBUGIT]:'
}

module.exports = {
    info,
    error
}
