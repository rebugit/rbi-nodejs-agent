import {ClientRequest, IncomingMessage, InformationEvent, OutgoingHttpHeaders} from "http";
import {Socket} from "net";
import {Readable} from "stream";
import EventEmitter from "events";

export class HttpMock {
    request(resmock, callback): ClientRequest {
        process.nextTick(() => {
            callback()
        })

        return {
            aborted: false,
            chunkedEncoding: false,
            connection: undefined,
            destroyed: false,
            finished: false,
            headersSent: false,
            host: "",
            method: "",
            path: "",
            protocol: "",
            sendDate: false,
            shouldKeepAlive: false,
            socket: undefined,
            upgrading: false,
            useChunkedEncodingByDefault: false,
            writable: false,
            writableCorked: 0,
            writableEnded: false,
            writableFinished: false,
            writableHighWaterMark: 0,
            writableLength: 0,
            writableObjectMode: false,
            _destroy(error: Error | null, callback: (error?: (Error | null)) => void): void {
            },
            _final(callback: (error?: (Error | null)) => void): void {
            },
            _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void): void {
            },
            abort(): void {
            },
            // @ts-ignore
            addListener(event: "unpipe" | "finish" | "drain" | "connect" | "timeout" | string | symbol | "close" | "abort" | "continue" | "pipe" | "drain" | "response" | "socket" | "information" | "pipe" | "upgrade" | "error" | "unpipe" | "close" | "finish" | "error", listener: ((src: stream.Readable) => void) | (() => void) | ((response: IncomingMessage, socket: Socket, head: Buffer) => void) | ((...args: any[]) => void) | ((response: IncomingMessage) => void) | ((socket: Socket) => void) | ((info: InformationEvent) => void) | ((src: Readable) => void) | ((err: Error) => void)): this {
                return undefined;
            },
            addTrailers(headers: OutgoingHttpHeaders | ReadonlyArray<[string, string]>): void {
            },
            cork(): void {
            },
            destroy(error?: Error): void {
            },
            emit(event: string | symbol | "drain" | "pipe" | "unpipe" | "finish" | "error" | "close", ...args: (any)[]): boolean {
                return false;
            },
            eventNames(): Array<string | symbol> {
                return undefined;
            },
            flushHeaders(): void {
            },
            getHeader(name: string): number | string | string[] | undefined {
                return undefined;
            },
            getHeaderNames(): string[] {
                return [];
            },
            getHeaders(): OutgoingHttpHeaders {
                return undefined;
            },
            getMaxListeners(): number {
                return 0;
            },
            hasHeader(name: string): boolean {
                return false;
            },
            listenerCount(event: string | symbol): number {
                return 0;
            },
            listeners(event: string | symbol): Function[] {
                return [];
            },
            // @ts-ignore
            off(event: string | symbol, listener: (...args: any[]) => void): this {
                return undefined;
            },
            onSocket(socket: Socket): void {
            },        // @ts-ignore
            once(event: "drain" | "finish" | "response" | "drain" | "finish" | "timeout" | "pipe" | "upgrade" | "connect" | "unpipe" | "information" | "error" | string | symbol | "error" | "close" | "unpipe" | "socket" | "pipe" | "abort" | "close" | "continue", listener: (() => void) | ((response: IncomingMessage) => void) | ((src: Readable) => void) | ((response: IncomingMessage, socket: Socket, head: Buffer) => void) | ((info: InformationEvent) => void) | ((err: Error) => void) | ((...args: any[]) => void) | ((src: stream.Readable) => void) | ((socket: Socket) => void)): this {
                if (event === 'response') {
                    // @ts-ignore
                    return listener(resmock);
                }
                // @ts-ignore
                return undefined
            },
            pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T {
                return undefined;
            },        // @ts-ignore
            prependListener(event: "pipe" | string | symbol | "response" | "close" | "continue" | "socket" | "error" | "drain" | "upgrade" | "information" | "pipe" | "unpipe" | "abort" | "finish" | "close" | "finish" | "drain" | "error" | "connect" | "unpipe" | "timeout", listener: ((src: Readable) => void) | ((...args: any[]) => void) | ((response: IncomingMessage) => void) | (() => void) | ((socket: Socket) => void) | ((err: Error) => void) | ((response: IncomingMessage, socket: Socket, head: Buffer) => void) | ((info: InformationEvent) => void) | ((src: stream.Readable) => void)): this {
                return undefined;
            },        // @ts-ignore
            prependOnceListener(event: string | symbol | "close" | "close" | "connect" | "timeout" | "unpipe" | "upgrade" | "error" | "information" | "pipe" | "finish" | "pipe" | "drain" | "unpipe" | "abort" | "error" | "continue" | "response" | "drain" | "finish" | "socket", listener: ((...args: any[]) => void) | (() => void) | ((response: IncomingMessage, socket: Socket, head: Buffer) => void) | ((src: Readable) => void) | ((err: Error) => void) | ((info: InformationEvent) => void) | ((src: stream.Readable) => void) | ((response: IncomingMessage) => void) | ((socket: Socket) => void)): this {
                return undefined;
            },
            rawListeners(event: string | symbol): Function[] {
                return [];
            },
            // @ts-ignore
            removeAllListeners(event?: string | symbol): this {
                return undefined;
            },
            removeHeader(name: string): void {
            },        // @ts-ignore
            removeListener(event: "drain" | "error" | string | symbol | "close" | "finish" | "unpipe" | "pipe", listener: (() => void) | ((err: Error) => void) | ((...args: any[]) => void) | ((src: Readable) => void)): this {
                return undefined;
            },
            // @ts-ignore
            setDefaultEncoding(encoding: BufferEncoding): this {
                return undefined;
            },
            setHeader(name: string, value: number | string | ReadonlyArray<string>): void {
            },
            // @ts-ignore
            setMaxListeners(n: number): this {
                return undefined;
            },
            setNoDelay(noDelay?: boolean): void {
            },
            setSocketKeepAlive(enable?: boolean, initialDelay?: number): void {
            },
            // @ts-ignore
            setTimeout(msecs: number, callback?: () => void): this {
                return undefined;
            },
            uncork(): void {
            },
            // @ts-ignore
            write(chunk: any, cb?: ((error: (Error | null | undefined)) => void) | ((err?: (Error | null)) => void) | BufferEncoding, cb2?: ((error: (Error | null | undefined)) => void) | ((err?: (Error | null)) => void)): boolean {
                return false;
            },
            // @ts-ignore
            on: function (type) {
            },
            end: function () {
            }
        }
    }

    response(): IncomingMessage {
        return {
            aborted: false,
            complete: false,
            connection: undefined,
            destroyed: false,
            headers: undefined,
            httpVersion: "",
            httpVersionMajor: 0,
            httpVersionMinor: 0,
            method: "",
            rawHeaders: [],
            rawTrailers: [],
            readable: false,
            readableEncoding: undefined,
            readableEnded: false,
            readableFlowing: undefined,
            readableHighWaterMark: 0,
            readableLength: 0,
            readableObjectMode: false,
            socket: undefined,
            statusCode: 0,
            statusMessage: "",
            trailers: undefined,
            url: "",
            [Symbol.asyncIterator](): any {
            },
            _destroy(error: Error | null, callback: (error?: (Error | null)) => void): void {
            },
            _read(size: number): void {
            },
            // @ts-ignore
            addListener(event: "end" | "error" | string | symbol | "data" | "resume" | "readable" | "pause" | "close", listener: (() => void) | ((err: Error) => void) | ((...args: any[]) => void) | ((chunk: any) => void)): this {
                return undefined;
            },
            destroy(error?: Error): void {
            },
            emit(event: string | symbol | "close" | "data" | "resume" | "readable" | "error" | "end" | "pause", ...args: (any)[]): boolean {
                return false;
            },
            eventNames(): Array<string | symbol> {
                return undefined;
            },
            getMaxListeners(): number {
                return 0;
            },
            isPaused(): boolean {
                return false;
            },
            listenerCount(event: string | symbol): number {
                return 0;
            },
            listeners(event: string | symbol): Function[] {
                return [];
            },
            // @ts-ignore
            off(event: string | symbol, listener: (...args: any[]) => void): this {
                return undefined;
            },
            // @ts-ignore
            on(event: string | symbol | "end" | "resume" | "error" | "readable" | "data" | "pause" | "close", listener: ((...args: any[]) => void) | (() => void) | ((err: Error) => void) | ((chunk: any) => void)): this {
                return undefined;
            },
            // @ts-ignore
            once(event: "error" | "resume" | string | symbol | "readable" | "pause" | "data" | "end" | "close", listener: ((err: Error) => void) | (() => void) | ((...args: any[]) => void) | ((chunk: any) => void)): this {
                return undefined;
            },
            // @ts-ignore
            pause(): this {
                return undefined;
            },
            // @ts-ignore
            pipe(destination, options?: { end?: boolean }): T {
                return undefined;
            },
            // @ts-ignore
            prependListener(event: "close" | "readable" | "resume" | string | symbol | "pause" | "error" | "end" | "data", listener: (() => void) | ((...args: any[]) => void) | ((err: Error) => void) | ((chunk: any) => void)): this {
                return undefined;
            },
            // @ts-ignore
            prependOnceListener(event: string | symbol | "data" | "readable" | "end" | "resume" | "close" | "pause" | "error", listener: ((...args: any[]) => void) | ((chunk: any) => void) | (() => void) | ((err: Error) => void)): this {
                return undefined;
            },
            push(chunk: any, encoding?: BufferEncoding): boolean {
                return false;
            },
            rawListeners(event: string | symbol): Function[] {
                return [];
            },
            read(size?: number): any {
            },
            // @ts-ignore
            removeAllListeners(event?: string | symbol): this {
                return undefined;
            },
            // @ts-ignore
            removeListener(event: string | symbol | "error" | "readable" | "pause" | "close" | "data" | "end" | "resume", listener: ((...args: any[]) => void) | ((err: Error) => void) | (() => void) | ((chunk: any) => void)): this {
                return undefined;
            },
            // @ts-ignore
            resume(): this {
                return undefined;
            },
            // @ts-ignore
            setEncoding(encoding: BufferEncoding): this {
                return undefined;
            },
            // @ts-ignore
            setMaxListeners(n: number): this {
                return undefined;
            },
            // @ts-ignore
            setTimeout(msecs: number, callback?: () => void): this {
                return undefined;
            },
            // @ts-ignore
            unpipe(destination?: NodeJS.WritableStream): this {
                return undefined;
            },
            unshift(chunk: any, encoding?: BufferEncoding): void {
            },
            // @ts-ignore
            wrap(oldStream: NodeJS.ReadableStream): this {
                return undefined;
            }
        }
    }

    createResponse(emitter: EventEmitter): IncomingMessage {
        const res = this.response()
        const resMock = {}
        Object.keys(res).forEach((key: string) => {
            resMock[key] = res[key]
        })

        Object.keys(emitter).forEach((key: string) => {
            resMock[key] = emitter[key]
        })

        return resMock as IncomingMessage
    }
}
