// Inspectable whole-name checks, not exhaustive homophone review.
const excludedFullNames=new Set(['吴勇','杜子腾','史珍香','杨伟','范统','朱逸群']);
export function allowedNameCombination(surname:string,given:string){return surname.slice(-1)!==[...given][0]&&!excludedFullNames.has(surname+given);}
