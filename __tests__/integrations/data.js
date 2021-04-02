const traces = [
    {
        "id": "f96503cd-3f1d-470a-9451-3da137b141c0",
        "tenantId": "69a34c58-45dc-43df-a876-643395d892e0",
        "traceId": "2c4f19a4-261e-44ae-9004-995f4a4764fa",
        "correlationId": "POST_/",
        "data": "[{\"body\":\"1\",\"headers\":\"2\",\"originalUrl\":\"3\"},{\"num\":18},{\"content-type\":\"4\",\"content-length\":\"5\",\"host\":\"6\",\"connection\":\"7\",\"user-agent\":\"8\",\"accept-encoding\":\"9\"},\"/\",\"application/json\",\"15\",\"localhost:9000\",\"Keep-Alive\",\"Apache-HttpClient/4.5.12 (Java/11.0.9.1)\",\"gzip,deflate\"]",
        "meta": null,
        "operation_type": "REQUEST",
        "createdAt": "2021-03-02 14:21:37.616803"
    },
    {
        "id": "e406231c-e637-4e74-9ef6-d8f3950e49cd",
        "tenantId": "69a34c58-45dc-43df-a876-643395d892e0",
        "traceId": "2c4f19a4-261e-44ae-9004-995f4a4764fa",
        "correlationId": "GET_jsonplaceholder.typicode.com/todos/1_1",
        "data": "[{\"body\":\"1\",\"headers\":\"2\",\"statusCode\":200,\"statusMessage\":\"3\"},\"{\\n  \\\"userId\\\": 1,\\n  \\\"id\\\": 1,\\n  \\\"title\\\": \\\"delectus aut autem\\\",\\n  \\\"completed\\\": false\\n}\",{\"date\":\"4\",\"content-type\":\"5\",\"content-length\":\"6\",\"connection\":\"7\",\"set-cookie\":\"8\",\"x-powered-by\":\"9\",\"x-ratelimit-limit\":\"10\",\"x-ratelimit-remaining\":\"11\",\"x-ratelimit-reset\":\"12\",\"vary\":\"13\",\"access-control-allow-credentials\":\"14\",\"cache-control\":\"15\",\"pragma\":\"16\",\"expires\":\"17\",\"x-content-type-options\":\"18\",\"etag\":\"19\",\"via\":\"20\",\"cf-cache-status\":\"21\",\"age\":\"22\",\"accept-ranges\":\"23\",\"cf-request-id\":\"24\",\"report-to\":\"25\",\"nel\":\"26\",\"server\":\"27\",\"cf-ray\":\"28\",\"alt-svc\":\"29\"},\"OK\",\"Tue, 02 Mar 2021 14:21:37 GMT\",\"application/json; charset=utf-8\",\"83\",\"close\",[\"30\"],\"Express\",\"1000\",\"999\",\"1604524310\",\"Origin, Accept-Encoding\",\"true\",\"max-age=43200\",\"no-cache\",\"-1\",\"nosniff\",\"W/\\\"53-hfEnumeNh6YirfjyjaujcOPPT+s\\\"\",\"1.1 vegur\",\"HIT\",\"23091\",\"bytes\",\"0894e9eedd0000ef61951e4000000001\",\"{\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\\\/\\\\/a.nel.cloudflare.com\\\\/report?s=xPql%2Fb%2B26R5%2BNVLUsiUFEuZj7qUHIGAjXdlWJqo6JZ1mAOcbIPEK%2BT0OP%2BnT1eeznuAv%2Bhvp1HtOudoTHkqOODN7wyP%2FhibCxUcP5F8uApzrqE7zuywYNf4orjsS\\\"}],\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"cloudflare\",\"629b45c499e9ef61-NRT\",\"h3-27=\\\":443\\\"; ma=86400, h3-28=\\\":443\\\"; ma=86400, h3-29=\\\":443\\\"; ma=86400\",\"__cfduid=daee93fd26c0d600736e76dfa91f191d61614694897; expires=Thu, 01-Apr-21 14:21:37 GMT; path=/; domain=.typicode.com; HttpOnly; SameSite=Lax\"]",
        "meta": null,
        "operation_type": "RESPONSE",
        "createdAt": "2021-03-02 14:21:37.616803"
    },
    {
        "id": "4d3670b8-5cd9-4193-ba4d-f961973b2c3d",
        "tenantId": "69a34c58-45dc-43df-a876-643395d892e0",
        "traceId": "2c4f19a4-261e-44ae-9004-995f4a4764fa",
        "correlationId": "57bf88f6f14b5a62938be70e872180189e2d61a8",
        "data": "[{\"rows\":\"1\"},[\"2\"],{\"result\":21}]",
        "meta": null,
        "operation_type": "QUERY",
        "createdAt": "2021-03-02 14:21:37.616803"
    },
    {
        id: '',
        projectId: '',
        traceId: 'a0e101ef-4958-40ea-84cb-10789e0c20d3',
        tenantId: '',
        correlationId: 'POST_dynamodb.ap-southeast-1.amazonaws.com/_DynamoDB_20120810.GetItem_1',
        operationType: 'RESPONSE',
        data: '[{"body":"1","headers":"2","statusCode":200,"statusMessage":"3"},"{\\"Item\\":{\\"city\\":{\\"M\\":{\\"city\\":{\\"S\\":\\"Ho Chi Minh City\\"},\\"address\\":{\\"S\\":\\"Cầu Thủ Thiêm\\"}}},\\"createdAt\\":{\\"N\\":\\"1617245457125\\"},\\"time\\":{\\"S\\":\\"2021-04-01T02:00:00Z\\"},\\"id\\":{\\"S\\":\\"155ed150-9295-11eb-8c38-5fede2f3bc0d\\"},\\"data\\":{\\"M\\":{\\"next_12_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"partlycloudy_day\\"}}}}},\\"next_6_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"partlycloudy_day\\"}}},\\"details\\":{\\"M\\":{\\"precipitation_amount\\":{\\"N\\":\\"0.2\\"}}}}},\\"instant\\":{\\"M\\":{\\"details\\":{\\"M\\":{\\"air_pressure_at_sea_level\\":{\\"N\\":\\"1009.5\\"},\\"wind_speed\\":{\\"N\\":\\"3.1\\"},\\"air_temperature\\":{\\"N\\":\\"30.1\\"},\\"cloud_area_fraction\\":{\\"N\\":\\"87.5\\"},\\"relative_humidity\\":{\\"N\\":\\"67.5\\"},\\"wind_from_direction\\":{\\"N\\":\\"188.7\\"}}}}},\\"next_1_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"cloudy\\"}}},\\"details\\":{\\"M\\":{\\"precipitation_amount\\":{\\"N\\":\\"0.1\\"}}}}}}},\\"updatedAt\\":{\\"N\\":\\"1617245457125\\"}}}",{"server":"4","date":"5","content-type":"6","content-length":"7","connection":"8","x-amzn-requestid":"9","x-amz-crc32":"10"},"OK","Server","Thu, 01 Apr 2021 08:58:16 GMT","application/x-amz-json-1.0","839","keep-alive","20SR01NRAD3O12MKAM86SN6NQVVV4KQNSO5AEMVJF66Q9ASUAAJG","277829062"]',
        meta: null
    }
]

module.exports = {
    traces
}
