import {readFile} from "node:fs/promises";
import type {AssessmentLevelAudio} from "../src/lib/commercial/product-generator.ts";

export async function loadAssessmentLevelAudio():Promise<AssessmentLevelAudio>{
  const dir=new URL("../assets/audio/mock-assessment-v2/",import.meta.url);
  const index=new Uint8Array(await readFile(new URL("timing-index.json",dir)));
  const parsed=JSON.parse(new TextDecoder().decode(index)) as {forms:Record<string,{levelTracks:Array<{file:string}>}>};
  const tracks:Record<string,Uint8Array>={};
  for(const form of Object.values(parsed.forms))for(const track of form.levelTracks)tracks[track.file]=new Uint8Array(await readFile(new URL(track.file,dir)));
  return {index,tracks};
}
