import {
    BindConfig,
    ClientBase,
    Connection,
    ExecuteConfig,
    MessageConfig,
    Notification,
    PoolClient,
    QueryParse
} from "pg";
import * as stream from "stream";

class NoticeMessage {
}

export class PgMock {
    mockPg(returnValue): ClientBase {
        const __class = this
        // @ts-ignore
        return {
            connect(callback?: (err: Error) => void): any {
            },
            copyFrom(queryText: string): stream.Writable {
                return undefined;
            },
            copyTo(queryText: string): stream.Readable {
                return undefined;
            },
            escapeIdentifier(str: string): string {
                return "";
            },
            escapeLiteral(str: string): string {
                return "";
            },
            // @ts-ignore
            on(event: "error" | "notification" | "drain" | "notice" | "end", listener: ((err: Error) => void) | ((message: Notification) => void) | (() => void) | ((notice: NoticeMessage) => void)): this {
                return undefined;
            },
            pauseDrain(): void {
            },
            query(queryTextOrConfig, values?, callback?): any {
                return returnValue
            },
            resumeDrain(): void {
            },
        }
    }

    mockPool(): PoolClient {
        // @ts-ignore
        return {
            connect(callback?: (err: Error) => void): any {
            },
            copyFrom(queryText: string): stream.Writable {
                return undefined;
            },
            copyTo(queryText: string): stream.Readable {
                return undefined;
            },
            escapeIdentifier(str: string): string {
                return "";
            },
            escapeLiteral(str: string): string {
                return "";
            },
            // @ts-ignore
            on(event: "drain" | "notice" | "error" | "notification" | "end", listener: (() => void) | ((notice: NoticeMessage) => void) | ((err: Error) => void) | ((message: Notification) => void)): this {
                return undefined;
            },
            pauseDrain(): void {
            },
            query(queryTextOrConfig, callback?, callback2?): any {
            },
            release(err?: Error | boolean): void {
            },
            resumeDrain(): void {
            }
        }
    }

    mockConnection(): Connection {
        // @ts-ignore
        return {
            stream: undefined, bind(config: BindConfig | null, more: boolean): void {
            },
            close(msg: MessageConfig, more: boolean): void {
            },
            describe(msg: MessageConfig, more: boolean): void {
            },
            end(): void {
            },
            execute(config: ExecuteConfig | null, more: boolean): void {
            },
            flush(): void {
            },
            parse(query: QueryParse, more: boolean): void {
            },
            query(text: string): void {
            },
            sync(): void {
            },
            // @ts-ignore
            on(event: "drain" | "notice" | "error" | "notification" | "end", listener: (() => void) | ((notice: NoticeMessage) => void) | ((err: Error) => void) | ((message: Notification) => void)): this {
                return undefined;
            }
        }
    }
}
