import {compareTwoStrings, findBestMatch} from "../../../src/sharedKernel/utils";

describe('util methods', function () {
    describe('findBestMatch aka request best match', function () {
        it('should find the best match, same order and body structure but different body content', function () {
            const mainString = '0_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 15bfff83-833c-440a-9ff8-781c4ca7842c\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"002\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Rick Sanchez\\"},\\"age\\":{\\"S\\":\\"70\\"}}}"]'
            const strings = [
                '0_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 034a120e-3b44-4920-8249-18ec50fec63e\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"002\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Rick Sanchez\\"},\\"age\\":{\\"S\\":\\"70\\"}}}"]',
                '1_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 6ba482e4-15c4-4aa3-83ea-9fdacb4fd355\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"003\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Morty Smith\\"},\\"age\\":{\\"S\\":\\"15\\"}}}"]'
            ]

            const found = findBestMatch(mainString, strings);

            expect(found.bestMatch.target).toBe(strings[found.bestMatchIndex])
            expect(found.bestMatchIndex).toBe(0)
        });

        it('should find the best match, same body structure but different order and body content', function () {
            const mainString = '0_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 15bfff83-833c-440a-9ff8-781c4ca7842c\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"002\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Rick Sanchez\\"},\\"age\\":{\\"S\\":\\"70\\"}}}"]'
            const strings = [
                '32_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 034a120e-3b44-4920-8249-18ec50fec63e\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"002\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Rick Sanchez\\"},\\"age\\":{\\"S\\":\\"70\\"}}}"]',
                '0_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 6ba482e4-15c4-4aa3-83ea-9fdacb4fd355\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"003\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Morty Smith\\"},\\"age\\":{\\"S\\":\\"15\\"}}}"]'
            ]

            const found = findBestMatch(mainString, strings);

            expect(found.bestMatch.target).toBe(strings[found.bestMatchIndex])
            expect(found.bestMatchIndex).toBe(0)
        })

        it('should find the best match, same body structure but different order and body content with uuid and dates', function () {
            const mainString = '0_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: a669f96f-0002-441e-89f3-fc7f72be32d8\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"a669f96f-0002-441e-89f3-fc7f72be32d8\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Rick Sanchez\\"},\\"age\\":{\\"S\\":\\"70\\"},\\"created_at\\":{\\"S\\":\\"2021-06-13T12:23:05.342Z\\"}}}"]'
            const strings = [
                '0_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 41f2fff0-ce99-4bb4-a50c-7a02ea2299b4\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"41f2fff0-ce99-4bb4-a50c-7a02ea2299b4\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Morty Smith\\"},\\"age\\":{\\"S\\":\\"15\\"},\\"created_at\\":{\\"S\\":\\"2021-10-03T02:54:40.282Z\\"}}}"]',
                '4_["HTTP/1.1 200 OK\\r\\nContent-Type: application/x-amz-json-1.0\\r\\nx-amz-crc32: 79712624\\r\\nx-amzn-RequestId: 034a120e-3b44-4920-8249-18ec50fec63e\\r\\nConnection: close\\r\\nServer: Jetty(8.1.12.v20130726)\\r\\n\\r\\n{\\"Item\\":{\\"CUSTOMER_ID\\":{\\"S\\":\\"034a120e-3b44-4920-8249-18ec50fec63e\\"},\\"CUSTOMER_NAME\\":{\\"S\\":\\"Rick Sanchez\\"},\\"age\\":{\\"S\\":\\"70\\"},\\"created_at\\":{\\"S\\":\\"2021-10-03T02:54:31.200Z\\"}}}"]'
            ]

            const found = findBestMatch(mainString, strings);

            expect(found.bestMatch.target).toBe(strings[found.bestMatchIndex])
            expect(found.bestMatchIndex).toBe(1)
        });
    });
});