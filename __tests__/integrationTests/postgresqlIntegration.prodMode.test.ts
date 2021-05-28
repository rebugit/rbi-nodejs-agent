import {PostgresIntegration} from "../../src/integrations/postgresIntegration";

// @ts-ignore
import {Pg} from '../../src/integrations';
import {Tracer} from '../../src/trace/Tracer';
import {TracesLoader} from '../../src/trace/TracesLoader';
import {clearEnvironmentVariables} from "../utils";
import {
    hashQuery,
    query,
    queryWithKnex,
    queryWithPool,
    queryWithSequelize,
    queryWithTypeORM
} from "./utils/postgresql.utils";
import {parse} from "flatted";
import each from 'jest-each';

describe('PostgreSQL integration production mode', function () {
    const DB_QUERY = 'SELECT 1 + 5 * $1 AS result'
    let postgresIntegration: PostgresIntegration
    let tracer: Tracer

    beforeEach(function () {
        tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        postgresIntegration = new Pg()
        postgresIntegration.init(tracer, tracesLoader, {})
    });

    afterEach(function () {
        clearEnvironmentVariables()
        postgresIntegration.end()
    });

    each([
        ['pg', query, [DB_QUERY, [4]]],
        ['pgPool', queryWithPool, [DB_QUERY, [4]]],
        ['sequelize', queryWithSequelize, ['SELECT 1 + 5 * :multi AS result', {replacements: {'multi': 4}}]],
        ['knex', queryWithKnex, ['SELECT 1 + 5 * :multi AS result', {'multi': 4}]],
        ['typeORM', queryWithTypeORM, [DB_QUERY, [4]]],
    ])
        .it('should capture %s response correctly', async function (clientName, client, args) {
            const s = hashQuery(...args);

            const response = await client(...args);

            expect(tracer.traces).toHaveLength(1)
            expect(tracer.traces[0].correlationId).toBe(s)
            if (clientName === 'sequelize' || clientName === 'typeORM') {
                expect(response).toEqual(parse(tracer.traces[0].data).rows)
            } else {
                expect(response.rows).toEqual(parse(tracer.traces[0].data).rows)
            }
        });
});