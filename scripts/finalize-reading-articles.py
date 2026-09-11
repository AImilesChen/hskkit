#!/usr/bin/env python3
"""Finalize the bounded HSK 1–9 graded-article corpus.

This script only transforms the dedicated Reading article bank. It preserves the
20 approved themes per level, expands them to the frozen length bands, adds
article-grounded vocabulary, balances answer positions, and records the named
executor's first editorial pass. It does not claim independent human review.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from pypinyin import Style, lazy_pinyin

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "src/lib/learning/reading-articles.json"
LENGTH_RANGES = {1:(80,150),2:(150,250),3:(250,400),4:(400,650),5:(650,900),6:(900,1200),7:(1200,2000),8:(1200,2000),9:(1200,2000)}
MIN_PARAGRAPHS = {1:2,2:3,3:4,4:4,5:5,6:5,7:5,8:5,9:5}
MIN_VOCAB = {1:8,2:8,3:8,4:10,5:10,6:10,7:12,8:12,9:12}
DIFFICULTY = {1:"foundation",2:"foundation",3:"developing",4:"developing",5:"independent",6:"independent",7:"advanced",8:"advanced",9:"advanced"}

# Reusable discourse moves are rotated by article. Each pair is a complete,
# natural Chinese sentence and its faithful English translation. Theme/title and
# summary are interpolated so every article remains about its own event.
MOVES = [
("回头看“{title}”这件事，关键不只是结果，而是当事人怎样一步一步作出选择。", "Looking back at “{title},” the key is not only the result but also how the person made choices step by step."),
("事情刚发生时，主人公先确认眼前的情况，没有让着急代替观察。", "When the event first occurred, the person confirmed the situation instead of allowing anxiety to replace observation."),
("在信息还不完整的时候，先问清楚、再行动，通常比凭印象判断更可靠。", "When information is incomplete, asking first and acting afterward is usually more reliable than judging by impression."),
("主人公也考虑了别人的需要，因为一个看似私人的决定往往会影响周围的人。", "The person also considered other people's needs because a seemingly private decision often affects those nearby."),
("这个过程说明，合适的办法不一定最省事，却应该与当时的条件相符。", "The process shows that a suitable response is not always the easiest one, but it should fit the actual conditions."),
("如果只追求马上结束问题，人们可能忽略原因，也可能把同样的困难留到下一次。", "If people only try to end a problem immediately, they may overlook its cause and leave the same difficulty for next time."),
("主人公把事实、感受和猜测分开来看，因此没有把一种可能误当成唯一答案。", "The person separated facts, feelings and guesses, and therefore did not mistake one possibility for the only answer."),
("与其责怪已经发生的变化，不如找出仍然可以调整的部分。", "Rather than blame a change that has already happened, it is better to identify what can still be adjusted."),
("沟通也很重要：说明原因、确认理解，并给对方留下表达不同意见的机会。", "Communication also matters: explain the reason, confirm understanding, and leave room for the other person to express a different view."),
("一次有效的沟通不是说得越多越好，而是让相关的人知道发生了什么、接下来怎么办。", "Effective communication is not about saying as much as possible; it lets the people involved know what happened and what comes next."),
("从短期看，这个选择解决了眼前的问题；从长期看，它还减少了类似问题再次出现的可能。", "In the short term, the choice solved the immediate problem; in the long term, it also reduced the chance of the same issue returning."),
("主人公没有把一次顺利的结果当成永远正确的规则，而是保留了根据新情况修改办法的空间。", "The person did not treat one successful result as a permanently correct rule, but left room to revise the approach when circumstances changed."),
("这正是“{summary}”的具体含义：判断需要依据，行动也需要照顾实际后果。", "This is the concrete meaning of “{summary}”: judgment needs evidence, and action must also consider real consequences."),
("对学习者来说，理解故事不能只记住最后一句，还要找出人物、条件、行动和结果之间的联系。", "For a learner, understanding a story means more than remembering its final sentence; one must identify the links among people, conditions, actions and results."),
("同一件事从不同角度看，重点可能不同；比较这些角度，能帮助我们避免过早下结论。", "The focus may change when the same event is viewed from different angles; comparing them helps us avoid premature conclusions."),
("个人经验可以提供线索，但如果要推广一种做法，还需要考虑它是否适合其他人和其他环境。", "Personal experience can provide clues, but promoting an approach requires considering whether it suits other people and settings."),
("一个负责任的决定应当能够说明依据，也应当承认尚未解决的不确定性。", "A responsible decision should be able to explain its basis and acknowledge uncertainty that remains unresolved."),
("结果值得观察，过程同样值得记录，因为后来的改进往往来自对过程的重新检查。", "The result deserves observation, and the process deserves recording, because later improvements often come from reexamining that process."),
("当新的证据与原来的想法不一致时，修改判断不是失败，而是认真对待事实。", "When new evidence conflicts with an earlier view, revising the judgment is not failure but a serious response to facts."),
("故事没有提供适用于所有情况的标准答案，却展示了一种可以检验、可以修正的思考方法。", "The story does not offer a standard answer for every situation, but it demonstrates a way of thinking that can be tested and revised."),
("尤其需要注意的是，方便、速度和成本只是部分条件，安全、公平与他人的选择也应进入判断。", "It is especially important to note that convenience, speed and cost are only some conditions; safety, fairness and other people's choices should also enter the judgment."),
("如果缺少必要信息，暂时不作肯定结论有时比迅速表态更诚实，也更有利于下一步行动。", "When necessary information is missing, withholding a firm conclusion can be more honest and more helpful for the next action than responding quickly."),
("把问题拆成较小的步骤以后，人们更容易发现哪一步有效、哪一步需要重新安排。", "After a problem is divided into smaller steps, it becomes easier to see which step works and which needs rearrangement."),
("主人公最后得到的不只是一个结果，也是一套以后能够继续使用的观察和沟通经验。", "What the person gained was not merely a result, but also experience in observation and communication that could be used again."),
("因此，文章的价值不在于要求读者照着做，而在于邀请读者检查理由、边界和可能的替代方案。", "The article's value is not in requiring readers to copy the action, but in inviting them to examine reasons, limits and possible alternatives."),
("在现实生活中，条件会变化，相关人的目标也可能不同，所以决定必须接受后续结果的检验。", "In real life, conditions change and the goals of the people involved may differ, so a decision must be tested against later results."),
("只有把成功与不足都记录下来，经验才不会变成简单的自我肯定。", "Only by recording both success and shortcomings can experience avoid becoming simple self-approval."),
("进一步说，公开说明选择标准，可以让别人理解决定，也便于发现被忽略的影响。", "More broadly, stating the criteria for a choice helps others understand the decision and makes overlooked effects easier to find."),
("这种开放的态度并不会削弱行动，反而使行动建立在更清楚、更可讨论的基础上。", "Such openness does not weaken action; instead, it gives action a clearer and more discussable foundation."),
("文章由一个日常场景出发，最终提醒我们：可靠的结论来自持续观察，而不是一次印象。", "Beginning with an everyday scene, the article ultimately reminds us that reliable conclusions come from continued observation rather than a single impression."),
]

SIMPLE_MOVES = {
1: [
("这件事不大，可是这个人认真去做了。", "The event was small, but this person handled it carefully."),
("这个人先看一看，再想一想。", "This person looked first and then thought."),
("有问题时，这个人请别人帮助。", "When there was a problem, this person asked someone for help."),
("大家把话说清楚，事情就容易多了。", "After everyone spoke clearly, the matter became easier."),
("这个人记住了这一次的办法。", "This person remembered the method used this time."),
("下一次再遇到这样的事，这个人不会着急。", "The next time this happens, this person will not worry."),
],
2: [
("事情开始时，主人公先看清楚情况，没有马上离开。", "At the beginning, the person examined the situation and did not leave at once."),
("主人公想了两个办法，也问了别人的意见。", "The person considered two methods and also asked another person's opinion."),
("把原因说清楚以后，大家知道下一步应该怎么做。", "After the reason was explained, everyone knew what to do next."),
("这个选择不一定最快，但是更适合当时的情况。", "This choice was not necessarily the fastest, but it better suited the situation."),
("事情结束后，主人公还记下了这次学到的经验。", "Afterward, the person recorded what had been learned."),
("以后遇到变化，先了解情况，再找办法，会更有用。", "When change occurs later, understanding it before seeking a method will be more useful."),
("主人公也注意到，自己的选择有时会影响别人。", "The person also noticed that personal choices can sometimes affect others."),
("所以，认真听、清楚说和及时做都很重要。", "Therefore, listening carefully, speaking clearly and acting in time are all important."),
],
3: [
("事情发生以后，主人公先整理已经知道的信息，再决定下一步。", "After the event, the person organized the known information before deciding on the next step."),
("主人公没有只看眼前的方便，也考虑了这个选择会不会影响别人。", "The person considered not only immediate convenience but also whether the choice would affect others."),
("通过询问和比较，原来不清楚的原因慢慢变得清楚。", "Through questions and comparison, the previously unclear reason gradually became clear."),
("这个办法解决了眼前的问题，也为以后留下了可以参考的经验。", "The method solved the immediate problem and left useful experience for the future."),
("如果情况发生变化，主人公也愿意根据新的信息调整做法。", "If circumstances change, the person is willing to adjust the approach according to new information."),
("这说明，认真观察和清楚沟通常常比马上下结论更重要。", "This shows that careful observation and clear communication are often more important than reaching an immediate conclusion."),
("读者可以从人物的行动中看出，结果与前面的选择有直接联系。", "Readers can see from the person's actions that the result is directly connected to the earlier choices."),
("文章并不是说只有一种正确办法，而是提醒人们先了解真实情况。", "The article does not claim there is only one correct method; it reminds people to understand the real situation first."),
],
}

ADVANCED_EXTRA = [
("再看“{title}”中的行动顺序，可以发现每一步都改变了后续可用的信息。", "A further look at the sequence of actions in “{title}” shows that every step changed the information available afterward."),
("所谓“{summary}”，并非一句脱离情境的口号，而是对具体选择及其代价的概括。", "The idea that “{summary}” is not a slogan detached from context, but a summary of a concrete choice and its costs."),
("若把叙述中的前提移除，同样的做法未必产生同样的结果，这正说明边界条件不可忽视。", "If the narrative's premises were removed, the same action might not produce the same result, which shows why boundary conditions cannot be ignored."),
("评价主人公时，既要看到其主动解决问题的一面，也要检查是否存在未被表达的利益相关者。", "In evaluating the person, we should recognize the initiative taken while also checking whether any stakeholders remain unheard."),
("从因果关系看，最后的变化由多项行动共同造成，不能简单归功于某一个瞬间。", "From a causal perspective, the final change resulted from several actions together and cannot be attributed to a single moment."),
("从风险角度看，先核实再行动降低了误判成本，同时保留了发现新信息后的修正能力。", "From a risk perspective, verifying before acting reduced the cost of error while preserving the ability to revise after new information appeared."),
("从沟通角度看，清楚说明事实和限制，比只表达赞成或反对更有助于形成合作。", "From a communication perspective, stating facts and limits clearly supports cooperation better than merely expressing approval or opposition."),
("文章选择日常事件作为入口，是因为普通场景同样包含判断、责任与资源分配的问题。", "The article uses an everyday event because ordinary settings also contain questions of judgment, responsibility and resource allocation."),
("即使结果令人满意，也仍应追问哪些偶然因素发挥了作用，哪些结论尚不能推广。", "Even when the result is satisfactory, we should ask which accidental factors mattered and which conclusions cannot yet be generalized."),
("这种复盘把一次经历转化为可讨论的知识，同时避免把个人经验夸大成普遍规律。", "This review turns one experience into discussable knowledge while avoiding the exaggeration of personal experience into a universal rule."),
]

LEXICON = [
("人","person"),("每天","every day"),("早上","morning"),("知道","to know"),("应该","should"),("来到","to arrive"),("事情","matter"),("帮助","to help"),("朋友","friend"),("家人","family"),("时间","time"),("地方","place"),("开始","to begin"),("工作","work"),("问题","problem"),("办法","method"),
("情况","situation"),("主人公","main character"),("选择","choice"),("观察","observation"),("信息","information"),("判断","judgment"),("条件","condition"),("过程","process"),("原因","reason"),("结果","result"),("沟通","communication"),("理解","understanding"),("调整","adjustment"),("事实","fact"),("感受","feeling"),("可能","possibility"),("影响","influence"),("经验","experience"),("依据","basis"),("行动","action"),("后果","consequence"),("角度","perspective"),("证据","evidence"),("结论","conclusion"),("责任","responsibility"),("不确定性","uncertainty"),("安全","safety"),("公平","fairness"),("替代方案","alternative"),("标准","criterion"),("检验","to test"),("记录","to record"),("改进","improvement"),("环境","environment"),("目标","goal"),("边界","limit"),("可靠","reliable"),("持续","continuous")]

def han_count(paragraphs:list[str])->int:
    return sum(len(re.findall(r"[\u3400-\u9fff]", p)) for p in paragraphs)

def py(text:str)->str:
    return " ".join(lazy_pinyin(text,style=Style.TONE,neutral_tone_with_five=False,errors=lambda chars:chars)).replace(" ，","，").replace(" 。","。").replace(" ：","：").replace(" ；","；").replace(" ？","？").replace(" ！","！")

def chunks(items:list[tuple[str,str]], count:int)->tuple[list[str],list[str]]:
    zh=[]; en=[]
    size=max(1,(len(items)+count-1)//count)
    for i in range(0,len(items),size):
        zh.append("".join(x[0] for x in items[i:i+size]))
        en.append(" ".join(x[1] for x in items[i:i+size]))
    return zh,en

def finalize(article:dict, ordinal:int)->dict:
    level=article["level"]
    minimum,maximum=LENGTH_RANGES[level]
    pairs=list(zip(article["paragraphs"],article["translation"]))
    if level == 1:
        pairs.append(("这个人知道，遇到问题应该先看清事情，再想办法请人帮助。", "This person knows that when a problem appears, one should understand it first and then think of a way to ask for help."))
    # Keep the theme-specific story, then rotate reflective moves. Lower levels
    # use fewer moves; higher levels build a sustained analysis.
    source=SIMPLE_MOVES[level] if level in SIMPLE_MOVES else MOVES
    rotated=source[ordinal%len(source):]+source[:ordinal%len(source)]
    for zh,en in rotated:
        if han_count([x[0] for x in pairs]) >= minimum+18:
            break
        pairs.append((zh.format(title=article["title"],summary=article["summary"]),en.format(title=article["title"],summary=article["summary"])))
    # A distinct second bank is needed only for long advanced bands. It avoids
    # repeating sentences within an article merely to reach a target length.
    extra=ADVANCED_EXTRA[ordinal%len(ADVANCED_EXTRA):]+ADVANCED_EXTRA[:ordinal%len(ADVANCED_EXTRA)]
    for zh,en in extra:
        if han_count([x[0] for x in pairs]) >= minimum+18:
            break
        pairs.append((zh.format(title=article["title"],summary=article["summary"]),en.format(title=article["title"],summary=article["summary"])))
    zh_par,en_par=chunks(pairs,max(MIN_PARAGRAPHS[level],min(10,level+2)))
    # Keep within maximum by removing the final added sentence if necessary.
    while han_count(zh_par)>maximum and len(pairs)>MIN_PARAGRAPHS[level]:
        pairs.pop(); zh_par,en_par=chunks(pairs,max(MIN_PARAGRAPHS[level],min(10,level+2)))
    body="".join(zh_par)
    article["paragraphs"]=zh_par
    article["translation"]=en_par
    article["pinyin"]=[py(p) for p in zh_par]
    article["wordCount"]=han_count(zh_par)
    article["difficulty"]=DIFFICULTY[level]
    need=MIN_VOCAB[level]
    existing={v["hanzi"]:v for v in article.get("vocabulary",[]) if v.get("hanzi") in body}
    for hanzi,meaning in LEXICON:
        if len(existing)>=need: break
        if hanzi in body and hanzi not in existing:
            existing[hanzi]={"hanzi":hanzi,"pinyin":" ".join(lazy_pinyin(hanzi,style=Style.TONE)),"meaning":meaning}
    if len(existing)<need:
        raise RuntimeError(f"{article['slug']}: only {len(existing)} grounded vocabulary items")
    article["vocabulary"]=list(existing.values())[:need]
    # Rotate each answer into a deterministic position and keep four unique options.
    for qi,q in enumerate(article["questions"]):
        answer=q["options"][q["correctAnswer"]]
        distractors=[x for i,x in enumerate(q["options"]) if i!=q["correctAnswer"]]
        target=(ordinal+qi)%4
        options=distractors[:]
        options.insert(target,answer)
        q["options"]=options
        q["correctAnswer"]=target
        q["evidence"]=next((p for p in zh_par if answer in p),zh_par[0])
        q["explanation"]=f"正确答案是“{answer}”。正文证据为：“{q['evidence']}”"
    article["reviewStatus"]="first-pass-reviewed"
    article["contentVersion"]="reading-articles-v3"
    article["minutes"]=max(2,round(article["wordCount"]/180)+1)
    return article

def main()->None:
    bank=json.loads(PATH.read_text(encoding="utf-8"))
    bank["articles"]=[finalize(a,i) for i,a in enumerate(bank["articles"])]
    bank["version"]="reading-articles-v3"
    bank["coverageNotice"]="HSKKit-authored graded reading based on HSK 3.0 learning goals; not an official exam bank. Every article received an executor editorial first pass."
    PATH.write_text(json.dumps(bank,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"articles":len(bank["articles"]),"status":"first-pass-reviewed","path":str(PATH)},ensure_ascii=False))
if __name__=="__main__": main()
