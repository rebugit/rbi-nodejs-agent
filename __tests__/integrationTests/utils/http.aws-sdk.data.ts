export const traces = [
    {
        id: '',
        projectId: '',
        traceId: 'a0e101ef-4958-40ea-84cb-10789e0c20d3',
        tenantId: '',
        correlationId: `POST_${process.env.TEST_HOST}/_DynamoDB_20120810.GetItem_dab0a6a66b0c6978efb0a7ada75f1b53e5901ba6dd9570f9419f582e06ab72dc`,
        operationType: 'DYNAMODB',
        data: '[{"body":"1","headers":"2","statusCode":200,"statusMessage":"3"},"{\\"Item\\":{\\"city\\":{\\"M\\":{\\"city\\":{\\"S\\":\\"Ho Chi Minh City\\"},\\"address\\":{\\"S\\":\\"Cầu Thủ Thiêm\\"}}},\\"createdAt\\":{\\"N\\":\\"1617245457125\\"},\\"time\\":{\\"S\\":\\"2021-04-01T02:00:00Z\\"},\\"id\\":{\\"S\\":\\"155ed150-9295-11eb-8c38-5fede2f3bc0d\\"},\\"data\\":{\\"M\\":{\\"next_12_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"partlycloudy_day\\"}}}}},\\"next_6_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"partlycloudy_day\\"}}},\\"details\\":{\\"M\\":{\\"precipitation_amount\\":{\\"N\\":\\"0.2\\"}}}}},\\"instant\\":{\\"M\\":{\\"details\\":{\\"M\\":{\\"air_pressure_at_sea_level\\":{\\"N\\":\\"1009.5\\"},\\"wind_speed\\":{\\"N\\":\\"3.1\\"},\\"air_temperature\\":{\\"N\\":\\"30.1\\"},\\"cloud_area_fraction\\":{\\"N\\":\\"87.5\\"},\\"relative_humidity\\":{\\"N\\":\\"67.5\\"},\\"wind_from_direction\\":{\\"N\\":\\"188.7\\"}}}}},\\"next_1_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"cloudy\\"}}},\\"details\\":{\\"M\\":{\\"precipitation_amount\\":{\\"N\\":\\"0.1\\"}}}}}}},\\"updatedAt\\":{\\"N\\":\\"1617245457125\\"}}}",{"server":"4","date":"5","content-type":"6","content-length":"7","connection":"8","x-amzn-requestid":"9","x-amz-crc32":"10"},"OK","Server","Thu, 01 Apr 2021 08:58:16 GMT","application/x-amz-json-1.0","839","keep-alive","20SR01NRAD3O12MKAM86SN6NQVVV4KQNSO5AEMVJF66Q9ASUAAJG","277829062"]',
        meta: null
    },
    {
        id: '',
        projectId: '',
        traceId: 'a0e101ef-4958-40ea-84cb-10789e0c20d3',
        tenantId: '',
        correlationId: `POST_${process.env.TEST_HOST}/_DynamoDB_20120810.GetItem_dab0a6a66b0c6978efb0a7ada75f1b53e5901ba6dd9570f9419f582e06ab72dc`,
        operationType: 'DYNAMODB',
        data: '[{"body":"1","headers":"2","statusCode":200,"statusMessage":"3"},"{\\"Item\\":{\\"city\\":{\\"M\\":{\\"city\\":{\\"S\\":\\"Ho Chi Minh City\\"},\\"address\\":{\\"S\\":\\"Cầu Thủ Thiêm\\"}}},\\"createdAt\\":{\\"N\\":\\"1617245457125\\"},\\"time\\":{\\"S\\":\\"2021-04-01T02:00:00Z\\"},\\"id\\":{\\"S\\":\\"155ed150-9295-11eb-8c38-5fede2f3bc0d\\"},\\"data\\":{\\"M\\":{\\"next_12_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"partlycloudy_day\\"}}}}},\\"next_6_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"partlycloudy_day\\"}}},\\"details\\":{\\"M\\":{\\"precipitation_amount\\":{\\"N\\":\\"0.2\\"}}}}},\\"instant\\":{\\"M\\":{\\"details\\":{\\"M\\":{\\"air_pressure_at_sea_level\\":{\\"N\\":\\"1009.5\\"},\\"wind_speed\\":{\\"N\\":\\"3.1\\"},\\"air_temperature\\":{\\"N\\":\\"30.1\\"},\\"cloud_area_fraction\\":{\\"N\\":\\"87.5\\"},\\"relative_humidity\\":{\\"N\\":\\"67.5\\"},\\"wind_from_direction\\":{\\"N\\":\\"188.7\\"}}}}},\\"next_1_hours\\":{\\"M\\":{\\"summary\\":{\\"M\\":{\\"symbol_code\\":{\\"S\\":\\"cloudy\\"}}},\\"details\\":{\\"M\\":{\\"precipitation_amount\\":{\\"N\\":\\"0.1\\"}}}}}}},\\"updatedAt\\":{\\"N\\":\\"1617245457125\\"}}}",{"server":"4","date":"5","content-type":"6","content-length":"7","connection":"8","x-amzn-requestid":"9","x-amz-crc32":"10"},"OK","Server","Thu, 01 Apr 2021 08:58:16 GMT","application/x-amz-json-1.0","839","keep-alive","20SR01NRAD3O12MKAM86SN6NQVVV4KQNSO5AEMVJF66Q9ASUAAJG","277829062"]',
        meta: null
    },
    {
        id: '',
        projectId: '',
        traceId: 'a0e101ef-4958-40ea-84cb-10789e0c20d3',
        tenantId: '',
        correlationId: `POST_${process.env.TEST_HOST}/_DynamoDB_20120810.PutItem_26ef5afdfad34d68a392daea5947a0753bbb68e1453f4f6858b621cab624f931`,
        operationType: 'DYNAMODB',
        data: '[{"body":"1","headers":"2","statusCode":200,"statusMessage":"3"},"{}",{"server":"4","date":"5","content-type":"6","content-length":"7","connection":"8","x-amzn-requestid":"9","x-amz-crc32":"10"},"OK","Server","Thu, 22 Apr 2021 01:44:31 GMT","application/x-amz-json-1.0","2","keep-alive","UEEEE811P47748CPIP58FAMPA3VV4KQNSO5AEMVJF66Q9ASUAAJG","2745614147"]',
        meta: null
    }
]

export const dynamodbGetItemResponseBody = {
    "Item": {
        "CUSTOMER_ID": "002",
        "CUSTOMER_NAME": "Rick Sanchez",
        "age": "70"
    }
}

export const dynamodbGetItemResponseBodyDebugMode = {
    "Item": {
        "city": {
            "city": "Ho Chi Minh City",
            "address": "Cầu Thủ Thiêm"
        },
        "createdAt": 1617245457125,
        "time": "2021-04-01T02:00:00Z",
        "id": "155ed150-9295-11eb-8c38-5fede2f3bc0d",
        "data": {
            "next_12_hours": {
                "summary": {
                    "symbol_code": "partlycloudy_day"
                }
            },
            "next_6_hours": {
                "summary": {
                    "symbol_code": "partlycloudy_day"
                },
                "details": {
                    "precipitation_amount": 0.2
                }
            },
            "instant": {
                "details": {
                    "air_pressure_at_sea_level": 1009.5,
                    "wind_speed": 3.1,
                    "air_temperature": 30.1,
                    "cloud_area_fraction": 87.5,
                    "relative_humidity": 67.5,
                    "wind_from_direction": 188.7
                }
            },
            "next_1_hours": {
                "summary": {
                    "symbol_code": "cloudy"
                },
                "details": {
                    "precipitation_amount": 0.1
                }
            }
        },
        "updatedAt": 1617245457125
    }
}