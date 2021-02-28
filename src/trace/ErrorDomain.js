class ErrorDomain {
    constructor(traceId, error) {
        this.traceId = traceId
        this.message = error.message
        this.stack = error.stack
    }

    getError(){
        return {
            traceId: this.traceId,
            message: this.message,
            stackTrace: this.stack
        }
    }
}

module.exports = {
    ErrorDomain
}
