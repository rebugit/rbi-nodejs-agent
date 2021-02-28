export interface IErrorDomain {
    traceId: string
    message: string
    stackTrace: string
}

class ErrorDomain {
    private readonly traceId: string;
    private readonly message: string;
    private readonly stack: string;

    constructor(traceId, error) {
        this.traceId = traceId
        this.message = error.message
        this.stack = error.stack
    }

    getError(): IErrorDomain {
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
