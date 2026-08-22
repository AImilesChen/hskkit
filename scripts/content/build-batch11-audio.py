#!/usr/bin/env python3
import asyncio, hashlib, json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/audio/practice"
MANIFEST = ROOT / "src/lib/practice/audio-assets.json"
VOICE = "zh-CN-XiaoxiaoNeural"
TEXTS = {
"level-1-1":"请给我一杯水，谢谢。","level-1-2":"我叫李明，今年十八岁，是学生。",
"level-2-1":"老师让我们练习发音，明天上课前要练习三遍。","level-2-2":"今天比昨天冷，你出门的时候别忘了带外套。",
"level-3-1":"每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。","level-3-2":"会议改到下午三点，地点还是二楼会议室，请大家提前十分钟到。",
"level-4-1":"各位乘客请注意，开往上海的列车晚点二十分钟，新的检票时间是九点十分。","level-4-2":"我已经把修改后的合同发到你的邮箱，请在今天下班前确认金额和日期。",
"level-5-1":"调查结果显示，多数用户喜欢新的搜索方式，但希望保留旧版筛选条件作为备用。","level-5-2":"由于原材料价格上涨，本季度成本增加了百分之八，不过交付时间没有受到影响。",
"level-6-1":"专家提醒，相关性并不等于因果关系，在获得更多实验数据之前，不应把初步发现写成确定结论。","level-6-2":"谈判暂时没有达成最终协议，不过双方同意继续交换资料，并在两周后举行下一轮会议。",
"advanced-7-9-1":"委员会认可试点取得的阶段性进展，但认为样本范围仍然有限，建议扩大观察周期后再决定是否全面推广。","advanced-7-9-2":"表面上看，两个方案的平均收益相近，然而第二个方案的波动更大，对资源不足的参与者而言风险也更高。",
}

async def make(key, text):
    path = OUT / f"batch11-{key.replace('-', '-', 0).rsplit('-', 1)[0]}-listening-{key.rsplit('-', 1)[1]}.mp3"
    # Advanced band key needs to preserve advanced-7-9 before the final ordinal.
    if key.startswith("advanced-7-9-"):
        path = OUT / f"batch11-advanced-7-9-listening-{key.rsplit('-', 1)[1]}.mp3"
    await edge_tts.Communicate(text, VOICE, rate="-8%").save(str(path))
    return {
      "id": f"hsk3.practice.audio.{key}.v1",
      "storageKey": str(path.relative_to(ROOT / "public")),
      "text": text,
      "version": 1,
      "checksumSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
      "source": {"name":"HSKKit-authored Batch 11 listening script synthesized for HSKKit","url":"https://hskkit.com/content-license"},
      "authorization": {"status":"authorized","license":"HSKKit streaming audio license v1","evidenceUrl":"https://hskkit.com/content-license"},
      "qaStatus":"approved",
      "lifecycleStatus":"published",
    }

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    assets=[]
    for key,text in TEXTS.items():
        assets.append(await make(key,text))
    MANIFEST.write_text(json.dumps({"version":"hskkit-practice-audio-v1","assets":assets},ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({"count":len(assets),"manifest":str(MANIFEST)},ensure_ascii=False))

asyncio.run(main())
