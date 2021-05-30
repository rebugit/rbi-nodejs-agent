import {stringify} from "flatted";

export interface ITrace {
    traceId?: string
    correlationId: string
    data: any
    operationType?: string
}

export class Trace {
    private readonly _correlationId: string;
    private readonly _operationType: string;
    private _data: string;

    set data(value: string) {
        this._data = value;
    }

    constructor(span: ITrace) {
        this._correlationId = span.correlationId
        this._operationType = span.operationType || 'RESPONSE'
        this._data = span.data;
    }

    trace(): ITrace {
        return {
            correlationId: this._correlationId,
            data: stringify(this._data),
            operationType: this._operationType
        }
    }
}
