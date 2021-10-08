import {ITrace} from "./Trace";
import {findBestMatch} from "../sharedKernel/utils";

const {parse} = require('flatted');

export class TracesLoader {
    private traces: {};
    private tracesCorrelationIds: string[]

    constructor() {
        this.traces = {}
    }

    load(traces: ITrace[]): void {
        traces.forEach(trace => {
            this.traces[trace.correlationId] = trace
        })
        this.tracesCorrelationIds = traces.map(trace => trace.correlationId)
    }

    get<T>(correlationId: string): T | undefined {
        const found = findBestMatch(correlationId, this.tracesCorrelationIds);
        const trace = this.traces[found.bestMatch.target]
        if (!trace){
            return undefined
        }

        return parse(trace.data)
    }
}

module.exports = {
    TracesLoader
}
