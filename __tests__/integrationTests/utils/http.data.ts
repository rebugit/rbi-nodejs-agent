export const traces = [
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
        "correlationId": "GET_localhost/todo/1",
        "data": "[{\"body\":\"1\",\"headers\":\"2\",\"statusCode\":200,\"statusMessage\":\"3\"},\"{\\n  \\\"userId\\\": 1,\\n  \\\"id\\\": 1,\\n  \\\"title\\\": \\\"delectus aut autem\\\",\\n  \\\"completed\\\": false\\n}\",{\"date\":\"4\",\"content-type\":\"5\",\"content-length\":\"6\",\"connection\":\"7\",\"set-cookie\":\"8\",\"x-powered-by\":\"9\",\"x-ratelimit-limit\":\"10\",\"x-ratelimit-remaining\":\"11\",\"x-ratelimit-reset\":\"12\",\"vary\":\"13\",\"access-control-allow-credentials\":\"14\",\"cache-control\":\"15\",\"pragma\":\"16\",\"expires\":\"17\",\"x-content-type-options\":\"18\",\"etag\":\"19\",\"via\":\"20\",\"cf-cache-status\":\"21\",\"age\":\"22\",\"accept-ranges\":\"23\",\"cf-request-id\":\"24\",\"report-to\":\"25\",\"nel\":\"26\",\"server\":\"27\",\"cf-ray\":\"28\",\"alt-svc\":\"29\"},\"OK\",\"Tue, 02 Mar 2021 14:21:37 GMT\",\"application/json; charset=utf-8\",\"83\",\"close\",[\"30\"],\"Express\",\"1000\",\"999\",\"1604524310\",\"Origin, Accept-Encoding\",\"true\",\"max-age=43200\",\"no-cache\",\"-1\",\"nosniff\",\"W/\\\"53-hfEnumeNh6YirfjyjaujcOPPT+s\\\"\",\"1.1 vegur\",\"HIT\",\"23091\",\"bytes\",\"0894e9eedd0000ef61951e4000000001\",\"{\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\\\/\\\\/a.nel.cloudflare.com\\\\/report?s=xPql%2Fb%2B26R5%2BNVLUsiUFEuZj7qUHIGAjXdlWJqo6JZ1mAOcbIPEK%2BT0OP%2BnT1eeznuAv%2Bhvp1HtOudoTHkqOODN7wyP%2FhibCxUcP5F8uApzrqE7zuywYNf4orjsS\\\"}],\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"cloudflare\",\"629b45c499e9ef61-NRT\",\"h3-27=\\\":443\\\"; ma=86400, h3-28=\\\":443\\\"; ma=86400, h3-29=\\\":443\\\"; ma=86400\",\"__cfduid=daee93fd26c0d600736e76dfa91f191d61614694897; expires=Thu, 01-Apr-21 14:21:37 GMT; path=/; domain=.typicode.com; HttpOnly; SameSite=Lax\"]",
        "meta": null,
        "operation_type": "RESPONSE",
        "createdAt": "2021-03-02 14:21:37.616803"
    },
    {
        "id": "e406231c-e637-4e74-9ef6-d8f3950e49cd",
        "tenantId": "69a34c58-45dc-43df-a876-643395d892e0",
        "traceId": "2c4f19a4-261e-44ae-9004-995f4a4764fa",
        "correlationId": "POST_localhost/todo/1_2248ee2fa0aaaad99178531f924bf00b4b0a8f4e",
        "data": "[{\"body\":\"1\",\"headers\":\"2\",\"statusCode\":200,\"statusMessage\":\"3\"},\"{\\n  \\\"userId\\\": 1,\\n  \\\"id\\\": 1,\\n  \\\"title\\\": \\\"delectus aut autem\\\",\\n  \\\"completed\\\": false\\n}\",{\"date\":\"4\",\"content-type\":\"5\",\"content-length\":\"6\",\"connection\":\"7\",\"set-cookie\":\"8\",\"x-powered-by\":\"9\",\"x-ratelimit-limit\":\"10\",\"x-ratelimit-remaining\":\"11\",\"x-ratelimit-reset\":\"12\",\"vary\":\"13\",\"access-control-allow-credentials\":\"14\",\"cache-control\":\"15\",\"pragma\":\"16\",\"expires\":\"17\",\"x-content-type-options\":\"18\",\"etag\":\"19\",\"via\":\"20\",\"cf-cache-status\":\"21\",\"age\":\"22\",\"accept-ranges\":\"23\",\"cf-request-id\":\"24\",\"report-to\":\"25\",\"nel\":\"26\",\"server\":\"27\",\"cf-ray\":\"28\",\"alt-svc\":\"29\"},\"OK\",\"Tue, 02 Mar 2021 14:21:37 GMT\",\"application/json; charset=utf-8\",\"83\",\"close\",[\"30\"],\"Express\",\"1000\",\"999\",\"1604524310\",\"Origin, Accept-Encoding\",\"true\",\"max-age=43200\",\"no-cache\",\"-1\",\"nosniff\",\"W/\\\"53-hfEnumeNh6YirfjyjaujcOPPT+s\\\"\",\"1.1 vegur\",\"HIT\",\"23091\",\"bytes\",\"0894e9eedd0000ef61951e4000000001\",\"{\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\\\/\\\\/a.nel.cloudflare.com\\\\/report?s=xPql%2Fb%2B26R5%2BNVLUsiUFEuZj7qUHIGAjXdlWJqo6JZ1mAOcbIPEK%2BT0OP%2BnT1eeznuAv%2Bhvp1HtOudoTHkqOODN7wyP%2FhibCxUcP5F8uApzrqE7zuywYNf4orjsS\\\"}],\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"cloudflare\",\"629b45c499e9ef61-NRT\",\"h3-27=\\\":443\\\"; ma=86400, h3-28=\\\":443\\\"; ma=86400, h3-29=\\\":443\\\"; ma=86400\",\"__cfduid=daee93fd26c0d600736e76dfa91f191d61614694897; expires=Thu, 01-Apr-21 14:21:37 GMT; path=/; domain=.typicode.com; HttpOnly; SameSite=Lax\"]",
        "meta": null,
        "operation_type": "RESPONSE",
        "createdAt": "2021-03-02 14:21:37.616803"
    }
]


export const tracesV2 = [
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
        "correlationId": "GET_localhost/todo/1_1",
        "data": "[{\"body\":\"1\",\"headers\":\"2\",\"statusCode\":200,\"statusMessage\":\"3\"},\"{\\n  \\\"userId\\\": 1,\\n  \\\"id\\\": 1,\\n  \\\"title\\\": \\\"delectus aut autem\\\",\\n  \\\"completed\\\": false\\n}\",{\"date\":\"4\",\"content-type\":\"5\",\"content-length\":\"6\",\"connection\":\"7\",\"set-cookie\":\"8\",\"x-powered-by\":\"9\",\"x-ratelimit-limit\":\"10\",\"x-ratelimit-remaining\":\"11\",\"x-ratelimit-reset\":\"12\",\"vary\":\"13\",\"access-control-allow-credentials\":\"14\",\"cache-control\":\"15\",\"pragma\":\"16\",\"expires\":\"17\",\"x-content-type-options\":\"18\",\"etag\":\"19\",\"via\":\"20\",\"cf-cache-status\":\"21\",\"age\":\"22\",\"accept-ranges\":\"23\",\"cf-request-id\":\"24\",\"report-to\":\"25\",\"nel\":\"26\",\"server\":\"27\",\"cf-ray\":\"28\",\"alt-svc\":\"29\"},\"OK\",\"Tue, 02 Mar 2021 14:21:37 GMT\",\"application/json; charset=utf-8\",\"83\",\"close\",[\"30\"],\"Express\",\"1000\",\"999\",\"1604524310\",\"Origin, Accept-Encoding\",\"true\",\"max-age=43200\",\"no-cache\",\"-1\",\"nosniff\",\"W/\\\"53-hfEnumeNh6YirfjyjaujcOPPT+s\\\"\",\"1.1 vegur\",\"HIT\",\"23091\",\"bytes\",\"0894e9eedd0000ef61951e4000000001\",\"{\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\\\/\\\\/a.nel.cloudflare.com\\\\/report?s=xPql%2Fb%2B26R5%2BNVLUsiUFEuZj7qUHIGAjXdlWJqo6JZ1mAOcbIPEK%2BT0OP%2BnT1eeznuAv%2Bhvp1HtOudoTHkqOODN7wyP%2FhibCxUcP5F8uApzrqE7zuywYNf4orjsS\\\"}],\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"cloudflare\",\"629b45c499e9ef61-NRT\",\"h3-27=\\\":443\\\"; ma=86400, h3-28=\\\":443\\\"; ma=86400, h3-29=\\\":443\\\"; ma=86400\",\"__cfduid=daee93fd26c0d600736e76dfa91f191d61614694897; expires=Thu, 01-Apr-21 14:21:37 GMT; path=/; domain=.typicode.com; HttpOnly; SameSite=Lax\"]",
        "meta": null,
        "operation_type": "RESPONSE",
        "createdAt": "2021-03-02 14:21:37.616803"
    },
    {
        "id": "e406231c-e637-4e74-9ef6-d8f3950e49cd",
        "tenantId": "69a34c58-45dc-43df-a876-643395d892e0",
        "traceId": "2c4f19a4-261e-44ae-9004-995f4a4764fa",
        "correlationId": "POST_localhost/todo/1_1",
        "data": "[{\"body\":\"1\",\"headers\":\"2\",\"statusCode\":200,\"statusMessage\":\"3\"},\"{\\n  \\\"userId\\\": 1,\\n  \\\"id\\\": 1,\\n  \\\"title\\\": \\\"delectus aut autem\\\",\\n  \\\"completed\\\": false\\n}\",{\"date\":\"4\",\"content-type\":\"5\",\"content-length\":\"6\",\"connection\":\"7\",\"set-cookie\":\"8\",\"x-powered-by\":\"9\",\"x-ratelimit-limit\":\"10\",\"x-ratelimit-remaining\":\"11\",\"x-ratelimit-reset\":\"12\",\"vary\":\"13\",\"access-control-allow-credentials\":\"14\",\"cache-control\":\"15\",\"pragma\":\"16\",\"expires\":\"17\",\"x-content-type-options\":\"18\",\"etag\":\"19\",\"via\":\"20\",\"cf-cache-status\":\"21\",\"age\":\"22\",\"accept-ranges\":\"23\",\"cf-request-id\":\"24\",\"report-to\":\"25\",\"nel\":\"26\",\"server\":\"27\",\"cf-ray\":\"28\",\"alt-svc\":\"29\"},\"OK\",\"Tue, 02 Mar 2021 14:21:37 GMT\",\"application/json; charset=utf-8\",\"83\",\"close\",[\"30\"],\"Express\",\"1000\",\"999\",\"1604524310\",\"Origin, Accept-Encoding\",\"true\",\"max-age=43200\",\"no-cache\",\"-1\",\"nosniff\",\"W/\\\"53-hfEnumeNh6YirfjyjaujcOPPT+s\\\"\",\"1.1 vegur\",\"HIT\",\"23091\",\"bytes\",\"0894e9eedd0000ef61951e4000000001\",\"{\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\\\/\\\\/a.nel.cloudflare.com\\\\/report?s=xPql%2Fb%2B26R5%2BNVLUsiUFEuZj7qUHIGAjXdlWJqo6JZ1mAOcbIPEK%2BT0OP%2BnT1eeznuAv%2Bhvp1HtOudoTHkqOODN7wyP%2FhibCxUcP5F8uApzrqE7zuywYNf4orjsS\\\"}],\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"cloudflare\",\"629b45c499e9ef61-NRT\",\"h3-27=\\\":443\\\"; ma=86400, h3-28=\\\":443\\\"; ma=86400, h3-29=\\\":443\\\"; ma=86400\",\"__cfduid=daee93fd26c0d600736e76dfa91f191d61614694897; expires=Thu, 01-Apr-21 14:21:37 GMT; path=/; domain=.typicode.com; HttpOnly; SameSite=Lax\"]",
        "meta": null,
        "operation_type": "RESPONSE",
        "createdAt": "2021-03-02 14:21:37.616803"
    }
]


export const HTTP_RESPONSE_BODY = {
    "completed": false,
    "id": 1,
    "title": "delectus aut autem",
    "userId": 1,
}