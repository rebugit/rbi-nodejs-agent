export interface IIntegrationConfig {
    extraFields?: string[]
}

export interface  IGlobalConfig {
    apiKey: string
    integrationsConfig?: { [key: string]: IIntegrationConfig }
}
