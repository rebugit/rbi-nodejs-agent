import {ITrace} from "./Trace";

const {v4: uuidV4} = require('uuid');

export class Tracer {
    get traces(): ITrace[] {
        return this._traces;
    }

    private readonly _traceId: string;
    private readonly _traces: ITrace[];

    get traceId(): string {
        return this._traceId;
    }

    constructor() {
        this._traceId = uuidV4()
        this._traces = []
    }

    add(trace: ITrace) {
        this._traces.push({
            traceId: this._traceId,
            ...trace
        })
    }
}

module.exports = {
    Tracer
}
