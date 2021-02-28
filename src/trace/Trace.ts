export interface ITrace {
    traceId?: string
    correlationId: string
    data: string
    operationType: string
}

export class Trace {
    private readonly _correlationId: string;
    private readonly _operationType: string;
    private readonly _data: string;

    constructor(span: ITrace) {
        this._correlationId = span.correlationId
        this._operationType = span.operationType || 'RESPONSE'
        this._data = span.data;
    }

    trace(): ITrace {
        return {
            correlationId: this._correlationId,
            data: this._data,
            operationType: this._operationType
        }
    }
}
