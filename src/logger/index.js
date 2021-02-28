function info(message, namespace) {
    if (process.env.REBUGIT_DEBUG === "ALL") {
        console.log(_getNamespace(namespace), JSON.stringify(message))
    }
}

function error(err, namespace) {
    if (process.env.REBUGIT_DEBUG === "ALL") {
        console.log(_getNamespace(namespace), err.message, err.stack)
    }
}

function _getNamespace(namespace) {
    return namespace ? `[REBUGIT] <${namespace}>:` : '[REBUGIT]:'
}

module.exports = {
    info,
    error
}
