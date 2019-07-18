import {IOptions} from "@keptn/pitometer";
import {NeoLoadContext} from "./NeoLoadContext";

export interface INeoLoadOptions extends IOptions{
    neoloadContext:NeoLoadContext;
}