import hsk1 from "../data/hsk1.json";
import hsk2 from "../data/hsk2.json";
import hsk3 from "../data/hsk3.json";
import hsk4 from "../data/hsk4.json";
import hsk5 from "../data/hsk5.json";
type RawQuestion={id:string;level:number;question_cn:string;question_en:string;passage_cn?:string;passage_en?:string;options:Record<string,string>;correct_answer:string};
const questions=([] as RawQuestion[]).concat(hsk1,hsk2,hsk3,hsk4,hsk5);
export function trustedQuestion(id:string){const q=questions.find(x=>x.id===id);if(!q)return undefined;return {...q,contentVersion:`legacy-hsk${q.level}-20260820`};}
