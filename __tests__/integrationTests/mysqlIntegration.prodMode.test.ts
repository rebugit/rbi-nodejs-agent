import {Tracer} from "../../src/trace/Tracer";
import {
    hashQuery,
    query,
    query2,
    query2WithPool, query2WithPromise,
    queryWithKnex, queryWithPool,
    queryWithSequelize,
    queryWithTypeORM
} from "./utils/mysql.utils";
import {parse} from "flatted";
// @ts-ignore
import {Mysql, Mysql2} from '../../dist/integrations';
import {TracesLoader} from "../../src/trace/TracesLoader";
import {clearEnvironmentVariables} from "../utils";

describe('MySql Integration production mode', function () {
    let tracer: Tracer;

    beforeEach(function () {
        tracer = new Tracer()
        process.env.REBUGIT_LOG = 'ALL'
    });

    afterEach(function () {
        clearEnvironmentVariables()
    });

    describe('MySQL', function () {
        let mysqlIntegration;

        beforeEach(function () {
            const tracesLoader = new TracesLoader()
            mysqlIntegration = new Mysql()
            mysqlIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
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

        it('should correctly integrate with native mysql pool driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
            const s = hashQuery(...args);

            const response = await queryWithPool(...args);

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        })

        it('should correctly integrate with Knex', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
            const s = hashQuery(...args);

            const response = await queryWithKnex(...args)

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        });

        // typeORM is broken with mysql and mysql2. Under the hood it gets mysql first if installed
        it('should correctly integrate with TypeORM', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
            const s = hashQuery(...args);

            const response = await queryWithTypeORM(...args)

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        })
    });

    describe('MySQL2', function () {
        let mysqlIntegration2;

        beforeEach(function () {
            const tracesLoader = new TracesLoader()
            mysqlIntegration2 = new Mysql2()
            mysqlIntegration2.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            mysqlIntegration2.end()
        });

        it('should correctly integrate with native mysql2 driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
            const s = hashQuery(...args);

            const response = await query2(...args);

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        });

        it('should correctly integrate with native mysql2 driver promise', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
            const s = hashQuery(...args);

            const response = await query2WithPromise(...args);

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        })

        it('should correctly integrate with native mysql2 pool driver', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', [4, 2]]
            const s = hashQuery(...args);

            const response = await query2WithPool(...args);

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        });

        it('should correctly integrate with Sequelize', async function () {
            const args = ['SELECT (1 + ?) * ? AS result', {replacements: [4, 2]}]
            const s = hashQuery(args[0], (args[1] as {replacements: number[]}).replacements);

            const response = await queryWithSequelize(...args);

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            expect(response).toEqual(parse(tracer.traces[0].data).response)
        })
    });
});