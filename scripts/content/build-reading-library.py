#!/usr/bin/env python3
"""Build the independently structured HSKKit HSK 1–9 reading practice V2 corpus."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/lib/learning/reading-library.json"

TRAVEL_NOTES = [
    ("出发前还要确认车站入口。", "Before leaving, the station entrance must also be confirmed."),
    ("行李只带一个小包。", "Only one small bag will be taken."),
    ("家人会在到达后接站。", "A family member will meet the traveler on arrival."),
    ("车票已经保存在手机里。", "The ticket has already been saved on the phone."),
    ("如果下雨就带一把伞。", "An umbrella will be taken if it rains."),
    ("途中准备听中文节目。", "A Chinese program is planned for the journey."),
    ("到达以后先给朋友打电话。", "The traveler will call a friend after arriving."),
    ("回程前会再检查时间。", "The time will be checked again before the return trip."),
    ("这次不托运行李。", "No luggage will be checked on this trip."),
    ("座位选在靠窗的位置。", "A window seat has been selected."),
    ("早餐会在出发前吃完。", "Breakfast will be finished before departure."),
    ("地图已经提前下载好了。", "The map has been downloaded in advance."),
    ("需要的证件放在外套口袋里。", "The required document is in the coat pocket."),
    ("朋友提醒他不要迟到。", "A friend reminded the traveler not to be late."),
    ("出发当天会提前半小时到站。", "The traveler will arrive at the station thirty minutes early."),
    ("酒店地址已经写在备忘录里。", "The hotel address has been saved in the notes."),
    ("这次行程不需要换车。", "No transfer is required on this journey."),
    ("充电器放在随身行李中。", "The charger is packed in the carry-on bag."),
    ("到站以后准备乘公交去住处。", "A bus will be taken to the accommodation after arrival."),
    ("返程车票也已经买好。", "The return ticket has also been purchased."),
    ("旅行期间会每天联系家人。", "The traveler will contact family each day during the trip."),
    ("同行的人负责保管纸质车票。", "A companion will keep the printed ticket."),
    ("计划中留出了吃午饭的时间。", "The plan leaves time for lunch."),
    ("出发前一晚会再次整理行李。", "The luggage will be checked again the night before departure."),
]
SERVICE_NOTES = [
    ("入口处会增加一名值班人员。", "An additional staff member will be on duty at the entrance."),
    ("具体规则同时公布在服务号上。", "The detailed rules are also posted on the service account."),
    ("周末仍然使用原来的时间。", "The original hours still apply on weekends."),
    ("现场新增了清楚的指示牌。", "Clear new signs have been added on site."),
    ("首次使用者可以在前台咨询。", "First-time visitors may ask at the front desk."),
    ("工作人员会在闭馆前广播提醒。", "Staff will make an announcement before closing."),
    ("延长时段不另外收费。", "There is no extra charge for the extended hours."),
    ("失物招领仍在原窗口办理。", "Lost-and-found service remains at the original counter."),
    ("团体来访需要提前登记。", "Group visits require advance registration."),
    ("高峰时段可能需要短暂排队。", "A short wait may be required at peak times."),
    ("服务台准备了纸质说明。", "Printed instructions are available at the service desk."),
    ("紧急出口的位置没有变化。", "The emergency-exit location has not changed."),
    ("试行一个月后还会收集意见。", "Feedback will be collected after a one-month trial."),
    ("老年访客可请工作人员协助。", "Older visitors may ask staff for assistance."),
    ("自助设备也会延长运行时间。", "The self-service machines will also operate for longer hours."),
    ("最后入场时间比闭馆早半小时。", "Last entry is thirty minutes before closing."),
    ("临时调整会通过短信通知预约者。", "Temporary changes will be sent to registered visitors by text message."),
    ("儿童区域仍需由成人陪同。", "Children still need adult supervision in the children's area."),
    ("清洁工作改到服务结束后进行。", "Cleaning will take place after service ends."),
    ("咨询电话的接听时间同步延长。", "Telephone support hours will be extended as well."),
    ("部分窗口会在晚间轮流开放。", "Some counters will open in rotation during the evening."),
    ("预约取消规则保持不变。", "The reservation-cancellation policy remains unchanged."),
    ("现场将记录各时段的使用人数。", "Visitor numbers will be recorded for each time period."),
    ("试行期间每周发布一次运行情况。", "An operating update will be published weekly during the trial."),
]

VOCAB = {
    1: [("星期", "xīngqī", "week"), ("上午", "shàngwǔ", "morning"), ("一起", "yìqǐ", "together")],
    2: [("决定", "juédìng", "decide"), ("因为", "yīnwèi", "because"), ("返回", "fǎnhuí", "return")],
    3: [("复习", "fùxí", "review"), ("记录", "jìlù", "record"), ("一遍", "yí biàn", "once through")],
    4: [("延长", "yáncháng", "extend"), ("出示", "chūshì", "present or show"), ("方便", "fāngbiàn", "convenient")],
    5: [("试行", "shìxíng", "pilot or try out"), ("保证", "bǎozhèng", "ensure"), ("调查", "diàochá", "survey")],
    6: [("支持者", "zhīchízhě", "supporter"), ("反对者", "fǎnduìzhě", "opponent"), ("观察期", "guāncháqī", "observation period")],
    7: [("试点", "shìdiǎn", "pilot program"), ("样本", "yàngběn", "sample"), ("稳定性", "wěndìngxìng", "stability")],
    8: [("波动", "bōdòng", "fluctuation"), ("资源", "zīyuán", "resources"), ("评估", "pínggū", "evaluate")],
    9: [("因果关系", "yīnguǒ guānxì", "causal relationship"), ("方法", "fāngfǎ", "method"), ("结论", "jiélùn", "conclusion")],
}

LEVEL_ROWS = {
1: [
("小林","一","图书馆","看书","姐姐","公园","散步"),("王月","二","商店","买水果","妈妈","家里","做饭"),("李明","三","学校","上汉语课","同学","操场","打球"),("张丽","四","医院","看医生","爸爸","药店","买药"),("陈雨","五","车站","接朋友","哥哥","饭店","吃饭"),("刘安","六","菜市场","买菜","奶奶","家里","包饺子"),("赵新","日","电影院","看电影","朋友","咖啡店","聊天"),("孙华","一","银行","办事","丈夫","书店","买词典"),("周平","三","邮局","寄东西","妹妹","超市","买牛奶"),("吴芳","六","博物馆","看展览","儿子","河边","骑车")],
2: [
("王明","杭州","火车","火车更快也更准时","星期天下午"),("李娜","苏州","公共汽车","车站离她家更近","星期日晚上"),("张伟","南京","高铁","上午还有工作","星期六晚上"),("陈洁","青岛","飞机","假期只有两天","星期日晚饭前"),("刘洋","成都","夜班火车","可以节省白天时间","星期一早上"),("赵敏","天津","地铁","路上不容易堵车","星期六下午"),("孙强","厦门","飞机","提前买票比较便宜","星期日晚上"),("周兰","武汉","火车","可以带更多行李","星期一上午"),("吴刚","西安","长途汽车","能直接到朋友家附近","星期日下午"),("黄梅","昆明","飞机","路程很远","星期二早上")],
3: [
("林月","十个生词","听十五分钟中文","不懂的句子","晚上"),("王涛","课文第三课","朗读课文","发音问题","午饭后"),("赵雪","昨天的语法","做五道练习","做错的题","睡觉前"),("陈东","老师的笔记","看新闻短片","新的表达","晚饭后"),("刘佳","本周词表","和同学对话","不会说的词","第二天早上"),("孙文","阅读材料","听课文录音","文章要点","下课以后"),("周婷","量词用法","写一段日记","不自然的句子","周末"),("吴亮","考试错题","练习口语","常见错误","晚上九点"),("黄静","今天的生词","读一篇短文","关键词","回家以后"),("郑浩","老师发的资料","做听写练习","漏写的字","第二天上课前")],
4: [
("市图书馆","晚上九点","晚上十一点","借书证","给准备考试的学生更多学习时间"),("社区游泳馆","下午六点","晚上八点","居民卡","方便下班后的居民锻炼"),("学校食堂","下午一点","下午两点","校园卡","让下午有课的学生及时吃饭"),("博物馆","下午五点","晚上七点","预约码","让游客避开白天的人流"),("地铁咨询台","晚上八点","晚上十点","当日车票","帮助晚到的乘客换乘"),("社区诊所","下午五点","晚上九点","医保卡","方便上班族就医"),("大学自习室","晚上十点","凌晨一点","学生证","满足期末复习需要"),("城市书店","晚上八点","晚上十点","会员码","举办更多晚间读书活动"),("体育中心","下午七点","晚上十点","预约记录","方便市民参加夜间课程"),("政务服务厅","下午五点","晚上七点","预约短信","帮助白天无法请假的居民办事")],
5: [
("科技公司","员工可在七点到十点之间到岗","核心时段每组必须有人值班","迟到减少但跨组会议要更早安排"),("设计工作室","每周两天可以在家办公","客户会议必须有人到现场","通勤时间减少但设备预约增加"),("社区学校","晚课可在线或到教室参加","考试仍须统一到校","出勤提高但教师备课时间增加"),("市图书馆","读者可线上预约座位","迟到二十分钟会释放座位","排队减少但高峰期取消率上升"),("物流中心","员工可交换周末班次","每班人数不得低于安全标准","请假冲突减少但排班沟通增加"),("医院门诊","部分复诊可以视频完成","首次诊断必须到院","候诊时间缩短但网络支持需求增加"),("培训机构","学生可自行选择作业截止日","所有作业须在考试前完成","按时提交率提高但最后一周更忙"),("公共交通公司","乘客可预约无障碍服务","须提前一天确认需求","投诉减少但临时申请难以安排"),("大学实验室","研究人员可共享仪器时段","危险实验必须有两人在场","设备利用率提高但夜间值班增加"),("新闻编辑部","记者可选择早班或晚班","重大新闻期间全员待命","个人安排更灵活但交接记录更重要")],
6: [
("旧区更新方案","增加公共绿地并减少路边停车位","步行环境会带来更多客流","停车不便可能使顾客离开","只有两个月的试点数据","延长观察期后再决定是否全面实施"),("河岸步道项目","建设连续自行车道并限制汽车进入","能改善空气和公共空间","周边商户担心送货困难","客流数据只来自周末","增加工作日测试再表决"),("学校午餐改革","增加素食菜单并减少油炸食品","有助于学生形成健康习惯","部分家长担心孩子吃不饱","满意度调查样本较小","先扩大试吃范围"),("远程办公制度","允许员工每周三天在家工作","可以减少通勤并提高专注度","管理者担心新人培训受影响","试点没有包含新员工","补充培训数据后再评估"),("城市夜市计划","延长营业时间并增加摊位","能吸引游客并增加收入","居民担心噪音影响休息","噪音监测只做了一个星期","延长监测并调整区域"),("校园共享单车方案","增加站点并限制私人车辆","能缓解停车压力","维修人员担心管理成本上升","缺少冬季使用数据","完成全年观察后决定"),("社区垃圾分类奖励","积分可以兑换生活用品","有助于提高参与率","居民担心登记过程太复杂","试点只覆盖两个小区","简化流程后扩大试点"),("医院预约改革","按病情紧急程度安排时段","可减少重症患者等待","普通患者担心等候更久","目前只有一个科室的数据","加入更多科室再比较"),("公共数据开放计划","发布交通和环境数据","研究者可以开发公共服务","部门担心隐私和维护成本","风险评估尚未完成","先完成脱敏测试"),("大学课程改革","增加跨学科项目课程","学生能练习解决真实问题","教师担心基础知识时间被压缩","首届学生尚未毕业","跟踪长期结果后再调整")],
7: [
("线上问诊试点","平均候诊时间缩短了百分之十八","三个城市的小型门诊","复杂病例是否被转出","比较病例构成和半年后的复诊率"),("智能公交调度试点","高峰期准点率提高了百分之十二","两条客流稳定的线路","恶劣天气数据","扩大线路并观察季节变化"),("数字教材试点","学生测验成绩提高了百分之九","设备充足的四所学校","家庭网络差异","比较不同资源条件下的长期效果"),("社区照护试点","独居老人求助响应更快","志愿者充足的两个社区","志愿者流失率","评估人员稳定性和持续成本"),("节水灌溉试点","用水量减少了百分之二十","气候相近的三个农场","不同土壤条件","增加地区并跟踪作物产量"),("弹性票价试点","非高峰乘客增加了百分之十五","通勤选择较多的中心城区","低收入乘客负担","分析分配影响和替代交通"),("自动审批试点","简单申请处理时间减半","规则清楚的两类业务","复杂申请被排除的比例","公开案件分类和人工复核成本"),("远程实验课试点","课程完成率提高了百分之十","已有实验设备的学生","设备缺失学生的退出情况","按设备条件分组比较"),("城市降温试点","试点街区温度下降了两度","树荫充足的五条街道","维护成本和冬季影响","扩大样本并观察全年表现"),("小微贷款试点","按时还款率达到百分之九十三","经营稳定的老客户","新企业的违约风险","纳入不同经营年限并长期跟踪")],
8: [
("两种职业培训补贴方案","平均就业率接近","第二种方案结果波动更大","资金较少的学员承担更高风险","按收入与地区分别评估结果分布"),("两条区域供水路线","平均成本相近","第二条路线受季节影响更明显","偏远社区更容易停水","比较极端天气下的可靠性"),("两个养老金投资组合","长期平均收益接近","高风险组合年度波动更大","临近退休者恢复损失的时间较少","按年龄和承受能力配置方案"),("两种医院采购模式","平均价格差异不大","集中采购交付时间波动更大","小型医院库存空间有限","同时评估价格、延迟和库存压力"),("两套大学资助制度","总体毕业率相近","竞争性资助在少数学校高度集中","资源较弱学校更难获得支持","分析学校基础条件和资金分布"),("两种电价改革方案","居民平均支出接近","分时电价对用电时段敏感","无法调整时间的家庭负担更高","按家庭类型测算分配影响"),("两个洪水保险模型","平均保费相近","风险定价模型地区差异更大","高风险低收入家庭可能无力投保","评估可负担性和保障缺口"),("两种公共交通合同","平均运营成本接近","绩效合同收入波动更大","小型运营商缺乏现金储备","加入抗风险能力指标"),("两类科研资助方式","平均论文数量相近","短期竞赛制结果更不稳定","年轻团队难以承担连续落选","比较创新质量和团队持续性"),("两种住房更新模式","平均新增住房数量接近","市场主导模式价格波动更大","原有租户面临搬迁风险","评估可负担性和社区稳定")],
9: [
("城市摄像头数量增加后案件下降","同期巡逻人员也增加且统计口径改变","没有设置可比对照区","不能把相关性直接写成摄像头导致案件下降"),("学校延长课时后平均成绩提高","参加补习的学生比例同时上升","未控制家庭投入差异","现有数据不足以证明延长课时是唯一原因"),("企业采用新软件后利润上升","市场需求同期快速增长","没有比较未使用软件的同类企业","无法分离软件与市场变化的影响"),("医院引入提醒系统后复诊率提高","保险报销政策同期扩大","患者群体前后构成不同","应先校正政策和样本变化再判断效果"),("城市修建自行车道后零售客流增加","附近同时开放了大型文化中心","缺少其他街区的变化趋势","不能把全部客流增长归因于自行车道"),("平台调整推荐算法后停留时间增加","同期自动播放功能上线","实验没有分开两个改动","现有设计不能识别哪项功能产生效果"),("地区减税后新企业数量增加","全国融资成本同期下降","缺少相似未减税地区作对照","不能忽视宏观融资环境"),("大学取消统一考试后毕业率提高","入学标准和课程要求同时变化","各届学生基础差异未校正","政策效果需要更严格的队列比较"),("社区增加绿地后居民健康评分提高","调查对象中年轻家庭比例上升","健康评分来自自愿问卷","样本选择和人口变化可能解释部分结果"),("公司实行四天工作制后产出增加","试点只选择了绩效较高的团队","没有记录旺季与淡季差异","结论不能直接推广到所有部门")],
}

# Each released passage is backed by its own authored scenario row. Do not cycle a
# smaller seed set: the public count represents independent practice contexts.
LEVEL_ROWS[1].extend([
    ("何平","二","花店","买花","阿姨","医院","看朋友"),("马琳","五","面包店","买面包","弟弟","体育馆","游泳"),
    ("高峰","日","动物园","看熊猫","女儿","饭店","吃面条"),("谢红","四","学校","开家长会","丈夫","超市","买水果"),
    ("唐乐","六","车站","买车票","朋友","茶馆","喝茶"),("冯雪","一","公园","跑步","同事","食堂","吃午饭"),
    ("曹阳","三","照相馆","取照片","姐姐","商场","买衣服"),("蒋欣","五","医院","拿药","妈妈","河边","散步"),
    ("邓飞","二","书店","找地图","同学","车站","等车"),("宋佳","六","菜市场","买鸡蛋","爸爸","厨房","做晚饭"),
    ("罗明","四","银行","换钱","哥哥","电影院","看电影"),("许静","日","邮局","寄信","奶奶","公园","晒太阳"),
    ("彭宇","一","学校","借书","妹妹","冰淇淋店","吃冰淇淋"),("韩梅","三","眼镜店","取眼镜","朋友","广场","拍照"),
])
LEVEL_ROWS[2].extend([
    ("何雨","济南","高铁","下午要参加会议","星期日中午"),("马欣","长沙","飞机","早上要先送孩子上学","星期一晚上"),
    ("高杰","大连","夜班火车","可以在车上休息","星期二早上"),("谢宁","福州","动车","车次多而且换乘少","星期日傍晚"),
    ("唐悦","郑州","长途汽车","能直接到县城","星期一中午"),("冯凯","桂林","飞机","同行的老人不适合久坐","星期日下午"),
    ("曹静","合肥","高铁","到站后离酒店很近","星期六晚上"),("蒋磊","哈尔滨","飞机","冬天公路容易受天气影响","星期三上午"),
    ("邓敏","无锡","城际火车","当天往返最方便","星期六晚上"),("宋涛","南昌","夜班火车","可以少住一晚酒店","星期一清晨"),
    ("罗兰","重庆","飞机","工作结束得比较晚","星期二下午"),("许峰","扬州","公共汽车","沿途可以看到乡村风景","星期日中午"),
    ("彭丽","石家庄","高铁","需要准时参加婚礼","星期一早上"),("韩东","宁波","动车","车站就在公司附近","星期日晚上"),
])
LEVEL_ROWS[3].extend([
    ("何倩","上节课的对话","跟读十分钟","声调不准的词","晚饭前"),("马超","本月词卡","写六个例句","容易混淆的用法","星期五晚上"),
    ("高琳","课本练习","和老师练口语","回答不完整的地方","下课后"),("谢宇","新闻里的生词","复述新闻内容","听不清的数字","第二天中午"),
    ("唐宁","常用成语","读故事材料","成语出现的语境","周日早上"),("冯佳","听写错字","抄写短句","总写错的笔画","睡觉以前"),
    ("曹明","课堂录音","完成配套问题","没听懂的转折句","早饭后"),("蒋雪","口语作业","录一分钟回答","停顿太久的地方","晚上八点"),
    ("邓安","旅游词汇","看地图说路线","方向表达","出门以前"),("宋雨","工作邮件范例","写一封回复","不熟悉的正式用语","午休时"),
    ("罗芳","比较句","描述两张图片","语序错误","第二天放学后"),("许涛","量词表","整理房间里的物品","用错的量词","星期六下午"),
    ("彭静","健康主题词语","听医生访谈","重要建议","跑步以后"),("韩亮","考试说明","做模拟选择题","审题失误","考试前一晚"),
])
LEVEL_ROWS[4].extend([
    ("区文化馆","下午六点","晚上九点","活动证","方便居民参加夜间艺术课"),("火车站服务中心","晚上九点","午夜十二点","车票信息","帮助夜间到站旅客咨询"),
    ("少年宫","下午五点","晚上八点","课程卡","方便家长下班后接孩子"),("大学校史馆","下午四点","晚上六点","校园预约码","接待课后参观的师生"),
    ("市民健身房","晚上八点","晚上十一点","健身卡","满足晚班职工锻炼需要"),("社区阅览室","晚上七点","晚上九点半","居民证","给中学生提供安静学习空间"),
    ("艺术展览中心","下午五点半","晚上八点半","电子门票","方便游客下班后看展"),("便民服务站","下午四点","晚上六点半","办理号码","帮助接送孩子后的家长办事"),
    ("大学打印中心","下午六点","晚上十点","学生卡","满足毕业季打印材料需求"),("社区药房","晚上七点","晚上十点","处方或医保码","方便居民夜间取药"),
    ("城市档案馆","下午四点半","晚上七点","查档预约单","服务工作日难以请假的市民"),("公共法律咨询点","下午五点","晚上八点","预约短信","增加上班族获得咨询的机会"),
    ("青年活动中心","晚上八点","晚上十点半","报名二维码","开展更多下班后的社团活动"),("客运站行李处","晚上九点","晚上十一点","行李凭证","方便末班车乘客取行李"),
])
LEVEL_ROWS[5].extend([
    ("出版社","编辑可错峰选择校对时段","印刷前必须完成交叉复核","加班减少但版本交接次数增加"),("连锁餐厅","门店可按客流调整备餐量","食品安全检查项目不得减少","浪费下降但预测工作增加"),
    ("城市公园","游客可线上预约团体活动区","周末每个时段限制团体数量","场地冲突减少但临时改期增多"),("职业学校","实训课可分早晚两个批次参加","安全操作考核必须现场完成","设备等待减少但教师排班更复杂"),
    ("软件客服中心","员工可自行交换夜间值班","每班至少保留一名高级工程师","换班满意度提高但审批记录增加"),("社区托儿中心","家长可按小时预约临时托管","儿童健康信息必须提前登记","空位利用率提高但登记工作增加"),
    ("农产品市场","商户可预约不同到货时段","冷链商品必须优先检查","入口拥堵减少但调度要求提高"),("市民剧场","观众可在演出前线上换座","已打印纸票必须先作废","空座减少但票务核对时间增加"),
    ("研究院","团队可申请共享数据分析平台","涉及隐私的数据必须脱敏","重复采购减少但权限管理更重要"),("银行客服部","部分咨询可预约视频办理","身份核验必须使用原有标准","网点排队减少但线上培训需求增加"),
    ("物业公司","住户可自选维修上门时段","紧急报修仍按优先级处理","爽约减少但路线安排更复杂"),("连锁书店","员工可跨门店申请临时班次","每家店必须保留熟悉库存的员工","缺班减少但跨店沟通增加"),
    ("大学图书馆","读者可预约小组讨论室","连续使用不得超过两小时","空间利用率提高但超时提醒增加"),("养老服务中心","家属可线上选择探访时间","护理交接期间暂停探访","等候减少但预约协调工作增加"),
])
LEVEL_ROWS[6].extend([
    ("城市屋顶花园计划","补贴公共建筑建设可开放绿化空间","能缓解热岛并增加休息场所","物业担心维护责任和漏水风险","试点只包含三栋新建筑","纳入旧建筑评估后再扩大"),("中学晚自习调整","允许学生每周两晚在家自习","可以减少晚间通勤和疲劳","教师担心学习问题无法及时发现","调查只持续了四周","比较一个学期的成绩与睡眠变化"),
    ("共享厨房项目","向小型餐饮创业者提供按小时租赁","能降低创业初期设备成本","监管人员担心食品责任难以划分","试点尚未出现客流高峰","完成高峰压力测试再审批"),("社区雨水回收方案","收集屋顶雨水用于绿化清洁","能节约自来水并减少积水","居民担心水质和设备噪声","检测仅覆盖夏季","增加冬季监测后决定"),
    ("公共图书流动车计划","用流动车定期服务偏远社区","能让行动不便者更容易借书","管理方担心运输和藏书损耗","路线测试只做了城市近郊","加入山区路线成本再评估"),("大学开放实验室制度","周末向中学生开放基础实验设备","有助于培养科学兴趣","实验员担心安全培训时间不足","首轮活动人数不到计划一半","扩大参与后复核事故风险"),
    ("旧衣回收积分计划","居民投放旧衣可兑换公交优惠","可提高回收率并支持再利用","环保组织担心无法追踪最终去向","只有回收量没有处理数据","公开流向审计后再推广"),("街区限速改造","把学校周边车速上限降到每小时三十公里","能降低碰撞风险并改善步行环境","司机担心高峰通行时间增加","测速数据只来自上学时段","补充全天数据并优化信号灯"),
    ("医院陪诊志愿服务","培训志愿者帮助老人完成就诊流程","可以减少迷路和重复排队","医护人员担心职责边界不清","满意度调查未记录投诉案例","明确责任并完成风险评估"),("社区共享工具库","居民可借用低频使用的维修工具","能减少重复购买和资源浪费","管理人员担心损坏与归还困难","试点只有登记完好的工具数据","加入维修成本后再决定规模"),
    ("城市夜间公交扩线","周末增加跨区夜班线路","能服务晚班人员并减少酒后驾车","运营方担心空驶率和司机不足","客流预测来自节假日","先试运行普通周末三个月"),("小学无纸化通知计划","家长通过统一平台接收校务信息","能减少漏看通知和纸张消耗","部分家庭担心设备与网络限制","试点班级都位于城区","加入网络条件较弱学校再评估"),
    ("河道生态清理项目","用人工方式替代部分机械清淤","可减少对水生生物的干扰","施工方担心工期和成本上升","生态观察只有施工前数据","补充施工中和施工后监测"),("社区早餐车计划","在通勤站点设置流动早餐车","能方便早班居民并分散店内排队","商户担心卫生检查和竞争公平","试点只运行了天气晴朗的两周","经历不同天气后再决定常态化"),
])
LEVEL_ROWS[7].extend([
    ("校园心理咨询预约试点","首次等待时间缩短了百分之二十五","咨询师充足的三所大学","高风险学生是否获得持续服务","按风险等级跟踪半年并比较转介结果"),
    ("农村冷链配送试点","生鲜损耗率下降了百分之十四","道路条件较好的四个乡镇","偏远村庄的末端成本","扩大到不同地形并核算全年费用"),
])
LEVEL_ROWS[8].extend([
    ("两种老旧电梯更新融资方案","平均年度支出接近","分期方案后期费用波动更明显","收入较低住户更难承担临时追加款","按收入和楼龄开展压力测试"),
    ("两套城市垃圾收费制度","家庭平均费用相近","按量收费的月度账单波动更大","人口较多家庭承担的调整压力更高","同时分析减量效果与家庭负担分布"),
])
LEVEL_ROWS[9].extend([
    ("地区引进共享办公空间后创业注册量上升","同期线上注册流程简化且贷款补贴增加","没有追踪未使用共享空间的创业者","现有证据不足以把增长单独归因于共享办公空间"),
    ("学校安装空气净化设备后学生缺勤减少","同期流感季较轻且通风制度改变","没有记录学生在校外的健康暴露","应控制季节和通风因素后再判断设备效果"),
])


def rotate(correct: str, distractors: list[str], slot: int):
    values = distractors[:2]
    values.insert(slot % 3, correct)
    options = dict(zip(("A", "B", "C"), values))
    answer = ("A", "B", "C")[slot % 3]
    return options, answer


def question(prompt: str, correct: str, distractors: list[str], kind: str, slot: int, reason: str):
    options, answer = rotate(correct, distractors, slot)
    return {"prompt": prompt, "options": options, "correctAnswer": answer, "explanation": f"Correct answer: {correct}. {reason}", "questionType": kind}


def build(level: int, index: int, row: tuple):
    slot = index % 3
    style = (index + index // len(LEVEL_ROWS[level])) % 4
    if level == 1:
        person, day, place1, action1, companion, place2, action2 = row
        passage = [f"星期{day}，{person}上午去{place1}{action1}。下午，{companion}和{person}一起去{place2}{action2}。他们晚上回家。", f"{person}星期{day}上午在{place1}{action1}。{companion}下午来找{person}，两个人后来到{place2}{action2}，晚上才回家。", f"上午，{person}为了{action1}去了{place1}。到了下午，{person}跟{companion}换了地方，在{place2}{action2}。这一天是星期{day}，他们晚上回家。", f"{companion}星期{day}下午问{person}在哪儿。原来{person}上午去了{place1}{action1}，下午又和{companion}在{place2}{action2}，晚上才回家。"] [style]
        translation = f"On weekday {day}, {person} goes to {place1} in the morning to {action1}. In the afternoon, {companion} and {person} go together to {place2} to {action2}. They return home in the evening."
        qs = [question(f"{person}上午去哪儿？", place1, ["机场", place2], "location", slot, f"文章说{person}上午去{place1}。"), question(f"谁和{person}一起去{place2}？", companion, ["老师", "医生"], "participant", slot+1, f"文章说{companion}和{person}一起去。"), question("他们什么时候回家？", "晚上", ["上午", "中午"], "sequence", slot+2, "最后一句说明他们晚上回家。")]
        title = f"{person}的星期{day}"
    elif level == 2:
        person, city, transport, reason, returning = row
        passage = [f"{person}周末想去{city}。{person}决定坐{transport}，因为{reason}。{person}星期六早上出发，{returning}返回。", f"因为{reason}，{person}没有选择别的交通工具，而是坐{transport}去{city}。行程从星期六早上开始，到{returning}结束。", f"去{city}以前，{person}比较了几种交通方式。最后选了{transport}，主要原因是{reason}。出发时间是星期六早上，返回时间是{returning}。", f"{person}的周末计划已经定了：星期六早上坐{transport}去{city}。这个选择和“{reason}”有关，{returning}再回来。"] [style]
        translation = f"{person} plans to visit {city} on the weekend and decides to travel by {transport} because {reason}. Departure is Saturday morning and the return is {returning}."
        qs = [question(f"{person}周末想去哪儿？", city, ["北京", "上海"], "destination", slot, f"第一句说明目的地是{city}。"), question(f"{person}为什么选择{transport}？", reason, ["朋友要求这样做", "没有别的选择"], "reason", slot+1, f"文章用“因为”直接说明：{reason}。"), question(f"{person}什么时候返回？", returning, ["星期六中午", "下个月"], "sequence", slot+2, f"最后一句给出的返回时间是{returning}。")]
        title = f"去{city}的周末计划"
    elif level == 3:
        person, first, second, notes, review_time = row
        effects = ["更容易发现自己的问题", "更快看出哪些地方还没掌握", "及时发现学习中的薄弱点", "清楚知道第二天要改什么"]
        effect = effects[style]
        passage = [f"{person}每天先复习{first}，再{second}。学习时，{person}会记录{notes}，并在{review_time}再看一遍。这样安排以后，{person}{effect}。", f"{person}发现只学习一次很容易忘记，于是把{notes}记下来，等到{review_time}再检查。平时，{person}还会先复习{first}，再{second}，从而{effect}。", f"为了改进学习方法，{person}给自己定了顺序：先复习{first}，然后{second}。遇到{notes}就做记录，{review_time}重新处理，以便{effect}。", f"{review_time}，{person}会打开白天的记录，其中都是{notes}。这份记录来自每天的学习：先复习{first}，再{second}。这样能让{person}{effect}。"] [style]
        translation = f"Every day {person} first reviews {first} and then does {second}. During study, {person} records {notes} and checks them once more {review_time}; this helps identify what still needs improvement."
        qs = [question(f"{person}学习时先做什么？", f"复习{first}", [second, "马上休息"], "sequence", slot, "“先……再……”说明复习是第一步。"), question(f"{person}学习时记录什么？", notes, ["天气", "同学的名字"], "note-taking", slot+1, f"文章明确说会记录{notes}。"), question("这样安排有什么作用？", effect, ["不用再学习", "每天可以迟到"], "purpose", slot+2, f"文章最后说明这套安排能让{person}{effect}。")]
        title = f"{person}的复习方法"
    elif level == 4:
        venue, old, new, credential, purpose = row
        passage = [f"从下周开始，{venue}把开放时间从{old}延长到{new}。来访者只要出示{credential}，就可以使用延长时段。这个调整是为了{purpose}。", f"{venue}发布通知：原来{old}结束的服务，下周起将持续到{new}。使用新增时段要出示{credential}，这样安排主要是为了{purpose}。", f"为了{purpose}，{venue}决定调整服务时间。新时间截止到{new}，比原来的{old}更晚；来访者进入时需要出示{credential}。", f"来访者最近建议{venue}提供更晚的服务。管理方为了{purpose}，把结束时间由{old}改为{new}，但新增时段只对能出示{credential}的人开放。"] [style]
        translation = f"Starting next week, {venue} extends opening time from {old} to {new}. Visitors can use the extended hours by showing {credential}. The adjustment is intended to {purpose}."
        qs = [question(f"{venue}延长到什么时候？", new, [old, "中午十二点"], "time", slot, f"第一句说明新的结束时间是{new}。"), question("使用延长时段需要什么？", f"出示{credential}", ["支付额外费用", "带两位朋友"], "condition", slot+1, f"只要出示{credential}就可以使用。"), question("这次调整的主要目的是什么？", purpose, ["减少所有来访者", "取消原有服务"], "purpose", slot+2, f"文章直接说明目的是{purpose}。")]
        title = f"{venue}延长开放时间"
    elif level == 5:
        org, policy, constraint, outcome = row
        reason_goals = ["保证基本服务", "避免关键岗位无人负责", "让必要服务不中断", "维持日常服务"]
        reason = f"为了{reason_goals[style]}"
        passage = [f"{org}最近试行一项新制度：{policy}。不过，{reason}，{constraint}。三个月后的调查显示，{outcome}。", f"三个月前，{org}开始允许{policy}。{reason}，制度仍规定{constraint}。最新调查发现：{outcome}，管理重点也随之改变。", f"调查人员评估了{org}的新安排。它一方面让{policy}，另一方面设置了必要限制：{constraint}，目的是{reason_goals[style]}。结果是{outcome}。", f"{org}没有直接长期采用新制度，而是先做试行。规则包括{policy}；{reason}，前提是{constraint}。从目前数据看，{outcome}。"] [style]
        translation = f"{org} is piloting a policy under which {policy}. A restriction remains so essential service can continue: {constraint}. A survey after three months found that {outcome}."
        qs = [question("新制度提供了什么变化？", policy, ["取消全部工作", "所有人必须增加工时"], "policy-detail", slot, f"文章说明：{policy}。"), question("为什么仍然保留限制条件？", reason, ["为了提高价格", "为了减少所有员工"], "reason", slot+1, f"文章明确说明限制是为了{reason_goals[style]}。"), question("调查结果说明了什么？", outcome, ["制度没有任何影响", "所有问题已经消失"], "inference", slot+2, f"调查显示：{outcome}。")]
        title = f"{org}的新制度"
    elif level == 6:
        plan, change, pro, con, evidence, decision = row
        passage = [f"{plan}提出{change}。支持者认为{pro}；反对者提出：{con}。由于{evidence}，委员会决定{decision}。", f"委员会没有立即通过{plan}。虽然支持者强调{pro}，反对者却提出{con}；再加上{evidence}，最终意见是{decision}。", f"围绕{plan}出现了两种判断。一方支持{change}，理由是{pro}；另一方关注{con}。现有材料只有“{evidence}”，因此还要{decision}。", f"{change}是{plan}的核心内容。讨论中，可能带来的{pro}受到肯定，{con}也没有被忽略。委员会鉴于{evidence}，选择{decision}。"] [style]
        translation = f"The {plan} proposes to {change}. Supporters argue that {pro}, while opponents worry that {con}. Because {evidence}, the committee considers the evidence insufficient and decides to {decision}."
        qs = [question("支持者的主要理由是什么？", pro, [con, "方案完全没有成本"], "argument", slot, f"支持者认为{pro}。"), question("反对者担心什么？", con, [pro, "项目已经结束"], "contrast", slot+1, f"反对者担心{con}。"), question("委员会为什么暂不作最终决定？", f"因为{evidence}", ["因为所有人都反对", "因为计划已经全面实施"], "reason", slot+2, f"证据限制是：{evidence}。")]
        title = plan
    elif level == 7:
        pilot, result, coverage, missing, recommendation = row
        passage = [f"{pilot}报告称，{result}。然而样本只覆盖{coverage}，也没有说明{missing}。评估者因此建议{recommendation}。", f"评估者没有因“{result}”就支持全面推广{pilot}。他们指出，数据来自{coverage}，而{missing}仍不清楚；下一步应{recommendation}。", f"关于{pilot}，现有结果确实显示{result}。问题在于研究范围仅为{coverage}，还遗漏了{missing}。若要判断效果是否稳定，需要{recommendation}。", f"报告把{result}列为{pilot}的阶段性进展。复核人员则追问样本为何只覆盖{coverage}，以及{missing}为何没有交代，并提出{recommendation}。"] [style]
        translation = f"The {pilot} reports that {result}. The finding matters, but the sample covers only {coverage} and does not explain {missing}. Treating the average as universal may exaggerate policy value, so evaluators recommend {recommendation} and further stability checks."
        qs = [question("试点报告的主要结果是什么？", result, ["项目没有任何数据", "所有地区结果完全相同"], "detail", slot, f"报告称{result}。"), question("推广结论的主要限制是什么？", f"样本只覆盖{coverage}，且缺少{missing}的信息", ["报告字体太小", "文章没有标题"], "critical-evaluation", slot+1, f"样本范围和{missing}的信息都不足。"), question("评估者建议下一步做什么？", recommendation, ["立刻在全国强制实施", "停止收集任何数据"], "recommendation", slot+2, f"最后一句建议{recommendation}。")]
        title = f"评估{pilot}"
    elif level == 8:
        options, average, volatility, burden, recommendation = row
        passage = [f"关于{options}的评估显示，{average}。不过，{volatility}，而且{burden}。决策者应{recommendation}。", f"若只依据“{average}”选择{options}，判断可能失真。因为{volatility}，同时{burden}。完整评估还应{recommendation}。", f"研究比较{options}时发现，平均层面是{average}；分开观察却能看到{volatility}以及{burden}。这正是建议{recommendation}的原因。", f"争议不在于{options}的平均表现——{average}——而在风险如何分布。证据表明{volatility}，且{burden}，所以需要{recommendation}。"] [style]
        translation = f"An evaluation of {options} finds that {average}. However, {volatility}, and {burden}. Looking only at averages hides differences in risk-bearing capacity, so decision-makers should {recommendation} rather than rely on one number."
        qs = [question("两种方案在平均结果上有什么特点？", average, ["第二种方案平均值一定为零", "报告没有比较平均结果"], "comparison", slot, f"开头说明{average}。"), question("为什么只看平均值不够？", f"因为{volatility}，并且{burden}", ["因为平均值永远错误", "因为不需要考虑任何群体"], "critical-evaluation", slot+1, f"波动和群体负担说明平均值不能代表全部影响。"), question("决策者应该怎样改进评估？", recommendation, ["只公布一个平均数字", "取消所有数据分析"], "recommendation", slot+2, f"文章建议{recommendation}。")]
        title = f"比较{options}"
    else:
        claim, counter, limitation, conclusion = row
        passage = [f"有人根据“{claim}”主张直接因果关系。然而，{counter}，研究也{limitation}。较稳妥的结论是：{conclusion}。", f"“{claim}”只能说明两个变化同时出现。由于{counter}，加上研究{limitation}，现有证据尚不能排除其他解释；{conclusion}。", f"研究者复核“{claim}”后，没有接受最初的因果判断。他们发现{counter}，而且研究{limitation}。因此，{conclusion}。", f"对“{claim}”的解释存在方法争议：一方面{counter}，另一方面研究{limitation}。如果忽略这些条件，相关性会被误写成因果；所以{conclusion}。"] [style]
        translation = f"Some infer direct causation from the claim that {claim}. However, {counter}, and the study {limitation}. Correlation can motivate further research but does not prove causation, so the careful conclusion is that {conclusion}."
        qs = [question("原主张依据的现象是什么？", claim, ["研究没有任何观察", "所有变量都保持不变"], "claim", slot, f"第一句引用的现象是：{claim}。"), question("研究方法的主要限制是什么？", limitation, ["文章使用了标点", "结论写在最后"], "method", slot+1, f"文章明确指出研究{limitation}。"), question("作者认为最稳妥的结论是什么？", conclusion, ["已经完全证明直接因果关系", "无需继续收集证据"], "critical-evaluation", slot+2, f"末句给出的结论是：{conclusion}。")]
        title = f"检验“{claim}”的因果主张"
    return title, passage, translation, qs


passages = []
for level in range(1, 10):
    target = 24 if level <= 6 else 12
    source_rows = LEVEL_ROWS[level]
    if len(source_rows) < target:
        raise ValueError(f"HSK {level} needs {target} independent source rows, found {len(source_rows)}")
    expanded_rows = source_rows[:target]
    for index, row in enumerate(expanded_rows, start=1):
        title, passage, translation, questions = build(level, index - 1, row)
        if level == 2:
            note, note_translation = TRAVEL_NOTES[(index - 1) % len(TRAVEL_NOTES)]
            passage += note
            translation += f" {note_translation}"
        if level == 4:
            note, note_translation = SERVICE_NOTES[(index - 1) % len(SERVICE_NOTES)]
            passage += note
            translation += f" {note_translation}"
        passages.append({
            "id": f"reading-library-v2-hsk{level}-{index:02d}",
            "slug": f"hsk{level}-reading-{index:02d}",
            "level": level,
            "levelBand": "7-9" if level >= 7 else str(level),
            "title": title,
            "passage": passage,
            "translation": translation,
            "vocabulary": [{"hanzi": hanzi, "pinyin": pinyin, "meaning": meaning} for hanzi, pinyin, meaning in VOCAB[level]],
            "difficulty": "easy" if level <= 2 else "medium" if level <= 5 else "hard" if level == 6 else "advanced",
            "sourceRef": "HSKKit-original-editorial-reading-v2",
            "sourceLicense": "HSKKit-original-editorial-v2",
            "authorizationStatus": "authorized",
            "qaStatus": "approved",
            "lifecycleStatus": "published",
            "questions": questions,
        })

bank = {
    "version": "hskkit-reading-library-v2",
    "label": "HSKKit levelled reading practice library",
    "coverageNotice": "HSKKit-authored practice based on the HSK 3.0 standard; not an official exam question bank.",
    "passages": passages,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(passages)} passages and {sum(len(p['questions']) for p in passages)} questions to {OUT}")
