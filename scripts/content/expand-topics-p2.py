#!/usr/bin/env python3
"""Build frozen P2 topic expansions category by category from reviewed content."""
from __future__ import annotations
import argparse, json
from pathlib import Path
from pypinyin import Style, lazy_pinyin

ROOT=Path(__file__).resolve().parents[2]
TARGET=ROOT/'src/lib/topics/p2-expansions.ts'
CATALOG=ROOT/'src/lib/content/catalog.json'

DATA={
'daily': {
'morning-routine': {
'description':'Move through a complete weekday morning: wake up, get ready, eat breakfast and leave on time.',
'learningGoal':'Describe a natural morning sequence, prepare for the day and explain how you travel to work or school.',
'words':[['早上','起床','闹钟','床','睡觉','先','然后','洗','刷牙','洗澡'],['穿','衣服','裤子','鞋','早餐','早饭','吃','喝','准备','包'],['出门','离开','上班','上课','学校','公司','公共汽车','地铁','到达','迟到']],
'lessons':[
('wake-and-wash','Wake up and wash','起床洗漱','Wake up, say the order of washing actions and get ready without missing a step',
['闹钟响了以后起床','先洗脸，再刷牙','洗完澡以后穿衣服'],
[['A','闹钟响了吗？','Nàozhōng xiǎng le ma?','Did the alarm ring?'],['B','响了，我现在起床。','Xiǎng le, wǒ xiànzài qǐchuáng.','Yes, I am getting up now.'],['A','你先洗澡还是先刷牙？','Nǐ xiān xǐzǎo háishi xiān shuāyá?','Will you shower or brush your teeth first?'],['B','我先刷牙，然后洗澡。','Wǒ xiān shuāyá, ránhòu xǐzǎo.','I brush my teeth first, then shower.']],
('Complete the wash-up routine','Your alarm has rung and you have limited time before breakfast. Explain the order in which you get up, wash and brush your teeth.',['Say when you get up','Use 先 and 然后 to order two actions','Confirm that washing is finished'])),
('dress-and-eat','Dress and eat','穿衣吃早饭','Choose suitable clothes, prepare your bag and finish a simple breakfast',
['穿衣服和鞋','准备上班的包','吃早饭，喝一杯水'],
[['A','今天穿什么衣服？','Jīntiān chuān shénme yīfu?','What clothes will you wear today?'],['B','我穿这条裤子和这双鞋。','Wǒ chuān zhè tiáo kùzi hé zhè shuāng xié.','I will wear these trousers and shoes.'],['A','你的包准备好了吗？','Nǐ de bāo zhǔnbèi hǎo le ma?','Is your bag ready?'],['B','准备好了，吃完早餐就出门。','Zhǔnbèi hǎo le, chī wán zǎocān jiù chūmén.','Yes. I will leave after breakfast.']],
('Get ready for the day','You need to choose clothes, pack what you need and eat before leaving. Tell a housemate what is ready and what remains.',['Name two items of clothing','Say that your bag is ready','State what you eat or drink for breakfast'])),
('leave-on-time','Leave on time','准时出门','Leave home, choose transport and reach work or school without being late',
['八点出门上班','坐地铁去公司','准时到达学校'],
[['A','你几点出门？','Nǐ jǐ diǎn chūmén?','What time do you leave?'],['B','我七点半离开家。','Wǒ qī diǎn bàn líkāi jiā.','I leave home at seven thirty.'],['A','你坐公共汽车还是地铁？','Nǐ zuò gōnggòng qìchē háishi dìtiě?','Do you take the bus or subway?'],['B','我坐地铁去公司，不会迟到。','Wǒ zuò dìtiě qù gōngsī, bú huì chídào.','I take the subway to the office and will not be late.']],
('Plan the commute','You must reach work or school at a fixed time. Explain when you leave, which transport you take and when you arrive.',['Give a departure time','Choose bus or subway','Confirm you will arrive on time']))],
},
'time-and-plans': {
'description':'Turn dates and clock times into clear arrangements, then confirm, change or cancel a plan politely.',
'learningGoal':'Propose a time, confirm an appointment and handle schedule changes in natural Chinese.',
'words':[['今天','明天','昨天','上午','下午','晚上','星期','周末','月','年'],['日期','时间','点','分钟','半','时候','以前','以后','见面','方便'],['计划','安排','约会','开始','结束','准时','按时','提前','推迟','取消']],
'lessons':[
('choose-a-day','Choose a day','选择日期','Use calendar words to identify a suitable day and part of the day',
['今天上午','明天下午','这个周末'],
[['A','你这个星期有时间吗？','Nǐ zhège xīngqī yǒu shíjiān ma?','Do you have time this week?'],['B','今天很忙，明天下午可以。','Jīntiān hěn máng, míngtiān xiàwǔ kěyǐ.','Today is busy; tomorrow afternoon works.'],['A','周末呢？','Zhōumò ne?','How about the weekend?'],['B','周末晚上也可以。','Zhōumò wǎnshang yě kěyǐ.','Weekend evening also works.']],
('Find a shared day','Two people need to meet this week. Compare today, tomorrow and the weekend, then agree on a suitable part of the day.',['Mention at least two days','Use 上午, 下午 or 晚上','Agree on one shared option'])),
('set-a-time','Set the time','确定时间','State an exact time and confirm when and where to meet',
['下午三点半','十分钟以后','见面以前确认'],
[['A','明天什么时候见面方便？','Míngtiān shénme shíhou jiànmiàn fāngbiàn?','When is it convenient to meet tomorrow?'],['B','下午三点半方便。','Xiàwǔ sān diǎn bàn fāngbiàn.','Three thirty in the afternoon is convenient.'],['A','那我们三点半在门口见。','Nà wǒmen sān diǎn bàn zài ménkǒu jiàn.','Then let us meet at the entrance at three thirty.'],['B','好，我到以前给你消息。','Hǎo, wǒ dào yǐqián gěi nǐ xiāoxi.','Okay, I will message before I arrive.']],
('Confirm an appointment','You have selected a day but still need an exact meeting time. Agree on the hour and say what happens before arrival.',['Give an exact clock time','Use 以前 or 以后','Repeat the final arrangement'])),
('change-the-plan','Change the plan','调整安排','Explain a delay, propose a new time and confirm or cancel the appointment',
['提前开始','按时结束','推迟或取消约会'],
[['A','下午的安排要改变吗？','Xiàwǔ de ānpái yào gǎibiàn ma?','Does the afternoon arrangement need to change?'],['B','会议要推迟半个小时。','Huìyì yào tuīchí bàn ge xiǎoshí.','The meeting will be delayed half an hour.'],['A','那五点开始，可以准时结束吗？','Nà wǔ diǎn kāishǐ, kěyǐ zhǔnshí jiéshù ma?','If it starts at five, can it end on time?'],['B','可以，不用取消约会。','Kěyǐ, bú yòng qǔxiāo yuēhuì.','Yes, there is no need to cancel the appointment.']],
('Repair a changed schedule','A meeting is delayed and may affect a later appointment. State the change, propose a workable time and confirm the outcome.',['Explain whether it is early or delayed','Propose a new start time','Confirm or cancel the later plan']))],
},
'weather-and-seasons': {
'description':'Read everyday conditions, compare seasons and use a forecast to choose suitable clothing and travel plans.',
'learningGoal':'Describe current weather, interpret a short forecast and make a practical decision for the day.',
'words':[['天气','晴','阴','云','多云','下雨','雨','下雪','雪','风'],['冷','热','暖和','凉快','温度','度','春天','夏天','秋天','冬天'],['季节','预报','太阳','湿','气候','台风','伞','外套','空气','雾']],
'lessons':[
('read-the-sky','Read the sky','观察天气','Recognise clear, cloudy, rainy, snowy and windy conditions outside',
['天气晴朗','阴天多云','下雨刮风'],
[['A','今天天气怎么样？','Jīntiān tiānqì zěnmeyàng?','How is the weather today?'],['B','上午多云，外面有风。','Shàngwǔ duōyún, wàimiàn yǒu fēng.','It is cloudy and windy this morning.'],['A','下午会下雨吗？','Xiàwǔ huì xiàyǔ ma?','Will it rain this afternoon?'],['B','会下雨，晚上可能下雪。','Huì xiàyǔ, wǎnshang kěnéng xiàxuě.','It will rain and may snow tonight.']],
('Report current conditions','A friend cannot see outside and asks about the weather. Describe the sky, wind and any rain or snow clearly.',['Say whether it is clear or cloudy','Mention wind','State whether rain or snow is happening'])),
('compare-seasons','Compare seasons','比较季节','Compare temperature and comfort across the four seasons',
['春天很暖和','夏天温度高','秋天凉快，冬天冷'],
[['A','你喜欢哪个季节？','Nǐ xǐhuan nǎge jìjié?','Which season do you like?'],['B','我喜欢秋天，天气很凉快。','Wǒ xǐhuan qiūtiān, tiānqì hěn liángkuai.','I like autumn because it is pleasantly cool.'],['A','这里冬天多少度？','Zhèlǐ dōngtiān duōshao dù?','What is the temperature here in winter?'],['B','常常很冷，但是春天很暖和。','Chángcháng hěn lěng, dànshì chūntiān hěn nuǎnhuo.','It is often cold, but spring is warm.']],
('Choose a suitable season','You are choosing when to visit. Compare the temperature and comfort of at least two seasons before making a choice.',['Name two seasons','Compare hot, cold, warm or cool','Choose one season and explain why'])),
('act-on-forecast','Act on the forecast','根据预报准备','Use a forecast to choose clothing, an umbrella and a safe plan',
['查看天气预报','带伞和外套','雾天空气湿'],
[['A','天气预报说明天有台风。','Tiānqì yùbào shuō míngtiān yǒu táifēng.','The forecast says there will be a typhoon tomorrow.'],['B','那我带伞和外套。','Nà wǒ dài sǎn hé wàitào.','Then I will take an umbrella and coat.'],['A','早上还有雾，空气很湿。','Zǎoshang hái yǒu wù, kōngqì hěn shī.','There will also be fog and damp air in the morning.'],['B','好，我们先不去海边。','Hǎo, wǒmen xiān bú qù hǎibiān.','Okay, we will not go to the seaside yet.']],
('Prepare for severe weather','A forecast warns of fog, heavy rain or a typhoon. Decide what to carry and whether the original outdoor plan is safe.',['Refer to the forecast','Choose suitable clothing or an umbrella','Change the plan if conditions are unsafe']))],
},
},
}
TRAVEL_DATA=ROOT/'scripts/content/topics-p2-travel.json'
if TRAVEL_DATA.exists(): DATA['travel']=json.loads(TRAVEL_DATA.read_text())

EXPRESSION_MEANINGS={
'闹钟响了以后起床':'Get up after the alarm rings.','先洗脸，再刷牙':'Wash your face first, then brush your teeth.','洗完澡以后穿衣服':'Get dressed after taking a shower.',
'穿衣服和鞋':'Put on clothes and shoes.','准备上班的包':'Prepare the bag for work.','吃早饭，喝一杯水':'Eat breakfast and drink a glass of water.',
'八点出门上班':'Leave for work at eight.','坐地铁去公司':'Take the subway to the office.','准时到达学校':'Arrive at school on time.',
'今天上午':'This morning.','明天下午':'Tomorrow afternoon.','这个周末':'This weekend.',
'下午三点半':'Three thirty in the afternoon.','十分钟以后':'Ten minutes later.','见面以前确认':'Confirm before meeting.',
'提前开始':'Start early.','按时结束':'Finish on time.','推迟或取消约会':'Postpone or cancel the appointment.',
'天气晴朗':'The weather is clear.','阴天多云':'Overcast and cloudy.','下雨刮风':'Rainy and windy.',
'春天很暖和':'Spring is warm.','夏天温度高':'Temperatures are high in summer.','秋天凉快，冬天冷':'Autumn is cool and winter is cold.',
'查看天气预报':'Check the weather forecast.','带伞和外套':'Bring an umbrella and a coat.','雾天空气湿':'The air is damp on a foggy day.',
}
def expr(item):
    if isinstance(item,list): hanzi,meaning=item
    else: hanzi,meaning=item,EXPRESSION_MEANINGS[item]
    return {'hanzi':hanzi,'pinyin':' '.join(lazy_pinyin(hanzi,style=Style.TONE)),'meaning':meaning}
def build_topic(raw, by_hanzi):
    ids=[[by_hanzi[h]['id'] for h in group] for group in raw['words']]
    lessons=[]
    for (meta, group) in zip(raw['lessons'],ids):
        lid,title,titlezh,outcome,expressions,dialogue,task=meta
        lessons.append({'id':lid,'title':title,'titleZh':titlezh,'outcome':outcome+'.','wordAssetIds':group,
          'expressions':[expr(x) for x in expressions],
          'dialogue':[{'speaker':s,'hanzi':h,'pinyin':p,'meaning':m} for s,h,p,m in dialogue],
          'task':{'title':task[0],'scenario':task[1],'successCriteria':task[2]}})
    flat=sum(ids,[])
    return {'description':raw['description'],'learningGoal':raw['learningGoal'],'wordAssetIds':flat,'featuredWordAssetIds':[ids[0][1],ids[1][1],ids[2][1]],'estimatedMinutes':45,'lessons':lessons,'contentVersion':'2026.09-topics-p2'}

def load_existing():
    text=TARGET.read_text()
    start=text.index('{', text.index('p2TopicExpansions'))
    marker='} satisfies Record<string, TopicP2Expansion>'
    end=(text.rindex(marker)+1) if marker in text else (text.rindex('};')+1)
    return json.loads(text[start:end])

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--category',required=True,choices=DATA)
    args=ap.parse_args()
    repo=json.loads(CATALOG.read_text())
    words={a['payload']['hanzi']:a for a in repo['contentAssets'] if isinstance(a.get('payload'),dict) and a['payload'].get('hanzi')}
    current=load_existing()
    for slug,raw in DATA[args.category].items(): current[slug]=build_topic(raw,words)
    TARGET.write_text('import type { LearningTopic } from "./catalog";\n\ntype TopicP2Expansion = Pick<LearningTopic, "description" | "learningGoal" | "wordAssetIds" | "featuredWordAssetIds" | "estimatedMinutes" | "lessons" | "contentVersion">;\n\nexport const p2TopicExpansions: Record<string, TopicP2Expansion> = '+json.dumps(current,ensure_ascii=False,indent=2)+';\n')
    print({'category':args.category,'topics':list(DATA[args.category]),'total':len(current)})
if __name__=='__main__': main()
