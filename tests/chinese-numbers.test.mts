import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {convert,convertNumber,convertPrice,convertDate,convertTime,integerChinese,chineseToNumber,normalizeAnswer} from '../src/lib/numbers/conversion.ts';
import {NUMBER_QUESTIONS,createNumberRound,checkNumberAnswer,numberQuestion,numberRoundReport,retryNumberMistakes,parseNumberHistory} from '../src/lib/numbers/practice.ts';

test('standard integers preserve place values and reverse without guessing abbreviated forms',()=>{
 const examples:Record<string,string>={'0':'零','10':'十','11':'十一','20':'二十','101':'一百零一','110':'一百一十','1001':'一千零一','1010':'一千零一十','10000':'一万','10001':'一万零一','10010':'一万零一十','100000':'十万','100000001':'一亿零一','100010001':'一亿零一万零一','999999999':'九亿九千九百九十九万九千九百九十九'};
 for(const [n,text] of Object.entries(examples)){assert.equal(integerChinese(Number(n)),text,n);assert.equal(chineseToNumber(text),n,text);}
 for(let n=0;n<=20000;n++)assert.equal(chineseToNumber(integerChinese(n)),String(n));
 let seed=1947;
 for(let i=0;i<500;i++){seed=(seed*48271)%2147483647;const n=seed%1000000000;assert.equal(chineseToNumber(integerChinese(n)),String(n));}
 assert.equal(chineseToNumber('兩萬零貳佰零伍'),'20205');
 for(const bad of ['一百五','十十','一百百','一二三','一亿一亿','猫','贰佰元','点五'])assert.throws(()=>chineseToNumber(bad),bad);
});
test('decimals retain every digit, financial learning equivalents work, and invalid input is never truncated',()=>{
 assert.equal(convertNumber('25.50').hanzi,'二十五点五零');
 assert.equal(convertNumber('-12.05').hanzi,'负十二点零五');
 assert.equal(convertNumber('二十五点五',true).value,'25.5');
 assert.equal(convertNumber('壹佰贰拾捌',true).value,'128');
 assert.equal(convertNumber('１２，３４５.５０').value,'12345.50');
 for(const bad of ['25abc','1,23','1e3','Infinity','12.12345','1000000000','<script>',''])assert.throws(()=>convertNumber(bad),bad);
 assert.ok(convertNumber('5').pinyin.includes('wǔ'));assert.ok(convertNumber('9').pinyin.includes('jiǔ'));
});
test('RMB prices retain fen and validate precision rather than rounding',()=>{
 assert.equal(convertPrice('25.50').hanzi,'二十五块五毛');
 assert.equal(convertPrice('25.5').value,'25.50');
 assert.equal(convertPrice('108.05').hanzi,'一百零八块零五分');
 assert.equal(convertPrice('0.05').hanzi,'五分');
 assert.equal(convertPrice('2').hanzi,'两块');
 assert.equal(convertPrice('200').hanzi,'两百块');
 assert.equal(convertPrice('0').written,'零元整');
 for(const bad of ['25.501','-12','10000000','25.50.5'])assert.throws(()=>convertPrice(bad),bad);
 assert.equal(normalizeAnswer('prices','25.50'),normalizeAnswer('prices','25.5'));
});
test('calendar and clock readings keep context, validate real dates, and accept explicit answer formats',()=>{
 assert.equal(convertDate('2026-11-05').hanzi,'二零二六年十一月五号');
 assert.equal(convertDate('2026-02-02').hanzi,'二零二六年二月二号');
 assert.equal(convertDate('2000-02-29').value,'2000-02-29');
 for(const bad of ['2026-02-29','1900-02-29','2026-04-31','2026-13-01','1899-12-31','11/05'])assert.throws(()=>convertDate(bad),bad);
 assert.equal(convertTime('14:30').hanzi,'下午两点半');
 assert.equal(convertTime('14:30').written,'下午两点三十分');
 assert.equal(convertTime('02:05').hanzi,'凌晨两点零五分');
 assert.equal(convertTime('12:00').hanzi,'中午十二点整');
 assert.equal(convertTime('00:00').hanzi,'凌晨零点整');
 for(const bad of ['24:00','12:60','-1:00','2:5'])assert.throws(()=>convertTime(bad),bad);
 assert.equal(normalizeAnswer('dates','2026/11/5'),'2026-11-05');
 assert.equal(normalizeAnswer('times','2:05'),'02:05');
 assert.notEqual(normalizeAnswer('times','2:30'),normalizeAnswer('times','14:30'));
});
test('every listening question pairs the exact script with a present, hashed MP3',async()=>{
 assert.equal(NUMBER_QUESTIONS.length,160);
 for(const mode of ['numbers','prices','dates','times'])assert.equal(NUMBER_QUESTIONS.filter(q=>q.mode===mode).length,40);
 for(const q of NUMBER_QUESTIONS){
  assert.equal(q.hanzi,convert(q.mode,q.value).hanzi,q.id);
  assert.equal(q.pinyin,convert(q.mode,q.value).pinyin,q.id);
  assert.match(q.audioSrc,/^\/number-audio\/v1\/[a-z]+-\d{2}-[a-f0-9]{12}\.mp3$/);
  const raw=await readFile('public'+q.audioSrc);
  assert.equal(createHash('sha256').update(raw).digest('hex'),q.audioSha256,q.id);
  assert.ok(raw.length>1000&&q.durationSeconds>.3&&q.durationSeconds<25,q.id);
 }
});
test('practice gates unheard answers, counts only once and keeps mistake rounds separate',()=>{
 let round=createNumberRound('numbers',()=>.5);
 assert.equal(round.order.length,10);assert.equal(new Set(round.order).size,10);
 assert.throws(()=>checkNumberAnswer(round,round.order[0],'1',false));
 const first=round.order[0];
 for(let i=0;i<10;i++){
  const q=numberQuestion(round.order[i])!;
  round=checkNumberAnswer(round,q.id,i===0?String(Number(q.value)+1):q.value,true);
  if(i===0)assert.throws(()=>checkNumberAnswer(round,first,q.value,true));
 }
 assert.equal(numberRoundReport(round).correct,9);
 const retry=retryNumberMistakes(round)!;
 assert.equal(retry.retryOf,round.id);assert.deepEqual(retry.order,[first]);
 const finished=checkNumberAnswer(retry,first,numberQuestion(first)!.value,true);
 assert.equal(numberRoundReport(finished).correct,1);assert.equal(numberRoundReport(round).correct,9);
 assert.equal(parseNumberHistory([finished,round]).length,2);
 assert.deepEqual(parseNumberHistory([{...round,answers:['<script>']}]),[]);
 assert.deepEqual(parseNumberHistory([{...round,order:Array(10).fill(first)}]),[]);
 assert.deepEqual(parseNumberHistory([{...round,version:'old'}]),[]);
});
