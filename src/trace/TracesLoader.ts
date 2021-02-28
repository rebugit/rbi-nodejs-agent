import {ITrace} from "./Trace";

const {parse, stringify} = require('flatted');

export class TracesLoader {
    private readonly traces: {};

    constructor() {
        this.traces = {}
    }

    load(traces: ITrace[]): void {
        traces.forEach(trace => {
            this.traces[trace.correlationId] = trace
        })
    }

    get<T>(correlationId: string): T {
        const trace = this.traces[correlationId]
        return parse(trace.data)
    }
}

module.exports = {
    TracesLoader
}
