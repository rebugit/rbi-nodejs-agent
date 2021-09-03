import {DynamoDB} from "aws-sdk";
import {DeleteTableInput, CreateTableInput, PutItemInput, GetItemInput} from "aws-sdk/clients/dynamodb"

const DYNAMODB_ENDPOINT = `http://${process.env.TEST_HOST}:8000`
const DYNAMODB_TABLE_NAME = 'CUSTOMER_LIST'

const dynamoDb = new DynamoDB({
    region: 'us-east-1',
    apiVersion: '2012-08-10',
    endpoint: DYNAMODB_ENDPOINT
})

const dynamoDbDocumentClient = new DynamoDB.DocumentClient({
    region: 'us-east-1',
    endpoint: DYNAMODB_ENDPOINT
});

export const dropDynamodbTable = async () => {
    const params: DeleteTableInput = {
        TableName: DYNAMODB_TABLE_NAME
    }
    await dynamoDb.deleteTable(params).promise()
}

export const seedDynamodbTable = async () => {
    const params: CreateTableInput = {
        AttributeDefinitions: [
            {
                AttributeName: 'CUSTOMER_ID',
                AttributeType: 'S'
            },
            {
                AttributeName: 'CUSTOMER_NAME',
                AttributeType: 'S'
            }
        ],
        KeySchema: [
            {
                AttributeName: 'CUSTOMER_ID',
                KeyType: 'HASH'
            },
            {
                AttributeName: 'CUSTOMER_NAME',
                KeyType: 'RANGE'
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        },
        TableName: DYNAMODB_TABLE_NAME,
        StreamSpecification: {
            StreamEnabled: false
        }
    };

    await dynamoDb.createTable(params).promise()

    const customer1: PutItemInput = {
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
            'CUSTOMER_ID': {S: '001'},
            'CUSTOMER_NAME': {S: 'Mortimer Smith'},
            age: {S: '14'}
        }
    };

    const customer2: PutItemInput = {
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
            'CUSTOMER_ID': {S: '002'},
            'CUSTOMER_NAME': {S: 'Rick Sanchez'},
            age: {S: '70'}
        }
    };

    await dynamoDb.putItem(customer1).promise()
    await dynamoDb.putItem(customer2).promise()
}


export const putRequestWithDynamodb = async () => {
    const params = {
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
            'CUSTOMER_ID': '003',
            'CUSTOMER_NAME': 'Matteo Gioioso',
            age: 37
        }
    };

    return dynamoDbDocumentClient.put(params).promise()
};

export const getRequestWithDynamodb = async () => {
    const params = {
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
            'CUSTOMER_ID': '002',
            'CUSTOMER_NAME': 'Rick Sanchez'
        }
    };

    return dynamoDbDocumentClient.get(params).promise()
}