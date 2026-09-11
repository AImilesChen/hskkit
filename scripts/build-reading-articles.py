from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'src/lib/learning/reading-articles.json'

TOPICS=[
('早饭店的新客人','小林','早饭店','每天早上去买豆浆和包子','店主记住了他不吃辣','陌生人也能在日常问候中熟悉起来','daily life','regular greetings can turn strangers into familiar faces'),
('错过的那班公交车','安娜','公交车站','出门晚了，没赶上八点的车','她改坐地铁并提前到了公司','遇到变化时，先找办法比抱怨更有用','transport','a calm response to change is more useful than complaining'),
('图书馆里的纸条','王明','学校图书馆','在借来的书里发现一张提醒按时休息的纸条','他把纸条夹回书里，也开始每小时起身活动','一条善意的提醒可以继续帮助下一位读者','study','a kind reminder can continue helping later readers'),
('雨天共享的一把伞','美玲','小区门口','下雨时把伞分给没带伞的邻居','两个人一起走到地铁站并交换了名字','小小的帮助能打开邻里交往的大门','community','a small act of help can open the door to neighborly connection'),
('菜市场的最后一篮草莓','陈阿姨','菜市场','发现最后一篮草莓有几颗碰坏了','摊主主动减价，她回家做成了果酱','了解食物的状态后仍能作出合适的选择','food','understanding food condition helps people make sensible choices'),
('第一次自己看医生','李华','社区医院','因为咳嗽独自去看医生','他按指示挂号、说明症状并按时吃药','清楚描述问题能让求助更有效','health','describing a problem clearly makes it easier to receive help'),
('周末的旧物交换会','小周','社区广场','把不用的台灯带到旧物交换会','他换回一套需要的工具，还认识了邻居','让闲置物品继续使用可以减少浪费','environment','keeping unused objects in circulation can reduce waste'),
('阳台上的第一盆花','露西','家里的阳台','第一次种花时浇了太多水','她查资料后换土并调整浇水时间','照顾生命需要观察，而不是只靠热情','nature','caring for living things requires observation rather than enthusiasm alone'),
('没有手机的一小时','张宁','城市公园','散步时把手机调成飞行模式','他注意到鸟声、树影和久违的安静','暂时离开屏幕能帮助人重新感受周围','wellbeing','stepping away from screens can restore awareness of one’s surroundings'),
('给爷爷的视频电话','小雨','家里','教爷爷使用视频电话','爷爷后来可以自己给外地家人打电话','耐心的数字帮助能让技术真正连接家人','technology','patient digital support allows technology to connect family members'),
('比赛前换下主力','赵教练','学校体育馆','篮球赛前发现主力队员脚痛','他让队员休息并重新安排战术','保护人的长期健康比一场比赛的输赢重要','sport','long-term health matters more than the result of one game'),
('迟到的生日礼物','苏菲','快递站','朋友的生日礼物因大雪晚到','她先打电话说明并寄出手写祝福','真诚沟通比追求形式上的准时更重要','relationships','sincere communication matters more than formal punctuality'),
('书店里捡到的钱包','刘叔','街角书店','在椅子下面看到一个钱包','他把钱包交给店员，失主很快回来取走','捡到别人的东西要想办法归还','honesty','found property should be returned to its owner'),
('改到下周的野餐','林佳','家里','看到周末会下大雨','她和朋友把野餐改到下周','计划可以改变，大家平安更重要','weather','plans can change when safety matters'),
('办公室里的轻声提醒','郭经理','公司办公室','听见有人开会时说话太大声','他请大家去会议室讨论','照顾别人需要从小事做起','work','consideration for others begins with small choices'),
('河边的清洁活动','研究小组','城市河岸','周末一起捡河边的垃圾','路过的居民也加入了他们','大家一起做，环境会慢慢变好','environment','shared action can gradually improve the environment'),
('买错的电影票','小文','电影院','把周六的电影票买成了周日','工作人员帮他换到了正确场次','发现错误后及时说明，问题更容易解决','leisure','explaining a mistake early makes it easier to solve'),
('忘在家里的钥匙','何平','小区门口','回家时发现没有带钥匙','他给姐姐打电话并在门口等了一会儿','着急时先联系能帮助自己的人','family','when worried, contact someone who can help'),
('周末先做哪件事','小乐','家里','想出去玩但房间还没有打扫','他先整理房间，再和朋友见面','安排好先后，休息时会更轻松','planning','putting tasks in order makes rest more relaxing'),
('拍照前先问一声','小云','公园','想给正在画画的朋友拍照','她先问朋友是否愿意，得到同意后才拍','尊重别人要从询问和同意开始','respect','respect begins by asking and receiving consent'),
]

VOCAB=[
 [('熟悉','shúxī','to become familiar'),('问候','wènhòu','to greet'),('日常','rìcháng','everyday')],
 [('变化','biànhuà','change'),('抱怨','bàoyuàn','to complain'),('提前','tíqián','ahead of time')],
 [('提醒','tíxǐng','reminder'),('按时','ànshí','on time'),('读者','dúzhě','reader')],
 [('邻居','línjū','neighbor'),('邻里','línlǐ','neighborhood relations'),('交往','jiāowǎng','to interact')],
 [('主动','zhǔdòng','to take the initiative'),('状态','zhuàngtài','condition'),('选择','xuǎnzé','choice')],
 [('症状','zhèngzhuàng','symptom'),('指示','zhǐshì','instruction'),('有效','yǒuxiào','effective')],
 [('闲置','xiánzhì','unused'),('交换','jiāohuàn','to exchange'),('减少','jiǎnshǎo','to reduce')],
 [('调整','tiáozhěng','to adjust'),('观察','guānchá','to observe'),('热情','rèqíng','enthusiasm')],
 [('飞行模式','fēixíng móshì','airplane mode'),('屏幕','píngmù','screen'),('周围','zhōuwéi','surroundings')],
 [('耐心','nàixīn','patience'),('连接','liánjiē','to connect'),('技术','jìshù','technology')],
 [('主力','zhǔlì','key player'),('战术','zhànshù','tactics'),('长期','chángqī','long-term')],
 [('大雪','dàxuě','heavy snow'),('说明','shuōmíng','to explain'),('真诚','zhēnchéng','sincere')],
 [('钱包','qiánbāo','wallet'),('失主','shīzhǔ','owner of lost property'),('归还','guīhuán','to return')],
 [('野餐','yěcān','picnic'),('改到','gǎidào','to move to another time'),('平安','píng’ān','safe and well')],
 [('会议室','huìyìshì','meeting room'),('讨论','tǎolùn','to discuss'),('照顾','zhàogù','to consider or care for')],
 [('居民','jūmín','resident'),('垃圾','lājī','rubbish'),('环境','huánjìng','environment')],
 [('场次','chǎngcì','showing time'),('及时','jíshí','in time'),('解决','jiějué','to solve')],
 [('钥匙','yàoshi','key'),('联系','liánxì','to contact'),('着急','zháojí','worried')],
 [('整理','zhěnglǐ','to tidy'),('先后','xiānhòu','order'),('轻松','qīngsōng','relaxed')],
 [('愿意','yuànyì','to be willing'),('同意','tóngyì','to agree'),('尊重','zūnzhòng','to respect')],
]

EN_CORE=[
 ('Xiaolin visited the breakfast shop every morning for soy milk and steamed buns.','The owner remembered that he did not eat spicy food, and Xiaolin noticed this quiet kindness.','He learned that regular greetings can turn strangers into familiar faces.'),
 ('Anna arrived late at the bus stop and missed the eight o’clock bus.','She took the subway instead and still reached her office early.','She learned that looking for an alternative is more useful than complaining about a change.'),
 ('Wang Ming found a note in a library book reminding readers to rest on time.','He put the note back in the book and began standing up once every hour.','A kind reminder can continue helping the next reader.'),
 ('Meiling shared her umbrella with a neighbor who had been caught in the rain.','They walked to the subway station together and learned each other’s names.','A small act of help can open the door to a neighborly relationship.'),
 ('Aunt Chen noticed that several strawberries in the last basket at the market were bruised.','The seller offered a lower price, and she made the fruit into jam at home.','Knowing the actual condition of food makes a sensible choice possible.'),
 ('Li Hua went to the community hospital alone because he had a cough.','He registered, described his symptoms and took the medicine on schedule.','Describing a problem clearly makes it easier to receive effective help.'),
 ('Xiao Zhou brought an unused desk lamp to a weekend swap in the community square.','He exchanged it for tools he needed and also met a neighbor.','Keeping unused objects in circulation can reduce waste.'),
 ('Lucy gave her first balcony plant too much water.','After reading reliable guidance, she changed the soil and adjusted her watering schedule.','Caring for living things requires observation rather than enthusiasm alone.'),
 ('Zhang Ning put his phone in airplane mode while walking through the city park.','He noticed birdsong, moving shadows and a kind of quiet he had not felt for a long time.','Stepping away from a screen can restore awareness of one’s surroundings.'),
 ('Xiaoyu patiently taught her grandfather how to make video calls.','He later learned to call relatives who lived far away by himself.','Patient digital support allows technology to connect family members.'),
 ('Before a school basketball game, Coach Zhao found that a key player had foot pain.','He asked the player to rest and rearranged the team’s tactics.','Protecting long-term health matters more than the result of one game.'),
 ('Sophie’s birthday gift for a friend was delayed by heavy snow.','She called to explain and sent a handwritten message first.','Sincere communication matters more than formal punctuality.'),
 ('Uncle Liu found a wallet under a chair in the corner bookshop.','He gave it to a shop assistant, and the owner soon returned to collect it.','Lost property should be returned to its owner.'),
 ('Lin Jia saw that heavy rain was forecast for the weekend.','She and her friends moved their picnic to the following week.','Plans can change when everyone’s safety matters.'),
 ('Manager Guo heard someone speaking too loudly during a meeting.','He invited the group to continue their discussion in a meeting room.','Consideration for others begins with small choices.'),
 ('A group spent the weekend picking up rubbish along the river.','Residents passing by saw them and joined the cleanup.','Shared action can gradually improve the environment.'),
 ('Xiaowen accidentally bought a Sunday cinema ticket instead of a Saturday ticket.','A staff member helped him change it to the correct showing.','Explaining a mistake early makes it easier to solve.'),
 ('He Ping reached the entrance of his building and discovered that he had left his key at home.','He called his sister and waited at the entrance for a while.','When worried, first contact someone who can help.'),
 ('Xiaole wanted to go out, but his room had not been tidied.','He cleaned the room first and then met his friends.','Putting tasks in order makes rest more relaxing.'),
 ('Xiaoyun wanted to photograph a friend who was painting in the park.','She asked first and took the picture only after her friend agreed.','Respect begins by asking and receiving consent.'),
]

DIFFICULTY=['starter','starter','developing','developing','intermediate','advanced','advanced','advanced','advanced']
SIMPLE_LESSONS=[
 '天天说你好，人会越来越熟','没有坐上公交车，还可以坐地铁','看书久了，要站起来休息','下雨时，可以和别人一起用伞','草莓坏了一点，也可以做成果酱','生病时，要把哪里不舒服说清楚','不用的东西可以换给别人','花不能天天喝很多水','不看手机时，也能看到很多东西','学会打视频电话，就能常和家人说话','脚疼时，要先休息','礼物晚了，可以先告诉朋友','捡到钱包，要交给工作人员','下雨不能野餐，可以换一天','别人工作时，不要大声说话','大家一起捡垃圾，河边会更干净','票买错了，可以请工作人员帮忙','忘带钥匙时，可以给家人打电话','周末先打扫，再出去玩','给朋友拍照前，要先问他'
]
SIMPLE_LESSONS_EN=[
 'Daily greetings help people become familiar','If you miss the bus, you can take the subway','Stand up and rest after reading for a long time','When it rains, people can share an umbrella','Bruised strawberries can still become jam','When you are ill, explain where you feel unwell','Things you do not use can be exchanged','A plant should not receive too much water every day','Without looking at a phone, you can notice many things','Learning video calls helps families talk often','When your foot hurts, rest first','If a gift is late, tell your friend first','Give a lost wallet to a staff member','A rainy-day picnic can move to another day','Do not speak loudly while other people work','Cleaning together makes the riverside better','If a ticket is wrong, ask a staff member for help','If you forget your key, call a family member','Clean the room before going out to play','Ask before taking a friend’s photo'
]
SIMPLE_VOCAB=[
 [('豆浆','dòujiāng','soy milk'),('包子','bāozi','steamed bun'),('辣','là','spicy')],
 [('公交车','gōngjiāochē','bus'),('地铁','dìtiě','subway'),('提前','tíqián','early')],
 [('图书馆','túshūguǎn','library'),('纸条','zhǐtiáo','note'),('休息','xiūxi','to rest')],
 [('下雨','xiàyǔ','to rain'),('邻居','línjū','neighbor'),('地铁站','dìtiězhàn','subway station')],
 [('草莓','cǎoméi','strawberry'),('减价','jiǎnjià','to reduce the price'),('果酱','guǒjiàng','jam')],
 [('咳嗽','késou','to cough'),('挂号','guàhào','to register'),('吃药','chīyào','to take medicine')],
 [('台灯','táidēng','desk lamp'),('交换','jiāohuàn','to exchange'),('邻居','línjū','neighbor')],
 [('阳台','yángtái','balcony'),('浇水','jiāoshuǐ','to water'),('换土','huàntǔ','to change soil')],
 [('手机','shǒujī','mobile phone'),('鸟声','niǎoshēng','birdsong'),('安静','ānjìng','quiet')],
 [('爷爷','yéye','grandfather'),('视频电话','shìpín diànhuà','video call'),('家人','jiārén','family')],
 [('篮球赛','lánqiúsài','basketball game'),('脚痛','jiǎotòng','foot pain'),('休息','xiūxi','to rest')],
 [('礼物','lǐwù','gift'),('大雪','dàxuě','heavy snow'),('祝福','zhùfú','good wishes')],
 [('钱包','qiánbāo','wallet'),('店员','diànyuán','shop assistant'),('失主','shīzhǔ','owner')],
 [('周末','zhōumò','weekend'),('大雨','dàyǔ','heavy rain'),('野餐','yěcān','picnic')],
 [('办公室','bàngōngshì','office'),('会议室','huìyìshì','meeting room'),('讨论','tǎolùn','to discuss')],
 [('河边','hébiān','riverside'),('垃圾','lājī','rubbish'),('居民','jūmín','resident')],
 [('电影票','diànyǐngpiào','cinema ticket'),('工作人员','gōngzuò rényuán','staff member'),('场次','chǎngcì','showing')],
 [('钥匙','yàoshi','key'),('姐姐','jiějie','older sister'),('门口','ménkǒu','entrance')],
 [('打扫','dǎsǎo','to clean'),('整理','zhěnglǐ','to tidy'),('见面','jiànmiàn','to meet')],
 [('画画','huàhuà','to paint'),('拍照','pāizhào','to take a photo'),('同意','tóngyì','to agree')],
]
STORY_DETAILS=[
 [('店主先问他能不能吃辣，又推荐了当天刚做好的豆浆。小林按自己的口味点餐，很快记住了这里的招牌。','The owner first asked whether he ate spicy food and recommended the soy milk made that morning. Xiaolin ordered to his taste and soon remembered the shop’s specialty.'),('几天后，小林带同事再来。店主仍记得他的选择，也根据同事的回答换了一种搭配。','A few days later, Xiaolin returned with a colleague. The owner remembered his choice and suggested a different combination after hearing the colleague’s preference.')],
 [('发现公交车已经开走后，安娜先查看地铁线路，又比较了步行到两个车站所需的时间。','After seeing that the bus had left, Anna checked the subway map and compared the walking time to two nearby stations.'),('这次经历让她重新安排早晨的出门时间，并在常走的路线旁记下一个备用方案。','The experience led her to adjust her morning schedule and note an alternative route beside the one she normally used.')],
 [('王明猜想纸条来自上一位借书人，于是按照提醒站起来活动了几分钟。','Wang Ming guessed that the note came from the previous borrower, so he followed it and stood up for a few minutes.'),('还书前，他没有在书上写字，而是另外放入一张干净卡片，把同样的提醒留给下一位读者。','Before returning the book, he did not write on it. He placed a clean card inside and left the same reminder for the next reader.')],
 [('一路上，美玲和邻居聊起各自搬来小区的时间，原本陌生的两个人渐渐放松下来。','On the way, Meiling and her neighbor talked about when they had moved into the area, and the two strangers gradually relaxed.'),('到地铁站后，邻居提出下次也愿意帮助别人。一次临时共伞，变成了邻里之间新的联系。','At the subway station, the neighbor said she would also help someone next time. A temporary shared umbrella became a new neighborhood connection.')],
 [('陈阿姨先挑出完好的草莓，把碰伤的部分单独清洗，没有因为外表不好就整篮丢掉。','Aunt Chen separated the good strawberries and washed the bruised ones instead of throwing away the whole basket because of its appearance.'),('摊主说明了减价原因，她也根据水果的实际状态改变用途。最后做出的果酱既安全，也减少了浪费。','The seller explained the discount, and she changed her plan according to the fruit’s actual condition. The jam was safe and reduced waste.')],
 [('出门前，李华把咳嗽开始的时间和身体感受写在手机里，见到医生后逐项说明。','Before leaving, Li Hua noted when the cough began and how he felt, then described each point to the doctor.'),('医生根据这些信息给出用药和休息建议。李华发现，准确表达症状能减少猜测，也能让沟通更有效。','The doctor used that information to advise medicine and rest. Li Hua found that accurate symptom descriptions reduce guesswork and improve communication.')],
 [('交换开始前，组织者请大家标明物品的新旧程度和缺少的零件，避免只看照片作决定。','Before the exchange, organizers asked everyone to label each item’s condition and missing parts so decisions would not rely on photos alone.'),('张叔的台灯找到了需要它的新主人，他也换回几本想读的书。透明说明让交换对双方都更公平。','Uncle Zhang’s lamp found a new owner, and he received several books he wanted. Clear descriptions made the exchange fairer for both sides.')],
 [('露西发现叶子发黄后，没有继续加水，而是查看土壤湿度和光照情况。','When Lucy saw the leaves turning yellow, she stopped adding water and checked the soil moisture and light.'),('她把每天浇水改为按土壤状态决定，并记录叶子的变化。几周后，新叶慢慢长了出来。','She replaced daily watering with a schedule based on soil conditions and recorded the changes. New leaves gradually appeared a few weeks later.')],
 [('最初的十分钟里，小周总想拿起手机。后来，他开始注意窗外的声音，也完整地吃完了午饭。','During the first ten minutes, Zhou kept wanting to pick up his phone. Later he noticed sounds outside and finished lunch without interruption.'),('一小时结束后，他没有否定手机的作用，只是决定每天留出一段不被屏幕打断的时间。','When the hour ended, he did not reject phones. He simply decided to reserve some screen-free time each day.')],
 [('小雨把接听、挂断和调节音量分成三步写在纸上，让爷爷每一步都自己操作。','Xiaoyu wrote down three steps—answering, ending and adjusting volume—and let her grandfather perform each one.'),('几次练习后，爷爷能独立拨号，还主动给远方的家人打了电话。技术因此成为联系，而不是新的负担。','After several practices, her grandfather could make a call alone and contacted distant family members. The technology became a connection rather than a burden.')],
 [('队员先说明脚踝疼痛的位置和程度，教练据此调整首发名单，而不是要求他继续坚持。','The player described the location and degree of ankle pain, and the coach adjusted the starting lineup instead of asking him to continue.'),('替补队员提前熟悉了战术，受伤队员也得到恢复时间。球队把一场比赛放回整个赛季中衡量。','The substitute reviewed the tactics, while the injured player had time to recover. The team judged one match in the context of the whole season.')],
 [('苏菲先打电话说明大雪造成的延误，没有假装礼物会准时到达。','Sophie called first to explain the delay caused by heavy snow instead of pretending the gift would arrive on time.'),('朋友收到手写祝福后表示理解。等包裹真正到达时，迟到没有破坏庆祝，坦诚反而保住了信任。','Her friend understood after receiving the handwritten message. When the parcel arrived, the delay had not spoiled the celebration; honesty had preserved trust.')],
 [('刘叔没有翻看钱包里的私人内容，而是直接交给店员，并说明发现它的位置和时间。','Uncle Liu did not inspect the wallet’s private contents. He gave it to the clerk and reported where and when he had found it.'),('失主回来后说出钱包特征，店员核对无误才归还。完整的交接过程同时保护了失主和拾到者。','When the owner returned, the clerk verified the wallet’s features before returning it. The documented handover protected both owner and finder.')],
 [('林佳查看的不只是“有雨”两个字，还注意到降雨时间、风力和出行提醒。','Lin Jia looked beyond the word “rain” and checked the forecast time, wind and travel advisory.'),('朋友们比较室内备选和改期成本后，一起选择下周。调整计划没有取消相聚，只是把安全放在前面。','After comparing an indoor alternative with the cost of rescheduling, the friends chose the following week. The change preserved the gathering while putting safety first.')],
 [('郭经理先确认声音来自临时讨论，而不是当众指责某一位同事。','Manager Guo first confirmed that the noise came from an impromptu discussion instead of blaming one colleague publicly.'),('他请讨论者转到会议室，并解释开放办公区需要安静的原因。明确空间规则比含糊抱怨更容易执行。','He asked the group to move to a meeting room and explained why the open office needed quiet. A clear space rule was easier to follow than vague complaints.')],
 [('小组先把塑料、玻璃和其他垃圾分开记录，发现河岸不同位置的问题并不相同。','The group recorded plastic, glass and other waste separately and found that different sections of the riverbank had different problems.'),('居民加入后，大家约定下月再次清理，并把记录交给社区。一次活动由此形成了可以继续的行动。','After residents joined, they agreed to return the next month and shared the records with the community. A one-time event became continuing action.')],
 [('小文发现日期错误后，先保存订单信息，再到服务台说明自己原本想买的场次。','After noticing the wrong date, Xiaowen kept the order information and explained the intended showing at the service desk.'),('工作人员核对余票和换票规则后完成更换。及时提供准确资料，让一个小错误没有继续扩大。','The clerk checked seat availability and the exchange policy before changing the ticket. Timely and accurate information kept a small mistake from growing.')],
 [('何平先确认家人在哪里，再选择在光线明亮、有人经过的门口等待。','He Ping first confirmed where his family was, then waited at a well-lit entrance where other people passed by.'),('进门后，他和姐姐商量备用钥匙的存放方式。解决眼前问题以后，他们也减少了再次被锁在门外的可能。','After entering, he and his sister discussed where to keep a spare key. They solved the immediate problem and reduced the chance of being locked out again.')],
 [('小赵把打扫、买东西和见朋友分别写下，估算每件事需要的时间。','Zhao listed cleaning, shopping and meeting a friend separately and estimated the time needed for each task.'),('他先完成必须在家做的事，再按路线买东西，最后轻松赴约。排序没有增加时间，却减少了来回奔波。','He finished the home task first, shopped along one route, and then met his friend without rushing. Ordering the tasks saved unnecessary travel.')],
 [('玛丽举起手机前先说明照片可能发到哪里，让朋友能够根据用途作决定。','Before raising her phone, Mary explained where the photo might be posted so her friend could decide with that use in mind.'),('朋友不想入镜，她便改拍画作。尊重拒绝没有妨碍记录活动，反而让双方都感到自在。','Her friend did not want to appear, so Mary photographed the painting instead. Respecting the refusal preserved the record and made both people comfortable.')],
]
articles=[]
for level in range(1,10):
  for idx,(title,person,place,action,result,lesson,tag,lesson_en) in enumerate(TOPICS,1):
    simple_lesson=SIMPLE_LESSONS[idx-1]
    simple_lesson_en=SIMPLE_LESSONS_EN[idx-1]
    en1,en2,en3=EN_CORE[idx-1]
    if level == 1:
      zh=[
        f'{person}在{place}。{person}{action}。',
        f'{result}。',
        f'{person}知道了：{simple_lesson}。',
        f'第二天，{person}又来到{place}。这一次，{person}知道应该怎么做了。',
      ]
      en=[en1,en2,f'{simple_lesson_en}.','The next day, the person returned with a clearer idea of what to do.']
    elif level == 2:
      zh=[
        f'{person}在{place}遇到一件事：{action}。',
        f'{result}。事情和原来想的不一样，{person}没有着急，而是先想了想。',
        f'{person}把事情从头到尾看了一遍，也想好了下一步怎么做。',
        f'{person}觉得，{simple_lesson}。',
      ]
      en=[en1,en2,'The person reviewed what had happened and decided what to do next.',f'{simple_lesson_en}.']
    else:
      zh=[f'{person}在{place}遇到了一件事：{action}。']
      en=[en1]
      detail_count=1 if level == 3 else 2
      details=STORY_DETAILS[idx-1][:detail_count]
      if details:
        zh.append(details[0][0])
        en.append(details[0][1])
      zh.append(f'后来，{result}。')
      en.append(en2)
      if len(details) > 1:
        zh.append(details[1][0])
        en.append(details[1][1])
      zh.append(f'这件事让{person}明白：{lesson}。')
      en.append(en3)
      level_closings={
        3:(f'这让{person}学会先说明事实，再说自己的想法。','The person learned to state the facts before giving an opinion.'),
        4:(f'{person}也开始比较不同做法的好处和限制，不再只看最方便的一种。','The person also began comparing the strengths and limits of different responses instead of choosing only the most convenient one.'),
        5:(f'对{person}而言，真正有用的经验必须能够解释原因，也经得起下一次实践的检验。','For the person, useful experience must explain why something worked and remain open to testing in future practice.'),
        6:(f'{person}进一步意识到，个人感受可以提出线索，却不能代替对事实、条件和后果的完整分析。','The person further realized that personal feelings may offer clues but cannot replace a full analysis of facts, conditions and consequences.'),
        7:(f'由此，{person}把一次日常事件看成了持续学习的过程：提出判断、观察结果，再根据证据修正判断。','The everyday event thus became a cycle of learning: form a judgment, observe the result, and revise the judgment according to evidence.'),
        8:(f'这种处理方式并不承诺消除所有不确定性，却能让{person}清楚说明选择的依据、边界以及可能承担的代价。','This approach does not promise to remove all uncertainty, but it lets the person explain the basis, limits and possible costs of a choice.'),
        9:(f'最终，{person}没有把个案包装成普遍规律，而是保留了必要的怀疑：证据来自哪里、哪些声音尚未被听见、结论在什么条件下可能失效。这样的自我追问，使行动既有方向，也保有纠错能力。','In the end, the person did not present one case as a universal rule. Necessary questions remained: where did the evidence come from, whose voices were still absent, and under what conditions might the conclusion fail? This self-questioning gave the action direction while preserving the ability to correct it.'),
      }
      closing_zh,closing_en=level_closings[level]
      zh.append(closing_zh)
      en.append(closing_en)
    shown_lesson=simple_lesson if level <= 2 else lesson
    title_level=title
    correct1=result
    slug_tag=tag.replace(' ','-')
    articles.append({
      'id':f'reading-article-hsk{level}-{idx:02d}', 'slug':f'hsk{level}-{slug_tag}-{idx:02d}', 'level':level,
      'title':title_level, 'summary':shown_lesson, 'topic':tag, 'minutes':max(2,level+1),
      'paragraphs':zh, 'translation':en, 'vocabulary':[{'hanzi':h,'pinyin':p,'meaning':m} for h,p,m in (SIMPLE_VOCAB[idx-1] if level <= 2 else VOCAB[idx-1])],
      'audioSrc':f'/audio/reading-articles/v1/hsk{level}-{slug_tag}-{idx:02d}.mp3',
      'audioDisclosure':'AI-synthesized Mandarin narration; not a human or official HSK recording.',
      'questions':[
        {'id':'q1','prompt':'文章中发生了什么结果？','options':[correct1,'事情一直没有变化','大家决定不再处理问题','主人公马上离开了这里'],'correctAnswer':0,'explanation':f'正文明确写道：“{correct1}”。'},
        {'id':'q2','prompt':'主人公先遇到了什么情况？','options':[action,'一切都和计划完全一样','他马上放弃了这件事','没有人发现任何变化'],'correctAnswer':0,'explanation':f'第一段交代了事情的开始：“{action}”。'},
        {'id':'q3','prompt':'这篇文章最想说明什么？','options':[shown_lesson,'所有计划都应该取消','遇到问题只需要等待','个人选择不会影响别人'],'correctAnswer':0,'explanation':f'正文围绕这个主旨展开：“{shown_lesson}”。'}],
      'sourceLicense':'HSKKit original editorial content','reviewStatus':'first-pass-approved','contentVersion':'reading-articles-v1'
    })
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps({'version':'reading-articles-v1','label':'HSKKit graded articles','coverageNotice':'HSKKit-authored graded reading based on HSK 3.0 learning goals; not an official exam bank.','articles':articles},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'articles':len(articles),'levels':{str(i):sum(a['level']==i for a in articles) for i in range(1,10)},'out':str(OUT)},ensure_ascii=False))
