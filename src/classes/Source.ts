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
import { HttpClient, HttpHandler } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';

import  { ISourceResult,ISource } from '@keptn/pitometer/dist/types';
import {
  ApiModule,
  ResultsService,
  ConfigurationParameters,
  Configuration,
  ArrayOfElementDefinition,
  ElementDefinition,
  Point, CounterDefinition, CounterDefinitionArray, ArrayOfTestDefinition, TestDefinition
} from '@neotys/neoload-api';
import {Environement} from "./Environement";
import {NeoLoadContext} from "./NeoLoadContext";
import {INeoLoadOptions} from "./NeoLoadOptions";


export class Source implements ISource {
  private timeStart?: number;
  private timeEnd?: number;
  private context?: string;
  private apimodule:ApiModule ;
  private resultAPI: ResultsService;
  private neoloadContext:NeoLoadContext;
  private httclient:HttpClient;
  private httpHandler: HttpHandler;
  private  timereference:number;
  private conf:Configuration
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
    let token : { [key: string]: string} = {};
    token["accountToken"] = environement.apiToken;
    this.conf = new Configuration({apiKeys:token, basePath:environement.neoloadapirul});
    // @ts-ignore
    this.httpHandler = new HttpHandler();
    this.httclient =new HttpClient(this.httpHandler);
    this.resultAPI=new ResultsService(this.httclient,this.conf.basePath,this.conf);
  }

  public setOptions(options: INeoLoadOptions) {
    this.timeStart = options.timeStart;
    this.timeEnd = options.timeEnd;
    this.context = options.context;

    this.neoloadContext=new NeoLoadContext(options.neoloadContext);
  }

  async fechglobal(query):  Promise<ISourceResult[] | boolean>  {

    var id:string ="all-requests";


    var result:Array<ISourceResult>=new Array<ISourceResult>();

        this.resultAPI.getTestElementsPoints(this.neoloadContext.testid,id,query.statistics).subscribe(elementpoint=>{
        elementpoint.forEach(point=>{
          result.push({key:query.statistics,
            timestamp:this.timereference + point.from,
            value:this.getElementValue(query.statistics,point)});
        })
    });


      return result;

  }


  async fechelement(query):  Promise<ISourceResult[] | boolean>  {
    var elementype:string;

    switch (query.elementType.toString().toUpperCase()) {

      case Source.TRANSACTION:
        elementype= Source.TRANSACTION;
        break;
      case Source.PAGE:
        elementype=Source.PAGE;
        break;

      case Source.REQUEST:
        elementype=Source.REQUEST;
        break;

      default:
        throw new Error(`Unsupported element type (${query})`);

    }
    var arrayOfElementDefinition:Observable<ArrayOfElementDefinition>=this.resultAPI.getTestElements(this.neoloadContext.testid,elementype);

    var result:Array<ISourceResult>=new Array<ISourceResult>();
    arrayOfElementDefinition.subscribe(arrayofelement=>{
      arrayofelement.filter(function getid(element)  {
        return element.name==query.metricname;
      }).forEach(element=>{

        this.resultAPI.getTestElementsPoints(this.neoloadContext.testid,element.id,query.statistics).subscribe(elementpoint=>{
          elementpoint.forEach(point=>{
            result.push( {key: element.name,
              timestamp:this.timereference + point.from,
              value:this.getElementValue(query.statistics,point)});
          })

        })});
    });

   return result;

  }


   getTimeReference():number  {
    var testtime:number;
    this.resultAPI.getTest(this.neoloadContext.testid).subscribe(test=>{
      testtime=test.startDate;
    });

    return testtime;
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


  async fechmonitoring(query):  Promise<ISourceResult[] | boolean>
  {
    var arraycounter:Observable<CounterDefinitionArray>=this.resultAPI.getTestMonitors(this.neoloadContext.testid);


    var result:Array<ISourceResult>=new Array<ISourceResult>();
    arraycounter.subscribe(arraycounter=> {
      arraycounter.filter(function getid(counter) {
        return counter.name == query.metricname;
      }).forEach(counterdef => {

        this.resultAPI.getTestMonitorsPoints(this.neoloadContext.testid, counterdef.id).subscribe(elementpoint => {
          elementpoint.forEach(point=>{
            result.push({
              key: counterdef.name,
              timestamp: this.timereference + point.from,
              value: point.AVG
            })
          });
        });
      });
    });


    return result;
  }

  getTestId():string
  {
      const teststatus:string="TERMINATED";
      var lastest:Array<TestDefinition>=new Array<TestDefinition>();
      this.resultAPI.getTests(teststatus,this.neoloadContext.projectName).subscribe(testdefinition=>{
        lastest.push(testdefinition.filter(function(def){
          return def.scenario==this.neoloadContext.scenarioName && def.startDate>=this.timeStart;
        }).slice(-1)[0]);
      });


      return lastest.slice(-1)[0].id
  }

  async fetch(query): Promise<ISourceResult[] | boolean>
  {

    const typemonitoring:string="monitoring";
    const typeelements:string="element";
    const typeglobal:string="global";

    if(!this.neoloadContext.testid )
    {
      //---get the sample id of the sample
      this.neoloadContext.testid=this.getTestId()

    }
    this.timereference=this.getTimeReference();

    switch (query.metryType) {
      case typeelements:
        return this.fechelement(query);
        break;

      case typemonitoring:
        return this.fechmonitoring(query);
        break;
      case typeglobal:
        return this.fechglobal(query);
        break;
      default:
        throw new Error(`Unsupported metric type (${query})`);

    }


  }
}
