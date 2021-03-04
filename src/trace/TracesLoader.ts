import {ITrace} from "./Trace";

const {parse} = require('flatted');

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

    get<T>(correlationId: string): T | undefined {
        const trace = this.traces[correlationId]
        if (!trace){
            return undefined
        }

        return parse(trace.data)
    }
}

module.exports = {
    TracesLoader
}
