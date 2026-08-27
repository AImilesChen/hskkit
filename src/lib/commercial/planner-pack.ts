export type PlannerRouteMinutes=20|30|45;
export type PlannerSkill="vocabulary"|"listening"|"reading"|"writing";
export type PlannerDay={day:number;phase:string;focus:string;materials:string[];routes:Record<PlannerRouteMinutes,string>;evidence:string[]};
export type AssessmentMapping={skill:PlannerSkill;band:"below-50"|"50-74"|"75-plus";practiceDirection:string[];firstAssignment:string};

export type PlannerPack={
  positioning:string;
  workflow:string[];
  setupPrompts:string[];
  days:PlannerDay[];
  weeklyReviews:Array<{day:number;prompts:string[]}>;
  assessmentMappings:AssessmentMapping[];
  recoveryWorksheet:{title:string;rule:string;prompts:string[]};
  finalReview:{title:string;prompts:string[]};
};

type DaySeed={focus:string;kind:PlannerSkill|"integration"|"assessment";task:string;materials:string[];evidence:string[]};

const DAY_SEEDS:DaySeed[]=[
  {focus:"Baseline retrieval sample",kind:"assessment",task:"sample current performance without notes",materials:["20 known-or-recent words","10 short reading items","5 sentence prompts"],evidence:["word recall /20","reading accuracy /10","sentences accurate /5"]},
  {focus:"Meaning retrieval",kind:"vocabulary",task:"cover each meaning and retrieve it from the Chinese word",materials:["current-level word list","blank response paper"],evidence:["correct first recalls","words needing a second attempt"]},
  {focus:"Tone and syllable discrimination",kind:"listening",task:"hear or read target syllables, mark tones, then verify",materials:["current-level audio or teacher recording","target-word list"],evidence:["tones correct","confused sound pairs"]},
  {focus:"Sentence cloze",kind:"reading",task:"complete context sentences and underline the clue that determines each answer",materials:["current-level cloze items","answer key after completion"],evidence:["items correct","context clues identified"]},
  {focus:"Listening for key details",kind:"listening",task:"listen once, record names/numbers/actions, then replay to correct only missed details",materials:["one short current-level recording","detail grid"],evidence:["details captured on first listen","details corrected on replay"]},
  {focus:"Controlled sentence building",kind:"writing",task:"write complete sentences with target words and self-check word order",materials:["review word set","sentence checklist"],evidence:["complete sentences","word-order revisions"]},
  {focus:"Week 1 checkpoint",kind:"assessment",task:"run a closed-book mixed check and sort errors by skill",materials:["12 review words","one short input","three output prompts"],evidence:["secure items","error count by skill"]},
  {focus:"Spaced retrieval reset",kind:"vocabulary",task:"retrieve missed Week 1 words before adding a smaller new set",materials:["Week 1 error list","current-level word list"],evidence:["previous misses now secure","new items recalled"]},
  {focus:"Dialogue completion",kind:"listening",task:"complete missing turns, then read the full exchange aloud with natural timing",materials:["one current-level dialogue","response sheet"],evidence:["turns completed","one repaired response"]},
  {focus:"Sentence ordering",kind:"reading",task:"reorder sentence parts and explain which connector or grammar cue fixes the order",materials:["current-level ordering items","grammar notes after attempt"],evidence:["orders correct","ordering cues named"]},
  {focus:"Listening sequence",kind:"listening",task:"number events in order and write a one-sentence summary from memory",materials:["one short narrative audio","sequence boxes"],evidence:["events in correct order","summary accuracy"]},
  {focus:"Reading main idea and support",kind:"reading",task:"state the main idea and cite exact supporting details",materials:["one current-level passage","two-color pen or highlights"],evidence:["main idea","supporting details cited"]},
  {focus:"Error correction",kind:"writing",task:"correct inaccurate sentences and write the reason for each change",materials:["current-level error sentences","self-check guide"],evidence:["errors corrected","reasons accurate"]},
  {focus:"Week 2 transfer check",kind:"assessment",task:"complete fresh items from the weakest Assessment direction without using Week 1 examples",materials:["fresh vocabulary/input/output items","Assessment mapping page"],evidence:["fresh-item accuracy","remaining task-family gap"]},
  {focus:"Information matching",kind:"reading",task:"match statements to notices, speakers or paragraphs and mark the decisive evidence",materials:["current-level multi-part text","matching grid"],evidence:["matches correct","decisive evidence marked"]},
  {focus:"Listening inference",kind:"listening",task:"identify speaker purpose or attitude and record the phrase supporting the inference",materials:["one current-level dialogue or passage","inference table"],evidence:["inferences correct","support phrases"]},
  {focus:"Paraphrase and synonym control",kind:"vocabulary",task:"replace target expressions without changing meaning, then verify register",materials:["review word set","six source sentences"],evidence:["meaning preserved","register mismatches"]},
  {focus:"Guided paragraph",kind:"writing",task:"plan, draft and revise one connected paragraph using supplied evidence",materials:["one prompt","target connector list","revision checklist"],evidence:["required points included","revisions made"]},
  {focus:"Cross-skill dictation",kind:"integration",task:"listen, transcribe, compare, then reuse corrected language in a new sentence",materials:["short current-level audio","transcript revealed after attempt"],evidence:["words transcribed correctly","new sentence completed"]},
  {focus:"Timed reading",kind:"reading",task:"read under a fixed time limit, answer, then classify every miss as vocabulary, detail or inference",materials:["one fresh current-level passage","timer","error table"],evidence:["items correct within time","miss type"]},
  {focus:"Week 3 production check",kind:"assessment",task:"produce language without a model and score it against completion, accuracy and clarity",materials:["three speaking or writing prompts","three-point rubric"],evidence:["rubric score","one priority revision"]},
  {focus:"Weakest-skill repair 1",kind:"integration",task:"complete the first prescribed Assessment mapping assignment and redo only incorrect parts",materials:["Assessment mapping page","fresh weakest-skill practice"],evidence:["first-attempt result","redo result"]},
  {focus:"Weakest-skill repair 2",kind:"integration",task:"repeat the same task family with fresh content and compare against Day 22",materials:["fresh parallel practice","Day 22 evidence"],evidence:["parallel-task result","change from Day 22"]},
  {focus:"Multi-step instructions",kind:"listening",task:"follow an instruction sequence, record each step and identify the consequence of one missed step",materials:["current-level instruction audio or text","step grid"],evidence:["steps captured","consequence explained"]},
  {focus:"Compare two texts",kind:"reading",task:"record one agreement, one difference and one evidence line from each text",materials:["two short related texts","comparison grid"],evidence:["agreement and difference","two evidence lines"]},
  {focus:"Extended output",kind:"writing",task:"plan and produce a coherent response, then revise one content issue and one language issue",materials:["level-appropriate prompt","planning box","revision checklist"],evidence:["output completed","two visible revisions"]},
  {focus:"Mixed retrieval under delay",kind:"vocabulary",task:"retrieve items from Weeks 1–3 in shuffled order and schedule only remaining misses",materials:["shuffled review set","next-review calendar"],evidence:["delayed recall accuracy","misses scheduled"]},
  {focus:"Week 4 readiness review",kind:"assessment",task:"repeat the four-skill evidence grid and choose the final two-day priority",materials:["fresh four-skill mini-check","Assessment mapping page"],evidence:["score by skill","final priority selected"]},
  {focus:"Targeted consolidation",kind:"integration",task:"complete one fresh block in the Day 28 priority and correct it immediately",materials:["fresh priority-skill block","error log"],evidence:["first-attempt accuracy","corrections explained"]},
  {focus:"Final assessment and next-stage decision",kind:"assessment",task:"repeat the baseline measures with fresh material, compare evidence and select the next stage",materials:["fresh 20-word sample","fresh 10-item reading","five sentence prompts"],evidence:["word recall /20","reading accuracy /10","sentences accurate /5","next-stage decision"]},
];

function assessmentRouteText(seed:DaySeed,minutes:PlannerRouteMinutes){
  switch(seed.focus){
    case "Baseline retrieval sample":
      return minutes===20
        ? "20 min · Complete the 20-word recall and 10 reading items; score both and record the lowest result."
        : minutes===30
          ? "30 min · Complete the 20-word recall, 10 reading items and five sentence prompts; score all three baseline measures."
          : "45 min · Complete all three baseline measures, correct each miss, then use the Assessment mapping to choose the first assignment and recheck date.";
    case "Week 1 checkpoint":
      return minutes===20
        ? "20 min · Retrieve the 12 review words and complete the short input; score both and sort misses by vocabulary or input skill."
        : minutes===30
          ? "30 min · Retrieve the 12 review words, complete the short input and answer all three output prompts; record secure items and errors by skill."
          : "45 min · Complete every checkpoint item, correct each miss, compare the evidence with Day 1 and write the Days 8–14 adjustment.";
    case "Week 2 transfer check":
      return minutes===20
        ? "20 min · Use the Assessment mapping to select the weakest direction; complete one fresh item block and record first-attempt accuracy."
        : minutes===30
          ? "30 min · Complete fresh vocabulary, input and output items from the weakest direction; score each task family and name the remaining gap."
          : "45 min · Complete all fresh transfer items, correct each miss, compare the evidence with Day 7 and write the Days 15–21 adjustment.";
    case "Week 3 production check":
      return minutes===20
        ? "20 min · Complete one speaking or writing prompt without a model; score completion, accuracy and clarity, then revise the lowest rubric dimension."
        : minutes===30
          ? "30 min · Complete all three speaking or writing prompts; score each with the three-point rubric and record one priority revision."
          : "45 min · Complete and score all three prompts, revise the weakest response, re-score it and write the final-week production priority.";
    case "Week 4 readiness review":
      return minutes===20
        ? "20 min · Complete one compact item in each of the four skills; record the four scores and select the lowest skill."
        : minutes===30
          ? "30 min · Complete the fresh four-skill mini-check; score each skill and choose the final two-day priority with one evidence reason."
          : "45 min · Complete and correct the full four-skill mini-check, compare each score with the prior checkpoint and write the Day 29–30 priority.";
    case "Final assessment and next-stage decision":
      return minutes===20
        ? "20 min · Complete the fresh 20-word recall and 10 reading items; compare both scores with Day 1 and record the remaining gap."
        : minutes===30
          ? "30 min · Complete the fresh 20-word recall, 10 reading items and five sentence prompts; compare all three measures with Day 1."
          : "45 min · Complete and correct all final measures, compare them with Day 1, then choose Consolidate, Repeat 30 days or Readiness check and write the first two assignments.";
    default:throw new Error(`UNMAPPED_ASSESSMENT_ROUTE_${seed.focus}`);
  }
}

function routeText(seed:DaySeed,minutes:PlannerRouteMinutes){
  if(seed.kind==="assessment")return assessmentRouteText(seed,minutes);
  if(seed.kind==="vocabulary")return minutes===20?`20 min · Use 6 target items to ${seed.task}; finish with a 3-minute closed-book recall.`:minutes===30?`30 min · Use 10 target items to ${seed.task}; mix old and new items, then redo every miss once.`:`45 min · Use 14 target items to ${seed.task}; add six original sentences or a two-minute oral use task, then schedule misses.`;
  if(seed.kind==="listening")return minutes===20?`20 min · Use one 45–75 second input to ${seed.task}; listen no more than twice and correct 3 missed details.`:minutes===30?`30 min · Use two short inputs to ${seed.task}; compare first-listen and replay evidence, then shadow 4 lines.`:`45 min · Use one 2–3 minute input plus a fresh short input to ${seed.task}; produce a six-sentence or two-minute spoken summary and correct it.`;
  if(seed.kind==="reading")return minutes===20?`20 min · Use one 120–180 character text or 6 items to ${seed.task}; correct each miss with a marked clue.`:minutes===30?`30 min · Use two short texts or 10 items to ${seed.task}; add a 3-sentence written summary and an error classification.`:`45 min · Use one extended or paired-text set to ${seed.task}; write an evidence-based response, revise it and repeat 4 missed items.`;
  if(seed.kind==="writing")return minutes===20?`20 min · ${seed.task}; produce 4 complete sentences and revise 1 accuracy issue.`:minutes===30?`30 min · ${seed.task}; produce 8 sentences or one 80–120 character response and revise 2 issues.`:`45 min · ${seed.task}; produce one extended response, complete content and language checks, then rewrite the weakest section.`;
  return minutes===20?`20 min · ${seed.task}; complete one focused block and record 2 evidence points.`:minutes===30?`30 min · ${seed.task}; complete two linked blocks and correct every miss once.`:`45 min · ${seed.task}; complete input, retrieval and output stages, then compare first and corrected performance.`;
}

const mappings:AssessmentMapping[]=(
  [
    ["vocabulary",["meaning retrieval with spaced recall","tone-and-form discrimination"],"Day 2 meaning retrieval"],
    ["listening",["detail capture and sequence","dictation and inference"],"Day 5 listening for key details"],
    ["reading",["cloze and sentence ordering","main idea, matching and inference"],"Day 4 sentence cloze"],
    ["writing",["controlled sentence building","error correction and guided output"],"Day 6 controlled sentence building"],
  ] as const
).flatMap(([skill,directions,firstAssignment])=>[
  {skill,band:"below-50" as const,practiceDirection:[...directions],firstAssignment},
  {skill,band:"50-74" as const,practiceDirection:[directions[1],"timed fresh-item transfer"],firstAssignment:`${firstAssignment}; add the 30-minute extension`},
  {skill,band:"75-plus" as const,practiceDirection:["maintenance retrieval","integrated output with fresh material"],firstAssignment:"Day 19 cross-skill dictation or Day 25 compare-two-texts task"},
]);

export function buildPlannerPack():PlannerPack{
  return {
    positioning:"HSK 30-Day Personalized Study System",
    workflow:["Initial diagnosis","Choose goal","Daily training","Weekly review","Final assessment","Next-stage plan"],
    setupPrompts:["Current Level","Target Level","Exam date or study goal","Daily available time","Initial weak areas","Initial Assessment scores","Choose the 20 / 30 / 45-minute route"],
    days:DAY_SEEDS.map((seed,index)=>({day:index+1,phase:index<7?"Diagnose and build":index<14?"Retrieve and transfer":index<21?"Use and produce":index<28?"Integrate and repair":"Assess and continue",focus:seed.focus,materials:seed.materials,routes:{20:routeText(seed,20),30:routeText(seed,30),45:routeText(seed,45)},evidence:seed.evidence})),
    weeklyReviews:[
      {day:7,prompts:["Quantified evidence: score, accuracy and completed units","Repeated error pattern and count","Keep/change the Assessment direction — cite evidence","Days 8–14 action: daily amount and recheck target/date"]},
      {day:14,prompts:["Week 1 → Week 2 metric change","Repeated transfer error and count","Keep/change the Assessment direction — cite evidence","Days 15–21 action: daily amount and recheck target/date"]},
      {day:21,prompts:["Current score versus target gap in the weakest skill","Repeated error pattern and count","Final-week priority — cite the evidence","Days 22–28 action: daily amount and pass target"]},
      {day:28,prompts:["Day 1 → Day 28 evidence change by skill","Remaining repeated error and count","Final 48-hour priority and reason","Post-Day-30 route and first recheck date"]},
    ],
    assessmentMappings:mappings,
    recoveryWorksheet:{title:"Missed-Day Recovery Worksheet",rule:"Keep the next calendar date. Move only unfinished retrieval or correction work; do not duplicate completed work. Choose a reduced route for at most two days, then return to the selected route.",prompts:["Missed day and reason","Work already completed","Unfinished retrieval/correction work","Work moved forward","Temporary reduced route","Return date and first task"]},
    finalReview:{title:"Final assessment and next-stage plan",prompts:["Baseline-to-final score comparison","Strongest evidence of gain","Remaining weakest skill and task family","Consolidate / repeat 30 days / readiness check","Next start date","First two assignments"]},
  };
}

export function plannerFieldNames(){
  const names=["planner.setup.currentLevel","planner.setup.targetLevel","planner.setup.examDateOrGoal","planner.setup.dailyMinutes","planner.setup.weakAreas","planner.setup.assessment.vocabulary","planner.setup.assessment.listening","planner.setup.assessment.reading","planner.setup.assessment.writing","planner.setup.route"];
  for(let day=1;day<=30;day++)for(const field of ["completed","evidence","difficult","nextReview"])names.push(`planner.day${day}.${field}`);
  for(const day of [7,14,21,28])for(const field of ["progress","missed","adjustment","nextFocus"])names.push(`planner.week${day}.${field}`);
  for(const field of ["missedDay","reason","unfinished","moveForward","reducedRoute","returnDate"])names.push(`planner.recovery.${field}`);
  for(const field of ["comparison","strongestGain","remainingGap","nextDecision","nextStartDate","firstAssignments"])names.push(`planner.final.${field}`);
  return names;
}
