"""Pin and align licensed 2025 HSK 2–3 example sentences to HSKKit IDs.

Run from the repository root. Review overrides when the upstream sentence uses
the characters in a different word or a different pronunciation.
"""

import hashlib
import json
import pathlib
import unicodedata
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = "https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-{}.json"
SHA256 = {
    2: "dff888ef810c6192e3489cfcf1f404040091d81a0d58037258aab91253e7330d",
    3: "938681b32d476967675979b761e1e55cbe07df0fc107a946b4a7eedf539fb6d0",
}

# Original HSKKit editorial replacements for upstream examples that teach a
# different lexical sense, contain the target only inside another word, or
# pronounce it differently from the active HSKKit entry.
OVERRIDES = {
    "hsk2025.word.l2.0305.v1": ("请帮我开门。", "Qǐng bāng wǒ kāi mén.", "Please help me open the door."),
    "hsk2025.word.l2.0307.v1": ("请把礼物包起来。", "Qǐng bǎ lǐwù bāo qǐlai.", "Please wrap the gift."),
    "hsk2025.word.l2.0309.v1": ("今天比昨天冷。", "Jīntiān bǐ zuótiān lěng.", "Today is colder than yesterday."),
    "hsk2025.word.l2.0310.v1": ("我的笔在桌子上。", "Wǒ de bǐ zài zhuōzi shang.", "My pen is on the table."),
    "hsk2025.word.l2.0314.v1": ("这条路很长。", "Zhè tiáo lù hěn cháng.", "This road is long."),
    "hsk2025.word.l2.0333.v1": ("他高兴地笑了。", "Tā gāoxìng de xiào le.", "He laughed happily."),
    "hsk2025.word.l2.0347.v1": ("过马路时要小心。", "Guò mǎlù shí yào xiǎoxīn.", "Be careful when crossing the road."),
    "hsk2025.word.l2.0351.v1": ("我去过北京。", "Wǒ qù guo Běijīng.", "I have been to Beijing."),
    "hsk2025.word.l2.0357.v1": ("我花了十分钟做这道题。", "Wǒ huā le shí fēnzhōng zuò zhè dào tí.", "I spent ten minutes on this question."),
    "hsk2025.word.l2.0340.v1": ("小鸟在天上飞。", "Xiǎoniǎo zài tiānshang fēi.", "A bird is flying in the sky."),
    "hsk2025.word.l2.0441.v1": ("我喜欢踢足球。", "Wǒ xǐhuan tī zúqiú.", "I like playing football."),
    "hsk2025.word.l2.0456.v1": ("我先洗手。", "Wǒ xiān xǐ shǒu.", "I will wash my hands first."),
    "hsk2025.word.l2.0462.v1": ("我小时候住在北京。", "Wǒ xiǎoshíhou zhù zài Běijīng.", "I lived in Beijing as a child."),
    "hsk2025.word.l2.0468.v1": ("请按时吃药。", "Qǐng ànshí chī yào.", "Please take your medicine on time."),
    "hsk2025.word.l2.0427.v1": ("请上去看看。", "Qǐng shàngqù kànkan.", "Please go up and take a look."),
    "hsk2025.word.l2.0491.v1": ("他正忙着写作业。", "Tā zhèng máng zhe xiě zuòyè.", "He is busy doing homework right now."),
    "hsk2025.word.l2.0410.v1": ("那个男孩儿在跑步。", "Nàge nánháir zài pǎobù.", "The boy is running."),
    "hsk2025.word.l2.0461.v1": ("小孩儿在公园里玩。", "Xiǎoháir zài gōngyuán lǐ wán.", "The child is playing in the park."),
    "hsk2025.word.l2.0471.v1": ("请等我一会儿。", "Qǐng děng wǒ yíhuìr.", "Please wait for me a moment."),
    "hsk2025.word.l2.0490.v1": ("门开着。", "Mén kāi zhe.", "The door is open."),
    "hsk2025.word.l3.0541.v1": ("我们的想法不同。", "Wǒmen de xiǎngfǎ bù tóng.", "Our ideas differ."),
    "hsk2025.word.l3.0575.v1": ("这两个房间大小一样。", "Zhè liǎng gè fángjiān dàxiǎo yíyàng.", "These two rooms are the same size."),
    "hsk2025.word.l3.0583.v1": ("这次比赛，他得了第一名。", "Zhè cì bǐsài, tā dé le dì yī míng.", "He came first in this match."),
    "hsk2025.word.l3.0654.v1": ("他们的关系很好。", "Tāmen de guānxì hěn hǎo.", "They have a good relationship."),
    "hsk2025.word.l3.0678.v1": ("我明天还书。", "Wǒ míngtiān huán shū.", "I will return the book tomorrow."),
    "hsk2025.word.l3.0685.v1": ("你可以坐车或走路。", "Nǐ kěyǐ zuò chē huò zǒulù.", "You can go by car or walk."),
    "hsk2025.word.l3.0744.v1": ("这件衣服是蓝的。", "Zhè jiàn yīfu shì lán de.", "This piece of clothing is blue."),
    "hsk2025.word.l3.0789.v1": ("孩子正往树上爬。", "Háizi zhèng wǎng shù shang pá.", "The child is climbing the tree."),
    "hsk2025.word.l3.0808.v1": ("我今天生病了，想请假。", "Wǒ jīntiān shēng bìng le, xiǎng qǐngjià.", "I am ill today and want to take leave."),
    "hsk2025.word.l3.0908.v1": ("这个办法行。", "Zhège bànfǎ xíng.", "This solution will work."),
    "hsk2025.word.l3.0588.v1": ("请把灯打开。", "Qǐng bǎ dēng dǎkāi.", "Please turn on the light."),
    "hsk2025.word.l3.0913.v1": ("请从这三本书里选一本。", "Qǐng cóng zhè sān běn shū lǐ xuǎn yì běn.", "Please choose one of these three books."),
    "hsk2025.word.l3.0985.v1": ("这个决定很重要。", "Zhège juédìng hěn zhòngyào.", "This decision is important."),
}


OVERRIDES.update({
    "hsk2025.word.l2.0316.v1": ("火车一进一出。", "Huǒchē yí jìn yì chū.", "Trains go in and out."),
    "hsk2025.word.l2.0326.v1": ("这个字写错了。", "Zhège zì xiě cuò le.", "This character is written incorrectly."),
    "hsk2025.word.l2.0330.v1": ("我想去，但今天没时间。", "Wǒ xiǎng qù, dàn jīntiān méi shíjiān.", "I want to go, but I don't have time today."),
    "hsk2025.word.l2.0332.v1": ("他说得很清楚。", "Tā shuō de hěn qīngchu.", "He spoke very clearly."),
    "hsk2025.word.l2.0376.v1": ("我现在就去。", "Wǒ xiànzài jiù qù.", "I will go right now."),
    "hsk2025.word.l2.0392.v1": ("这条路很宽。", "Zhè tiáo lù hěn kuān.", "This road is wide."),
    "hsk2025.word.l2.0397.v1": ("请慢一点儿说。", "Qǐng màn yìdiǎnr shuō.", "Please speak more slowly."),
    "hsk2025.word.l2.0404.v1": ("班里有三十名学生。", "Bān lǐ yǒu sānshí míng xuéshēng.", "There are thirty students in the class."),
    "hsk2025.word.l2.0414.v1": ("他每天早上跑五公里。", "Tā měitiān zǎoshang pǎo wǔ gōnglǐ.", "He runs five kilometers every morning."),
    "hsk2025.word.l2.0449.v1": ("这里有一万人。", "Zhèlǐ yǒu yí wàn gè rén.", "There are ten thousand people here."),
    "hsk2025.word.l2.0485.v1": ("我每天都运动。", "Wǒ měitiān dōu yùndòng.", "I exercise every day."),
    "hsk2025.word.l3.0551.v1": ("他的中文还很差。", "Tā de Zhōngwén hái hěn chà.", "His Chinese is still poor."),
    "hsk2025.word.l3.0578.v1": ("请带上你的书。", "Qǐng dài shang nǐ de shū.", "Please bring your book."),
    "hsk2025.word.l3.0589.v1": ("孩子们坐在地上。", "Háizimen zuò zài dì shang.", "The children are sitting on the ground."),
    "hsk2025.word.l3.0593.v1": ("这台机器用电。", "Zhè tái jīqì yòng diàn.", "This machine uses electricity."),
    "hsk2025.word.l3.0597.v1": ("从东到西要走一天。", "Cóng dōng dào xī yào zǒu yì tiān.", "It takes a day to walk from east to west."),
    "hsk2025.word.l3.0663.v1": ("这里有好多书。", "Zhèlǐ yǒu hǎoduō shū.", "There are many books here."),
    "hsk2025.word.l3.0691.v1": ("别急，我们还有时间。", "Bié jí, wǒmen hái yǒu shíjiān.", "Don't rush; we still have time."),
    "hsk2025.word.l3.0692.v1": ("请把地址记在本子上。", "Qǐng bǎ dìzhǐ jì zài běnzi shang.", "Please write down the address in your notebook."),
    "hsk2025.word.l3.0731.v1": ("此事可办。", "Cǐ shì kě bàn.", "This matter can be handled."),
    "hsk2025.word.l3.0828.v1": ("门外传来一声响。", "Mén wài chuán lái yì shēng xiǎng.", "A sound came from outside the door."),
    "hsk2025.word.l3.0844.v1": ("他在刷牙。", "Tā zài shuā yá.", "He is brushing his teeth."),
    "hsk2025.word.l3.0880.v1": ("从东到西要走一天。", "Cóng dōng dào xī yào zǒu yì tiān.", "It takes a day to walk from east to west."),
    "hsk2025.word.l3.0896.v1": ("我带了相机去旅行。", "Wǒ dài le xiàngjī qù lǚxíng.", "I brought a camera on the trip."),
    "hsk2025.word.l3.0941.v1": ("我用笔写字。", "Wǒ yòng bǐ xiě zì.", "I write with a pen."),
    "hsk2025.word.l3.0955.v1": ("园里有很多花。", "Yuán lǐ yǒu hěn duō huā.", "There are many flowers in the garden."),
    "hsk2025.word.l3.0958.v1": ("跑得越快越好。", "Pǎo de yuè kuài yuè hǎo.", "The faster you run, the better."),
    "hsk2025.word.l3.0975.v1": ("我只要一杯水。", "Wǒ zhǐ yào yì bēi shuǐ.", "I only want a glass of water."),
    "hsk2025.word.l3.0976.v1": ("我需要一张纸。", "Wǒ xūyào yì zhāng zhǐ.", "I need a sheet of paper."),
    "hsk2025.word.l3.0979.v1": ("只要你愿意，就可以参加。", "Zhǐyào nǐ yuànyì, jiù kěyǐ cānjiā.", "As long as you want to, you can join."),
})


def untoned(value: str) -> str:
    return "".join(character for character in unicodedata.normalize("NFD", value.lower())
                   if "a" <= character <= "z")


def load_source(level: int) -> dict:
    raw = urllib.request.urlopen(SOURCE.format(level), timeout=30).read()
    assert hashlib.sha256(raw).hexdigest() == SHA256[level], "upstream source changed; review before importing"
    source = json.loads(raw)
    assert source["license"].startswith("CC BY-SA 4.0")
    assert len(source["data"]) == (200 if level == 2 else 500)
    return source


def main() -> None:
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))["words"]
    entries = {}
    for level in (2, 3):
        source = load_source(level)
        by_hanzi = {}
        for entry in source["data"]:
            by_hanzi.setdefault(entry["hanzi"], []).append(entry)
        rows = [row for row in catalog if row[3] == str(level)]
        assert len(rows) == len(source["data"])
        for row in rows:
            asset_id, hanzi, reading = row[0], row[4], row[6]
            candidates = by_hanzi[hanzi]
            original = next((entry for entry in candidates if entry["pinyin"] == reading), candidates[0])
            example = OVERRIDES.get(asset_id) or (original["exampleChinese"], original["examplePinyin"], original["exampleEnglish"])
            assert hanzi in example[0], f"{asset_id}: headword missing"
            assert untoned(reading.split("/")[0]) in untoned(example[1]), f"{asset_id}: reading missing"
            assert all(example), f"{asset_id}: incomplete sentence"
            entries[asset_id] = example
    assert len(entries) == 700
    path = ROOT / "src/lib/learning/hsk23-2025-examples.json"
    path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} examples to {path}")


if __name__ == "__main__":
    main()
