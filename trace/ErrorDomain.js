class ErrorDomain {
    constructor(traceId, error) {
        this.traceId = traceId
        this.message = error.message
        this.stackTrace = error.stackTrace
    }

    getError(){
        return {
            traceId: this.traceId,
            message: this.message,
            stackTrace: this.stackTrace
        }
    }
}

module.exports = {
    ErrorDomain
}
