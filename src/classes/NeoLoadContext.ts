export interface NeoLoadContextarameters {
    testid?:string;
    projectName?: string;
    scenarioName?: string;
}

export class NeoLoadContext {
    testid?: string;
    projectName?: string;
    scenarioName?: string;


    constructor(configurationParameters: NeoLoadContextarameters = {}) {
        this.testid = configurationParameters.testid;
        this.projectName = configurationParameters.projectName;
        this.scenarioName = configurationParameters.scenarioName;
    }


}