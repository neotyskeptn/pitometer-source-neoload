export interface EnvironementParameters {
    neoloadapirul?:string;
    neoloaduploadurl?: string;
    apiToken?: string;
}

export class Environement {
    neoloadapirul?: string;
    neoloaduploadurl?: string;
    apiToken?: string;


    constructor(configurationParameters: EnvironementParameters = {}) {
        this.neoloadapirul = configurationParameters.neoloadapirul;
        this.neoloaduploadurl = configurationParameters.neoloaduploadurl;
        this.apiToken = configurationParameters.apiToken;
    }


}