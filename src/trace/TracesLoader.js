const {parse, stringify} = require('flatted');

class TracesLoader {
    constructor() {
        this.traces = {}
    }

    load(traces){
        traces.forEach(trace => {
            this.traces[trace.correlationId] = trace
        })
    }

    get(correlationId){
        const trace = this.traces[correlationId]

        return parse(trace.data)
    }
}

module.exports = {
    TracesLoader
}
