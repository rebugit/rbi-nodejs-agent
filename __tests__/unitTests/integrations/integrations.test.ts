import {Integrations} from "../../../src/integrations/integrations";

describe('Integration main class', function () {
    it('should correctly require a module', function () {
        const ints = new Integrations()

        // @ts-ignore
        const s = ints.require('http');

        expect(s).toBeDefined()
    });

    it('should return empty module', function () {
        const ints = new Integrations()

        // @ts-ignore
        const s = ints.require('some-module');

        expect(s).toBeUndefined()
    });

    it('should get correlationId', function () {
        const ints = new Integrations()
        const result = ints['getCorrelationId']('POST', 'jsonplaceholder.typicode.com', '/todo/1', {});

        expect(result).toBe('POST_jsonplaceholder.typicode.com/todo/1_1')
    });

    it('should get correlationId for aws services', function () {
        const ints = new Integrations()
        const result = ints['getCorrelationId'](
            'POST',
            'dynamodb.ap-southeast-1.amazonaws.com',
            '',
            {'X-Amz-Target': 'DynamoDB_20120810.GetItem'}
        );

        expect(result).toBe('POST_dynamodb.ap-southeast-1.amazonaws.com_DynamoDB_20120810.GetItem_1')
    })

    it('should get operationType', function () {
        const ints = new Integrations()
        const result = ints['getOperationType'](
            {'custom-header': 'jsonplaceholder.typicode.com'},
        );

        expect(result).toBe('RESPONSE')
    });


    it('should get operationType for aws services', function () {
        const ints = new Integrations()
        const result = ints['getOperationType'](
            { 'X-Amz-Target': 'DynamoDB_20120810'},
        );

        expect(result).toBe('DYNAMODB')
    });

    it('should sha1 a string', function () {
        const ints = new Integrations()
        const result = ints['hashSha1'](
            '123',
        );

        expect(result).toBe('40bd001563085fc35165329ea1ff5c5ecbdbbeef')
    });
});
