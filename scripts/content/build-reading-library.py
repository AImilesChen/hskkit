#!/usr/bin/env python3
"""Build the HSKKit-authored HSK 1–9 reading practice V1 corpus."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/lib/learning/reading-library.json"

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
    if level == 1:
        person, day, place1, action1, companion, place2, action2 = row
        passage = f"星期{day}，{person}上午去{place1}{action1}。下午，{companion}和{person}一起去{place2}{action2}。他们晚上回家。"
        translation = f"On weekday {day}, {person} goes to {place1} in the morning to {action1}. In the afternoon, {companion} and {person} go together to {place2} to {action2}. They return home in the evening."
        qs = [question(f"{person}上午去哪儿？", place1, ["机场", place2], "detail", slot, f"文章说{person}上午去{place1}。"), question(f"谁和{person}一起去{place2}？", companion, ["老师", "医生"], "detail", slot+1, f"文章说{companion}和{person}一起去。"), question("他们什么时候回家？", "晚上", ["上午", "中午"], "sequence", slot+2, "最后一句说明他们晚上回家。")]
        title = f"{person}的星期{day}"
    elif level == 2:
        person, city, transport, reason, returning = row
        passage = f"{person}周末想去{city}。{person}决定坐{transport}，因为{reason}。{person}星期六早上出发，{returning}返回。"
        translation = f"{person} plans to visit {city} on the weekend and decides to travel by {transport} because {reason}. Departure is Saturday morning and the return is {returning}."
        qs = [question(f"{person}周末想去哪儿？", city, ["北京", "上海"], "detail", slot, f"第一句说明目的地是{city}。"), question(f"{person}为什么选择{transport}？", reason, ["朋友要求这样做", "没有别的选择"], "reason", slot+1, f"文章用“因为”直接说明：{reason}。"), question(f"{person}什么时候返回？", returning, ["星期六中午", "下个月"], "sequence", slot+2, f"最后一句给出的返回时间是{returning}。")]
        title = f"去{city}的周末计划"
    elif level == 3:
        person, first, second, notes, review_time = row
        passage = f"{person}每天先复习{first}，再{second}。学习时，{person}会记录{notes}，并在{review_time}再看一遍。这样安排以后，{person}更容易发现自己的问题。"
        translation = f"Every day {person} first reviews {first} and then does {second}. During study, {person} records {notes} and checks them once more {review_time}, making it easier to notice problems."
        qs = [question(f"{person}学习时先做什么？", f"复习{first}", [second, "马上休息"], "sequence", slot, "“先……再……”说明复习是第一步。"), question(f"{person}学习时记录什么？", notes, ["天气", "同学的名字"], "detail", slot+1, f"文章明确说会记录{notes}。"), question("这样安排有什么作用？", "更容易发现自己的问题", ["不用再学习", "每天可以迟到"], "purpose", slot+2, "最后一句说明了这套安排的作用。")]
        title = f"{person}的复习方法"
    elif level == 4:
        venue, old, new, credential, purpose = row
        passage = f"从下周开始，{venue}把开放时间从{old}延长到{new}。来访者只要出示{credential}，就可以使用延长时段。这个调整是为了{purpose}，让公共服务更加方便。"
        translation = f"Starting next week, {venue} extends opening time from {old} to {new}. Visitors can use the extended hours by showing {credential}. The adjustment is intended to {purpose}."
        qs = [question(f"{venue}延长到什么时候？", new, [old, "中午十二点"], "detail", slot, f"第一句说明新的结束时间是{new}。"), question("使用延长时段需要什么？", f"出示{credential}", ["支付额外费用", "带两位朋友"], "condition", slot+1, f"只要出示{credential}就可以使用。"), question("这次调整的主要目的是什么？", purpose, ["减少所有来访者", "取消原有服务"], "purpose", slot+2, f"文章直接说明目的是{purpose}。")]
        title = f"{venue}延长开放时间"
    elif level == 5:
        org, policy, constraint, outcome = row
        passage = f"{org}最近试行一项新制度：{policy}。不过，为了保证基本服务，{constraint}。三个月后的调查显示，{outcome}。这说明新制度带来便利的同时，也增加了协调要求。"
        translation = f"{org} is piloting a policy under which {policy}. To ensure basic service, {constraint}. A survey after three months found that {outcome}, showing both convenience and new coordination demands."
        qs = [question("新制度提供了什么变化？", policy, ["取消全部工作", "所有人必须增加工时"], "detail", slot, f"第一句说明：{policy}。"), question("为什么仍然保留限制条件？", "为了保证基本服务", ["为了提高价格", "为了减少所有员工"], "reason", slot+1, "文章明确说限制是为了保证基本服务。"), question("调查结果说明了什么？", "便利增加了，但协调要求也增加了", ["制度没有任何影响", "所有问题已经消失"], "inference", slot+2, f"调查显示{outcome}，体现便利与协调成本同时存在。")]
        title = f"{org}的新制度"
    elif level == 6:
        plan, change, pro, con, evidence, decision = row
        passage = f"{plan}提出{change}。支持者认为{pro}；反对者则担心{con}。由于{evidence}，委员会认为现阶段证据不足，因此决定{decision}。"
        translation = f"The {plan} proposes to {change}. Supporters argue that {pro}, while opponents worry that {con}. Because {evidence}, the committee considers the evidence insufficient and decides to {decision}."
        qs = [question("支持者的主要理由是什么？", pro, [con, "方案完全没有成本"], "argument", slot, f"支持者认为{pro}。"), question("反对者担心什么？", con, [pro, "项目已经结束"], "contrast", slot+1, f"反对者担心{con}。"), question("委员会为什么暂不作最终决定？", f"因为{evidence}", ["因为所有人都反对", "因为计划已经全面实施"], "reason", slot+2, f"证据限制是：{evidence}。")]
        title = plan
    elif level == 7:
        pilot, result, coverage, missing, recommendation = row
        passage = f"{pilot}报告称，{result}。这个结果固然值得重视，然而样本只覆盖{coverage}，而且没有说明{missing}。如果直接把平均结果视为普遍效果，可能会夸大政策价值。因此，评估者建议{recommendation}，并继续观察稳定性。"
        translation = f"The {pilot} reports that {result}. The finding matters, but the sample covers only {coverage} and does not explain {missing}. Treating the average as universal may exaggerate policy value, so evaluators recommend {recommendation} and further stability checks."
        qs = [question("试点报告的主要结果是什么？", result, ["项目没有任何数据", "所有地区结果完全相同"], "detail", slot, f"报告称{result}。"), question("推广结论的主要限制是什么？", f"样本只覆盖{coverage}，且缺少{missing}的信息", ["报告字体太小", "文章没有标题"], "critical-evaluation", slot+1, f"样本范围和{missing}的信息都不足。"), question("评估者建议下一步做什么？", recommendation, ["立刻在全国强制实施", "停止收集任何数据"], "recommendation", slot+2, f"最后一句建议{recommendation}。")]
        title = f"评估{pilot}"
    elif level == 8:
        options, average, volatility, burden, recommendation = row
        passage = f"关于{options}的评估显示，{average}。不过，{volatility}，而且{burden}。如果只看平均值，就会忽略不同群体承受风险的能力。因此，决策者应{recommendation}，不能用单一数字代替完整评估。"
        translation = f"An evaluation of {options} finds that {average}. However, {volatility}, and {burden}. Looking only at averages hides differences in risk-bearing capacity, so decision-makers should {recommendation} rather than rely on one number."
        qs = [question("两种方案在平均结果上有什么特点？", average, ["第二种方案平均值一定为零", "报告没有比较平均结果"], "comparison", slot, f"开头说明{average}。"), question("为什么只看平均值不够？", f"因为{volatility}，并且{burden}", ["因为平均值永远错误", "因为不需要考虑任何群体"], "critical-evaluation", slot+1, f"波动和群体负担说明平均值不能代表全部影响。"), question("决策者应该怎样改进评估？", recommendation, ["只公布一个平均数字", "取消所有数据分析"], "recommendation", slot+2, f"文章建议{recommendation}。")]
        title = f"比较{options}"
    else:
        claim, counter, limitation, conclusion = row
        passage = f"有人根据“{claim}”主张两者存在直接因果关系。然而，{counter}。更重要的是，研究{limitation}。相关性可以提示值得继续研究的问题，却不能自动证明因果关系。因此，较稳妥的结论是：{conclusion}。"
        translation = f"Some infer direct causation from the claim that {claim}. However, {counter}, and the study {limitation}. Correlation can motivate further research but does not prove causation, so the careful conclusion is that {conclusion}."
        qs = [question("原主张依据的现象是什么？", claim, ["研究没有任何观察", "所有变量都保持不变"], "claim", slot, f"第一句引用的现象是：{claim}。"), question("研究方法的主要限制是什么？", limitation, ["文章使用了标点", "结论写在最后"], "method", slot+1, f"文章明确指出研究{limitation}。"), question("作者认为最稳妥的结论是什么？", conclusion, ["已经完全证明直接因果关系", "无需继续收集证据"], "critical-evaluation", slot+2, f"末句给出的结论是：{conclusion}。")]
        title = f"检验“{claim}”的因果主张"
    return title, passage, translation, qs


passages = []
for level in range(1, 10):
    for index, row in enumerate(LEVEL_ROWS[level], start=1):
        title, passage, translation, questions = build(level, index - 1, row)
        passages.append({
            "id": f"reading-library-v1-hsk{level}-{index:02d}",
            "slug": f"hsk{level}-reading-{index:02d}",
            "level": level,
            "levelBand": "7-9" if level >= 7 else str(level),
            "title": title,
            "passage": passage,
            "translation": translation,
            "vocabulary": [{"hanzi": hanzi, "pinyin": pinyin, "meaning": meaning} for hanzi, pinyin, meaning in VOCAB[level]],
            "difficulty": "easy" if level <= 2 else "medium" if level <= 5 else "hard" if level == 6 else "advanced",
            "sourceRef": "HSKKit-original-editorial-reading-v1",
            "sourceLicense": "HSKKit-original-editorial-v1",
            "authorizationStatus": "authorized",
            "qaStatus": "approved",
            "lifecycleStatus": "published",
            "questions": questions,
        })

bank = {
    "version": "hskkit-reading-library-v1",
    "label": "HSKKit levelled reading practice library",
    "coverageNotice": "HSKKit-authored practice based on the HSK 3.0 standard; not an official exam question bank.",
    "passages": passages,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(passages)} passages and {sum(len(p['questions']) for p in passages)} questions to {OUT}")
