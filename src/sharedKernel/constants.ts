export enum Environments {
    DEBUG = 'debug'
}

export enum CorrelationIds {
    LAMBDA_REQUEST = 'LAMBDA_REQUEST',
    ENVIRONMENT_INPUT = 'ENVIRONMENT_INPUT'
}

export enum InternalExceptions {
    LambdaIntegrationApiError = 'LambdaIntegrationApiError',
    LambdaIntegrationError = 'LambdaIntegrationError',
    HandlerIntegrationApiError = 'HandlerIntegrationApiError'
}
