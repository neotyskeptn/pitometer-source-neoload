/**
 * Copyright 2019, Dynatrace
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import  { ISourceResult,ISource } from '@keptn/pitometer/dist/types';

import {Environement} from "./Environement";
import {NeoLoadContext} from "./NeoLoadContext";
import {INeoLoadOptions} from "./NeoLoadOptions";

import Swagger = require('swagger-client');

import {
  ArrayOfElementDefinition,
  CounterDefinition,
  ElementDefinition,
  Point,
  TestDefinition
} from "@neotys/neoload-api/dist";
import {throws} from "assert";

export class Source implements ISource {
  private timeStart?: number;
  private timeEnd?: number;
  private context?: string;
  private environment: Environement;
  private neoloadContext:NeoLoadContext;
  private  timereference:number;

  private  static TRANSACTION:string="TRANSACTION";
  private static  REQUEST:string ="REQUEST";
  private static PAGE:string="PAGE";

  private static  AVG_DURATION:string="AVG_DURATION";
  private static MIN_DURATION:string ="MIN_DURATION";
  private static MAX_DURATION:string ="MAX_DURATION";
  private static COUNT:string ="COUNT";
  private static THROUGHPUT:string="THROUGHPUT";
  private static ELEMENTS_PER_SECOND:string="ELEMENTS_PER_SECOND";
  private static ERRORS:string="ELEMENTS_PER_SECOND";
  private static ERRORS_PER_SECOND:string="ERRORS_PER_SECOND";
  private static  ERROR_RATE:string="ERROR_RATE";
  private static AVG_TTFB:string="AVG_TTFB";
  private static MIN_TTFB: string="MIN_TTFB";
  private static MAX_TTFB:string ="MAX_TTFB";


  constructor( environement:Environement ) {

      this.environment = environement;


  }
  public setOptions(options: INeoLoadOptions) {
    this.timeStart = options.timeStart;
    this.timeEnd = options.timeEnd;
    this.context = options.context;

    this.neoloadContext=new NeoLoadContext(options.neoloadContext);
  }

  async fechglobal(query,timereference:number):  Promise<ISourceResult[] | boolean>  {

    var id:string ="all-requests";


    var result:Array<ISourceResult>=[];
     var apitoken=this.environment.apiToken;

     return new Promise<ISourceResult[]|boolean>(((resolve, reject) => {
         Swagger( this.environment.neoloadapirul + "/explore/swagger.yaml", {
             requestInterceptor: function (temp) {
                 this.headers = {...this.headers,accountToken: apitoken};
                 // console.log(temp);
             },
         }).then(client=> {
                 client.apis.Results.GetTestElementsPoints({testId: this.neoloadContext.testid,elementId:id,statistics:query.statistics}).then(
                     response=>{
                         var arrayJson:Array<Point>=[];
                         arrayJson=response.body;
                         arrayJson.forEach(point=>{
                             result.push({key:query.statistics,
                                 timestamp:timereference + point.from,
                                 value:this.getElementValue(query.statistics,point)});
                         });

                         resolve(result);
                     }
                 ).catch(error=>{
                     reject(error);
                 } );

             }

         ).catch(error=>{
            reject(error);
         } );
     }));




  }


  async fechelement(query,timereference:number):  Promise<ISourceResult[] | boolean>  {
    var elementype:string;


    return new Promise<ISourceResult[]|boolean>((resolve, reject) => {
        switch (query.elementType.toString().toUpperCase()) {

            case Source.TRANSACTION:
                elementype = Source.TRANSACTION;
                break;
            case Source.PAGE:
                elementype = Source.PAGE;
                break;

            case Source.REQUEST:
                elementype = Source.REQUEST;
                break;

            default:
                reject(`Unsupported element type (${query})`);

        }
        let arrayofelementid: Array<string> =[];
        var apitoken = this.environment.apiToken;
        Swagger(this.environment.neoloadapirul + "/explore/swagger.yaml", {
            requestInterceptor: function (temp) {
                this.headers = {...this.headers, accountToken: apitoken};
                // console.log(temp);
            },
        }).then(client => {
                client.apis.Results.GetTestElements({testId: this.neoloadContext.testid, category: elementype}).then(
                    response => {
                        var arrayJson: Array<ElementDefinition>=[];
                        arrayJson = response.body;

                        arrayJson.filter(function getid(element) {
                            return element.name == query.metricname;
                        }).forEach(elementdefinitino => {
                            arrayofelementid.push(elementdefinitino.id)
                        });
                        var result: Array<ISourceResult>=[];
                        arrayofelementid.forEach(elementid => {
                            client.apis.Results.GetTestElementsPoints({
                                testId: this.neoloadContext.testid,
                                elementId: elementid,
                                statistics: query.statistics
                            }).then(
                                response => {
                                    var arrayJson: Array<Point>=[];
                                    arrayJson = response.body;
                                    arrayJson.forEach(point => {
                                        result.push({
                                            key: query.statistics,
                                            timestamp: timereference + point.from,
                                            value: this.getElementValue(query.statistics, point)
                                        });
                                    });
                                    resolve(result);
                                }
                            ).catch(error => {
                                reject(error);
                            });
                        });

                    }
                ).catch(error => {
                    reject(error);
                });

            }
        ).catch(error => {
            reject(error);
        });


    });






  }


   getTimeReference():Promise<number>  {
    var testtime:number;

       var apitoken=this.environment.apiToken;
       return new Promise<number>(((resolve, reject) => {
           Swagger(this.environment.neoloadapirul + "/explore/swagger.yaml", {
               requestInterceptor: function (temp) {
                   this.headers = {...this.headers,accountToken: apitoken};
                   // console.log(temp);
               },
           }).then(client=> {
                   client.apis.Results.GetTest({testId: this.neoloadContext.testid}).then(
                       response=>{
                           resolve(testtime=response.body.startDate);
                       }
                   );

               }

           ).catch(error=>{
               reject(error);
           } );

       }));




  }

   getElementValue(elementStatisticName: string, element: Point):number  {
    switch (elementStatisticName.toUpperCase()) {
      case Source.MAX_DURATION:
        return element.MAX_DURATION;
      case Source.AVG_DURATION:
        return element.AVG_DURATION;
      case Source.MIN_DURATION:
        return element.MIN_DURATION;
      case Source.COUNT:
        return element.COUNT;
      case Source.ELEMENTS_PER_SECOND:
        return element.ELEMENTS_PER_SECOND;
      case Source.ERRORS:
        return element.ERRORS;
      case Source.ERRORS_PER_SECOND:
        return element.ERRORS_PER_SECOND;
      case Source.AVG_TTFB:
        return element.AVG_TTFB;
      case Source.MIN_TTFB:
        return element.MIN_TTFB;
      case Source.MAX_TTFB:
        return element.MAX_TTFB;
      case Source.THROUGHPUT:
        return element.THROUGHPUT;
      case Source.ERROR_RATE:
        return element.ERROR_RATE;
    }
  }


  async fechmonitoring(query,timereference:number):  Promise<ISourceResult[] | boolean>
  {
     var monitordefinition:Array<string>=[];
     var apitoken=this.environment.apiToken;
     return new Promise<ISourceResult[]|boolean>(((resolve, reject) => {
         Swagger(this.environment.neoloadapirul + "/explore/swagger.yaml", {
             requestInterceptor: function (temp) {
                 this.headers = {...this.headers,accountToken: apitoken};
                 // console.log(temp);
             },
         }).then(client=> {
                 client.apis.Results.GetTestMonitors({testId: this.neoloadContext.testid}).then(
                     response=>{
                         var arrayJson:Array<CounterDefinition>=[];
                         arrayJson=response.body;

                         arrayJson.filter(function getid(element)  {
                             return element.name==query.metricname;
                         }).forEach(elementdefinitino=>{
                             monitordefinition.push(elementdefinitino.id)
                         });

                     }
                 ).catch(error=>{
                    reject(error);
                 } );

             }

         ).catch(error=>{
             reject(error);
         } );
         var result:Array<ISourceResult>=[];
         monitordefinition.forEach(elementid=>{
             Swagger( this.environment.neoloadapirul + "/explore/swagger.yaml", {
                 requestInterceptor: function (temp) {
                     this.headers = {accountToken: apitoken};
                     // console.log(temp);
                 },
             }).then(client=> {
                     client.apis.Results.GetTestMonitorsPoints({testId: this.neoloadContext.testid,counterId:elementid}).then(
                         response=>{
                             var arrayJson:Array<Point>=[];
                             arrayJson=response.body;
                             arrayJson.forEach(point=>{
                                 result.push({key:query.statistics,
                                     timestamp:timereference + point.from,
                                     value:point.AVG});
                             });
                             resolve(result);
                         }
                     ).catch(error=>{
                         reject(error);
                     } );

                 }

             ).catch(error=>{
                 reject(error);
             } );
         });

     }))

  }

  getTestId():Promise<string>
  {
      const teststatus:string="TERMINATED";
      var lastest:Array<string>=[];
      var apitoken=this.environment.apiToken;

      return new Promise<string>((resolve,reject) => {
          Swagger(this.environment.neoloadapirul + "/explore/swagger.yaml", {
              requestInterceptor: function (temp) {
                  this.headers = {accountToken: apitoken};
                  // console.log(temp);
              },
          }).then(client=> {
                  client.apis.Results.GetTests({testId: this.neoloadContext.testid}).then(
                      response => {
                          var testDefinitions: Array<TestDefinition>=[];
                          testDefinitions = response.body;
                          testDefinitions.filter(function (def) {
                              return def.scenario == this.neoloadContext.scenarioName && def.startDate >= this.timeStart;
                          }).forEach(testdefinition => {
                              lastest.push(testdefinition.id)
                          });
                          resolve( lastest.slice(-1)[0]);
                      }
                  ).catch(error=>{
                      reject( error);
                  } );
              }
          ).catch(error=>{
              reject(error);
          } );

      });





  }

  async fetch(query): Promise<ISourceResult[] | boolean>
  {

    const typemonitoring:string="monitoring";
    const typeelements:string="element";
    const typeglobal:string="global";

    return new Promise<ISourceResult[]|boolean>((resolve,reject) => {
        if(!this.neoloadContext.testid )
        {
            //---get the sample id of the sample
            this.getTestId().then(id=>this.neoloadContext.testid).catch(error=>{reject(error)});

        }
        this.getTimeReference().then(
            timereference=>
            {
                switch (query.metryType) {
                    case typeelements:
                        resolve( this.fechelement(query,timereference));
                        break;

                    case typemonitoring:
                        resolve( this.fechmonitoring(query,timereference));
                        break;
                    case typeglobal:
                        resolve( this.fechglobal(query,timereference));
                        break;
                    default:
                        reject(`Unsupported metric type (${query})`);

                }
            }
        );

    });


  }
}
