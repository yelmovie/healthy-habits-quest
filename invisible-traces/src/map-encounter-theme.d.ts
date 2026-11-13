import type { MapEncounterStage,MapPoint } from './map-encounters.js';
export const encounterLook:{palette:string;effect:string;art:{left:string;right?:string;frames:number}};
export function encounterStage(index:number,id:string|number,name:string,point:MapPoint):MapEncounterStage;
