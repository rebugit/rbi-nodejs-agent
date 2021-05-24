import {Tracer} from "../../src/trace/Tracer";
import {
    query,
    query2, query2PreparedStatement,
    query2WithPool, query2WithPromise,
    queryWithKnex,
    queryWithPool,
    queryWithSequelize,
    queryWithTypeORM
} from "./utils/mysql.utils";
// @ts-ignore
import {Mysql, Mysql2} from '../../src/integrations';
import {TracesLoader} from "../../src/trace/TracesLoader";
import {traces} from "./utils/mysql.data"
import {clearEnvironmentVariables} from "../utils";
import {parse} from "flatted";

describe('MySql Integration debug mode', function () {
    let tracer: Tracer;

    beforeEach(function () {
        process.env.REBUGIT_LOG = 'ALL'
        process.env.REBUGIT_ENV = 'debug'
        tracer = new Tracer()
    });

    afterEach(function () {
        clearEnvironmentVariables()
    });

    describe('MySQL', function () {
        let mysqlIntegration;

        beforeEach(function () {
            const tracesLoader = new TracesLoader()
            tracesLoader.load(traces)
            mysqlIntegration = new Mysql()
            mysqlIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            mysqlIntegration.end()
        });

        it('should correctly integrate with native mysql driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await query(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with native mysql pool driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await queryWithPool(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with Knex', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await queryWithKnex(...args)

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with TypeORM', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await queryWithTypeORM(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });
    });

    describe('MySQL2', function () {
        let mysqlIntegration2;

        beforeEach(function () {
            const tracesLoader = new TracesLoader()
            tracesLoader.load(traces)
            mysqlIntegration2 = new Mysql2()
            mysqlIntegration2.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            mysqlIntegration2.end()
        });

        it('should correctly integrate with native mysql driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await query2(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with native mysql driver with promises', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await query2WithPromise(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with native mysql driver with prepared statement', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await query2PreparedStatement(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with native mysql pool driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]

            const response = await query2WithPool(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        });

        it('should correctly integrate with Sequelize', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', {replacements: [4, 2]}]

            const response = await queryWithSequelize(...args);

            expect(tracer.traces).toHaveLength(0)
            expect(response).toEqual(parse(traces[0].data).response)
        })
    });
});