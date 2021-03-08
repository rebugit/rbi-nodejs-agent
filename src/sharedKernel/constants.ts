export enum Environments {
    DEBUG = 'debug'
}

/**
 * Those are fixed correlations ids, for example lambda event and context
 * are going to be unique for every trace
 */
export enum CorrelationIds {
    LAMBDA_REQUEST = 'LAMBDA_REQUEST',
    ENVIRONMENT_INPUT = 'ENVIRONMENT_INPUT'
}

export enum InternalExceptions {
    LambdaIntegrationApiError = 'LambdaIntegrationApiError',
    LambdaIntegrationError = 'LambdaIntegrationError',
    HandlerIntegrationApiError = 'HandlerIntegrationApiError'
}
