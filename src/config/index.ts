import {customIntegrationCallback} from "../integrations/customIntegration";
import {ITraceServiceApi} from "../trace/Api";

export interface IIntegrationConfig {
    extraFields?: string[]
    blackListFields?: string[]
}

export interface  IGlobalConfig {
    apiKey: string
    integrationsConfig?: { [key: string]: IIntegrationConfig },
    customIntegrations: { [key: string]: customIntegrationCallback },
    proxy: ITraceServiceApi
}
