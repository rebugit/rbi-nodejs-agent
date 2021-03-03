import {customIntegrationCallback} from "../integrations/customIntegration";

export interface IIntegrationConfig {
    extraFields?: string[]
    blackListFields?: string[]
}

export interface  IGlobalConfig {
    apiKey: string
    integrationsConfig?: { [key: string]: IIntegrationConfig },
    customIntegrations: { [key: string]: customIntegrationCallback }
}
