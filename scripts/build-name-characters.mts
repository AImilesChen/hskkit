import {writeFile} from 'node:fs/promises';
import {givenNames} from '../src/lib/names/editorial.ts';
import {expandedNames} from '../src/lib/names/expanded-editorial.ts';
import {collectionNames} from '../src/lib/names/collection-editorial.ts';
import {surnameCollection} from '../src/lib/names/surnames.ts';
import {meaningNames} from '../src/lib/names/meaning-editorial.ts';
const characters=[...new Set([...givenNames,...expandedNames,...collectionNames,...meaningNames].flatMap(item=>[...item.given]).concat(surnameCollection.flatMap(item=>[...item.hanzi])))].sort();
await writeFile(new URL('../src/lib/names/required-characters.json',import.meta.url),JSON.stringify(characters,null,2)+'\n');
console.log(`Recorded ${characters.length} required name characters.`);
