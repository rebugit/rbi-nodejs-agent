import shimmer = require("shimmer");
import {PostgresIntegration} from "../../../src/integrations/postgresIntegration";
import {ClientBase, QueryConfig, QueryResult} from "pg";
import {Tracer} from "../../../src/trace/Tracer";
import {TracesLoader} from "../../../src/trace/TracesLoader";
import {parse} from "flatted";
import {ITrace} from "../../../src/trace/Trace";
import {Environments} from "../../../src/sharedKernel/constants";
import {sha1} from "../../utils";

const compareHashedQuery = (hashedQuery: string): boolean => {
    const sha = sha1(fakeQuery.replace('$1', fakeValues[0].toString()));
    return sha === hashedQuery
}
const fakeQuery = 'SELECT 1 + $1 AS result'
const fakeValues = [4]
const mockResult: QueryResult = {
    rows: [{result: 5}],
    command: "",
    fields: [],
    oid: 1,
    rowCount: 1
}
const fakeTrace: ITrace = {
    "traceId": "635891e8-9590-4cba-922e-bd37735e9fb7",
    "correlationId": "3c4d6a841aea0bd18e6ba3e9a82003ce6af59f19",
    "data": "[{\"rows\":\"1\"},[\"2\"],{\"result\":5}]",
    "operationType": "QUERY"
}
const fakeError = new Error('test error')
process.env.REBUGIT_LOG = 'ALL'

describe('PostgresIntegration', function () {
    describe('production mode', function () {
        let tracer: Tracer,
            tracesLoader: TracesLoader,
            pgIntegration: PostgresIntegration

        beforeEach(function () {
            pgIntegration = new PostgresIntegration()
            tracer = new Tracer()
            tracesLoader = new TracesLoader()
            pgIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            pgIntegration.end()
        });

        it('Query config object async', async function () {
            class PgMock {
                query(config: QueryConfig): Promise<QueryResult> {
                    return Promise.resolve(mockResult)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            await pg.query({
                text: fakeQuery,
                values: fakeValues
            })

            expect(tracer.traces).toHaveLength(1)
            expect(parse(tracer.traces[0].data).rows[0].result).toEqual(5)
            expect(compareHashedQuery(tracer.traces[0].correlationId)).toBeTruthy()
        })

        it('Query config object callback', function (done) {
            class PgMock {
                query(config: QueryConfig, callback): void {
                    callback(null, mockResult)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            pg.query({
                text: fakeQuery,
                values: fakeValues
            }, () => {
                expect(tracer.traces).toHaveLength(1)
                expect(parse(tracer.traces[0].data).rows[0].result).toEqual(5)
                expect(compareHashedQuery(tracer.traces[0].correlationId)).toBeTruthy()
                done()
            })
        })

        it('Text and values with callback', function (done) {
            class PgMock {
                query(query: string, value: any[], callback): void {
                    callback(null, mockResult)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            pg.query(fakeQuery, fakeValues, (err, resp) => {
                expect(tracer.traces).toHaveLength(1)
                expect(parse(tracer.traces[0].data).rows[0].result).toEqual(5)
                expect(compareHashedQuery(tracer.traces[0].correlationId)).toBeTruthy()
                done()
            })
        })

        it('Text and values async', async function () {
            class PgMock {
                query(query: string, value: any[]): Promise<QueryResult> {
                    return Promise.resolve(mockResult)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            await pg.query(fakeQuery, fakeValues)

            expect(tracer.traces).toHaveLength(1)
            expect(parse(tracer.traces[0].data).rows[0].result).toEqual(5)
            expect(compareHashedQuery(tracer.traces[0].correlationId)).toBeTruthy()
        })

        it('Config and values async', async function () {
            class PgMock {
                query(config: QueryConfig, value: any[]): Promise<QueryResult> {
                    return Promise.resolve(mockResult)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            await pg.query({
                text: fakeQuery
            }, fakeValues)

            expect(tracer.traces).toHaveLength(1)
            expect(parse(tracer.traces[0].data).rows[0].result).toEqual(5)
            expect(compareHashedQuery(tracer.traces[0].correlationId)).toBeTruthy()
        })

        it('Config and values callback', function (done) {
            class PgMock {
                query(config: QueryConfig, value: any[], callback) {
                    callback(null, mockResult)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            pg.query({
                text: fakeQuery
            }, fakeValues, () => {
                expect(tracer.traces).toHaveLength(1)
                expect(parse(tracer.traces[0].data).rows[0].result).toEqual(5)
                expect(compareHashedQuery(tracer.traces[0].correlationId)).toBeTruthy()
                done()
            })
        })

        it('should handle error with callback', function (done) {
            class PgMock {
                query(query: string, value: any[], callback) {
                    callback(fakeError)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            pg.query(fakeQuery, fakeValues, (err: Error) => {
                expect(tracer.traces).toHaveLength(0)
                expect(err.message).toBe(fakeError.message)
                done()
            })
        })

        it('should handle error async', async function () {
            class PgMock {
                query(query: string, value: any[]): Promise<QueryResult> {
                    return Promise.reject(fakeError)
                }
            }

            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrap']())

            const pg = new PgMock()
            try {
                await pg.query(fakeQuery, fakeValues)
                expect(true).toBe(false)
            } catch (err) {
                expect(err.message).toBe(fakeError.message)
                expect(tracer.traces).toHaveLength(0)
            }
        })
    });

    describe('Debug mode', function () {
        const mockImplementationError = new Error('this method was not mocked correctly')
        type PoolClient = {
            query: (query: string, value: any[]) => Promise<QueryResult>
        }

        let tracer: Tracer,
            tracesLoader: TracesLoader,
            pgIntegration: PostgresIntegration

        beforeEach(function () {
            process.env.REBUGIT_ENV = Environments.DEBUG
            pgIntegration = new PostgresIntegration()
            tracer = new Tracer()
            tracesLoader = new TracesLoader()
            tracesLoader.load([fakeTrace])
            pgIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            pgIntegration.end()
            delete process.env.REBUGIT_ENV
        });

        it('should mock query with Pool async ', async function () {
            class PgMock {
                async connect(): Promise<ClientBase> {
                    return Promise.reject(mockImplementationError)
                }

                async query(query: string, values: any[]): Promise<QueryResult> {
                    return Promise.reject(mockImplementationError)
                }
            }

            shimmer.wrap(PgMock.prototype, 'connect', pgIntegration['wrapMockConnect']())
            shimmer.wrap(PgMock.prototype, 'query', pgIntegration['wrapMockQuery']())

            const client = new PgMock()
            await client.connect()
            const resp = await client.query(fakeQuery, fakeValues)

            expect(resp.rows[0].result).toBe(5)
        });
    });
});
