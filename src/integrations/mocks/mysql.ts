import {Connection, ConnectionOptions, MysqlError, QueryOptions} from "mysql";
import {Connection as Connection2} from 'mysql2';

export class MysqlMock {
    createConnection = ({mockQuery, mockConnect, mockEnd}) => (): Connection => {
        // @ts-ignore
        return {
            config: undefined,
            createQuery: undefined,
            // @ts-ignore
            query(...args) {
                mockQuery(...args)
            },
            state: 'connected',
            threadId: 1,
            beginTransaction(...args): void {
            },
            // TODO this has two implementations
            changeUser(options: ConnectionOptions | ((err: MysqlError) => void), callback?: (err: MysqlError) => void): void {
            },

            // TODO this has two implementations
            commit(...args): void {
            },

            // TODO this has two implementations
            connect(...args): void {
                mockConnect(...args)
            },
            destroy(): void {
            },
            end(...args): void {
                mockEnd(...args)
            },
            escape(value: any, stringifyObjects?: boolean, timeZone?: string): string {
                return "";
            },
            escapeId(value: string, forbidQualified?: boolean): string {
                return "";
            },
            format(sql: string, values: any[], stringifyObjects?: boolean, timeZone?: string): string {
                return "";
            },
            pause(): void {
            },
            ping(options?: QueryOptions | ((err: MysqlError) => void), callback?: (err: MysqlError) => void): void {
            },
            resume(): void {
            },
            rollback(...args): void {
            },
            statistics(...args): void {
            },
            // @ts-ignore
            on(event: string | symbol, listener: (...args: any[]) => void): void{
            },
            // @ts-ignore
            once(event: string | symbol, listener: (...args: any[]) => void){
                if (event === 'connect'){
                    listener()
                }
            },
            // @ts-ignore
            removeAllListeners(): void{
            },
            // @ts-ignore
            removeListener(): void {
            }
        }
    }
}