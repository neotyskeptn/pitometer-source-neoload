export interface EnvironementParameters {
    neoloadapirul?:string;
    neoloadwuploadurl?: string;
    apiToken?: string;
}

export class Environement {
    neoloadapirul?: string;
    neoloadwuploadurl?: string;
    apiToken?: string;


    constructor(configurationParameters: EnvironementParameters = {}) {
        this.neoloadapirul = configurationParameters.neoloadapirul;
        this.neoloadwuploadurl = configurationParameters.neoloadwuploadurl;
        this.apiToken = configurationParameters.apiToken;
    }


}