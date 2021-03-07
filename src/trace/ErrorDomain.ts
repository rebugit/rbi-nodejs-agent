export interface IErrorDomain {
    traceId: string
    message: string
    stackTrace: string
}

export class ErrorDomain {
    private readonly traceId: string;
    private readonly message: string;
    private readonly stack: string;

    constructor(traceId: string, error: Error | {message: string, stack?: string}) {
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
