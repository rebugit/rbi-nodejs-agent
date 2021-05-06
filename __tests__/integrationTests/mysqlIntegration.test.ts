import {Tracer} from "../../src/trace/Tracer";
import {hashQuery, query} from "./utils/mysql.utils";
import {parse} from "flatted";
import {Mysql} from '../../dist/integrations';
import {TracesLoader} from "../../src/trace/TracesLoader";
const {
    clearEnvironmentVariables
} = require("./utils/utils");

/**
 * Jest does not preserve symlink making those type of tests fails
 * By running normal nodejs function the tests can run correctly
 */

describe('test', function () {
    let mysqlIntegration;
    let tracer: Tracer;

    beforeEach(function () {
        process.env.REBUGIT_LOG = 'ALL'
        tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        mysqlIntegration = new Mysql()
        mysqlIntegration.init(tracer, tracesLoader, {})
    });

    afterEach(function () {
        clearEnvironmentVariables()
        mysqlIntegration.end()
    });

    it('should correctly integrate with native mysql driver', async function () {
        const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
        const s = hashQuery(...args);
        const response = await query(...args);


        expect(tracer.traces).toHaveLength(1)
        expect(tracer.traces[0].correlationId).toBe(s)
        expect(response).toEqual(parse(tracer.traces[0].data).response)
    });
});