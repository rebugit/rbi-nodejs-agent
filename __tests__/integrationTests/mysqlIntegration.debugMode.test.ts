import {Tracer} from "../../src/trace/Tracer";
import {query, queryWithKnex} from "./utils/mysql.utils";
import {parse} from "flatted";
import {Mysql} from '../../dist/integrations';
import {TracesLoader} from "../../src/trace/TracesLoader";
import {clearEnvironmentVariables} from "../utils";
import {traces} from "./utils/mysql.data"

describe('MySql Integration debug mode', function () {
    let mysqlIntegration;
    let tracer: Tracer;

    beforeEach(function () {
        process.env.REBUGIT_LOG = 'ALL'
        process.env.REBUGIT_ENV = 'debug'
        tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        tracesLoader.load(traces)
        mysqlIntegration = new Mysql()
        mysqlIntegration.init(tracer, tracesLoader, {})
    });

    afterEach(function () {
        clearEnvironmentVariables()
        mysqlIntegration.end()
    });

    it.skip('should correctly integrate with native mysql driver', async function () {
        const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

        const response = await query(...args);

        expect(tracer.traces).toHaveLength(0)
        expect(response).toEqual(parse(traces[0].data).response)
    });

    it('should correctly integrate with Knex', async function () {
        const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

        const response = await queryWithKnex(...args)
        console.log(response)
        expect(tracer.traces).toHaveLength(0)
        expect(response).toEqual(parse(traces[0].data).response)
    });
});