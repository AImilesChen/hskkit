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


OVERRIDES.update({
    "hsk2025.word.l2.0304.v1": ("我们班有二十个学生。", "Wǒmen bān yǒu èrshí gè xuésheng.", "There are twenty students in our class."),
    "hsk2025.word.l2.0319.v1": ("出门前请关灯。", "Chūmén qián qǐng guān dēng.", "Please turn off the light before going out."),
    "hsk2025.word.l2.0321.v1": ("床上有一本书。", "Chuáng shang yǒu yì běn shū.", "There is a book on the bed."),
    "hsk2025.word.l2.0336.v1": ("我想点一杯茶。", "Wǒ xiǎng diǎn yì bēi chá.", "I would like to order a cup of tea."),
    "hsk2025.word.l2.0338.v1": ("这张桌子动了。", "Zhè zhāng zhuōzi dòng le.", "This table moved."),
    "hsk2025.word.l2.0352.v1": ("你想喝茶还是咖啡？", "Nǐ xiǎng hē chá háishi kāfēi?", "Would you like tea or coffee?"),
    "hsk2025.word.l2.0358.v1": ("桌上有一朵花。", "Zhuō shang yǒu yì duǒ huā.", "There is a flower on the table."),
    "hsk2025.word.l2.0359.v1": ("她喜欢画画。", "Tā xǐhuan huà huà.", "She likes to draw."),
    "hsk2025.word.l2.0366.v1": ("这是一间教室。", "Zhè shì yì jiān jiàoshì.", "This is a classroom."),
    "hsk2025.word.l2.0372.v1": ("请进来坐。", "Qǐng jìnlái zuò.", "Please come in and sit down."),
    "hsk2025.word.l2.0375.v1": ("我们住在这家酒店。", "Wǒmen zhù zài zhè jiā jiǔdiàn.", "We are staying at this hotel."),
    "hsk2025.word.l2.0379.v1": ("下周一开学。", "Xià zhōuyī kāixué.", "School starts next Monday."),
    "hsk2025.word.l2.0380.v1": ("明天要考汉语。", "Míngtiān yào kǎo Hànyǔ.", "We have a Chinese exam tomorrow."),
    "hsk2025.word.l2.0403.v1": ("请看前面。", "Qǐng kàn qiánmiàn.", "Please look ahead."),
    "hsk2025.word.l2.0420.v1": ("雨停了，天晴了。", "Yǔ tíng le, tiān qíng le.", "The rain has stopped and the sky has cleared."),
    "hsk2025.word.l2.0425.v1": ("请上来。", "Qǐng shànglái.", "Please come up."),
    "hsk2025.word.l2.0426.v1": ("书在桌子上面。", "Shū zài zhuōzi shàngmiàn.", "The book is on the table."),
    "hsk2025.word.l2.0431.v1": ("我来时他正在看书。", "Wǒ lái shí tā zhèngzài kàn shū.", "He was reading when I arrived."),
    "hsk2025.word.l2.0433.v1": ("请把手洗干净。", "Qǐng bǎ shǒu xǐ gānjìng.", "Please wash your hands."),
    "hsk2025.word.l2.0437.v1": ("我送你到车站。", "Wǒ sòng nǐ dào chēzhàn.", "I'll take you to the station."),
    "hsk2025.word.l2.0438.v1": ("虽然下雨了，但我们还是去了。", "Suīrán xià yǔ le, dàn wǒmen háishi qù le.", "Although it rained, we still went."),
    "hsk2025.word.l2.0442.v1": ("这道题很难。", "Zhè dào tí hěn nán.", "This question is difficult."),
    "hsk2025.word.l2.0443.v1": ("河里有一条鱼。", "Hé lǐ yǒu yì tiáo yú.", "There is a fish in the river."),
    "hsk2025.word.l2.0445.v1": ("我的头很疼。", "Wǒ de tóu hěn téng.", "My head hurts."),
    "hsk2025.word.l2.0453.v1": ("这位老师很亲切。", "Zhè wèi lǎoshī hěn qīnqiè.", "This teacher is very kind."),
    "hsk2025.word.l2.0476.v1": ("我没去，因为我生病了。", "Wǒ méi qù, yīnwèi wǒ shēng bìng le.", "I didn't go because I was ill."),
    "hsk2025.word.l2.0477.v1": ("鱼在水里游。", "Yú zài shuǐ lǐ yóu.", "The fish is swimming in the water."),
    "hsk2025.word.l2.0486.v1": ("下一站是北京。", "Xià yí zhàn shì Běijīng.", "The next stop is Beijing."),
    "hsk2025.word.l2.0493.v1": ("我在准备考试。", "Wǒ zài zhǔnbèi kǎoshì.", "I am preparing for an exam."),
    "hsk2025.word.l2.0495.v1": ("我们走吧。", "Wǒmen zǒu ba.", "Let's go."),
    "hsk2025.word.l2.0498.v1": ("这是我最喜欢的书。", "Zhè shì wǒ zuì xǐhuan de shū.", "This is my favorite book."),
    "hsk2025.word.l2.0499.v1": ("请往左走。", "Qǐng wǎng zuǒ zǒu.", "Please go left."),
})


OVERRIDES.update({
    "hsk2025.word.l3.0510.v1": ("这件事我来办。", "Zhè jiàn shì wǒ lái bàn.", "I will handle this matter."),
    "hsk2025.word.l3.0515.v1": ("我吃饱了。", "Wǒ chī bǎo le.", "I am full."),
    "hsk2025.word.l3.0517.v1": ("学校在城北。", "Xuéxiào zài chéng běi.", "The school is in the north of the city."),
    "hsk2025.word.l3.0519.v1": ("我的书被弟弟拿走了。", "Wǒ de shū bèi dìdi ná zǒu le.", "My book was taken by my younger brother."),
    "hsk2025.word.l3.0521.v1": ("请比较这两张照片。", "Qǐng bǐjiào zhè liǎng zhāng zhàopiàn.", "Please compare these two photos."),
    "hsk2025.word.l3.0525.v1": ("明天必须交作业。", "Míngtiān bìxū jiāo zuòyè.", "The homework must be handed in tomorrow."),
    "hsk2025.word.l3.0527.v1": ("我把这篇文章读了两遍。", "Wǒ bǎ zhè piān wénzhāng dú le liǎng biàn.", "I read this article twice."),
    "hsk2025.word.l3.0530.v1": ("孩子们在台上表演。", "Háizimen zài tái shang biǎoyǎn.", "The children are performing on stage."),
    "hsk2025.word.l3.0534.v1": ("杯子里有冰。", "Bēizi lǐ yǒu bīng.", "There is ice in the cup."),
    "hsk2025.word.l3.0549.v1": ("我住在三层。", "Wǒ zhù zài sān céng.", "I live on the third floor."),
    "hsk2025.word.l3.0550.v1": ("我上网查了这个词。", "Wǒ shàngwǎng chá le zhège cí.", "I looked up this word online."),
    "hsk2025.word.l3.0554.v1": ("我常去图书馆。", "Wǒ cháng qù túshūguǎn.", "I often go to the library."),
    "hsk2025.word.l3.0571.v1": ("我每天打扫房间。", "Wǒ měitiān dǎsǎo fángjiān.", "I clean my room every day."),
    "hsk2025.word.l3.0582.v1": ("公园里到处都是花。", "Gōngyuán lǐ dàochù dōu shì huā.", "There are flowers everywhere in the park."),
    "hsk2025.word.l3.0584.v1": ("我得到了老师的帮助。", "Wǒ dédào le lǎoshī de bāngzhù.", "I received help from my teacher."),
    "hsk2025.word.l3.0586.v1": ("你有时间的话，给我打电话。", "Nǐ yǒu shíjiān dehuà, gěi wǒ dǎ diànhuà.", "If you have time, call me."),
    "hsk2025.word.l3.0598.v1": ("他家在城市的东北。", "Tā jiā zài chéngshì de dōngběi.", "His home is in the northeast of the city."),
    "hsk2025.word.l3.0599.v1": ("太阳从东方升起。", "Tàiyáng cóng dōngfāng shēngqǐ.", "The sun rises in the east."),
})


OVERRIDES.update({
    "hsk2025.word.l3.0605.v1": ("这条裙子太短了。", "Zhè tiáo qúnzi tài duǎn le.", "This skirt is too short."),
    "hsk2025.word.l3.0607.v1": ("这段路很安静。", "Zhè duàn lù hěn ānjìng.", "This stretch of road is quiet."),
    "hsk2025.word.l3.0614.v1": ("请发一封邮件。", "Qǐng fā yì fēng yóujiàn.", "Please send an email."),
    "hsk2025.word.l3.0617.v1": ("我发现了一个错误。", "Wǒ fāxiàn le yí gè cuòwù.", "I found a mistake."),
    "hsk2025.word.l3.0618.v1": ("这个城市发展得很快。", "Zhège chéngshì fāzhǎn de hěn kuài.", "This city is developing quickly."),
    "hsk2025.word.l3.0621.v1": ("这个方法很简单。", "Zhège fāngfǎ hěn jiǎndān.", "This method is simple."),
    "hsk2025.word.l3.0624.v1": ("请把书放在桌上。", "Qǐng bǎ shū fàng zài zhuō shang.", "Please put the book on the table."),
    "hsk2025.word.l3.0626.v1": ("请放心，我会来。", "Qǐng fàngxīn, wǒ huì lái.", "Don't worry, I'll come."),
    "hsk2025.word.l3.0632.v1": ("这家饭馆的服务很好。", "Zhè jiā fànguǎn de fúwù hěn hǎo.", "The service at this restaurant is good."),
    "hsk2025.word.l3.0635.v1": ("今天该复习了。", "Jīntiān gāi fùxí le.", "It's time to review today."),
    "hsk2025.word.l3.0641.v1": ("我刚到家。", "Wǒ gāng dào jiā.", "I just got home."),
    "hsk2025.word.l3.0645.v1": ("根据天气预报，明天会下雨。", "Gēnjù tiānqì yùbào, míngtiān huì xià yǔ.", "According to the forecast, it will rain tomorrow."),
    "hsk2025.word.l3.0650.v1": ("妈妈给我讲了一个故事。", "Māma gěi wǒ jiǎng le yí gè gùshi.", "Mom told me a story."),
    "hsk2025.word.l3.0652.v1": ("请关上门。", "Qǐng guān shang mén.", "Please close the door."),
    "hsk2025.word.l3.0656.v1": ("关于这件事，我们明天再谈。", "Guānyú zhè jiàn shì, wǒmen míngtiān zài tán.", "Let's talk about this matter tomorrow."),
    "hsk2025.word.l3.0657.v1": ("请关注这个问题。", "Qǐng guānzhù zhège wèntí.", "Please pay attention to this issue."),
    "hsk2025.word.l3.0670.v1": ("红绿灯在前面。", "Hónglǜdēng zài qiánmiàn.", "The traffic light is ahead."),
    "hsk2025.word.l3.0679.v1": ("这里的环境很安静。", "Zhèlǐ de huánjìng hěn ānjìng.", "The environment here is quiet."),
    "hsk2025.word.l3.0683.v1": ("我们下午开会。", "Wǒmen xiàwǔ kāi huì.", "We will have a meeting this afternoon."),
    "hsk2025.word.l3.0684.v1": ("会议三点开始。", "Huìyì sān diǎn kāishǐ.", "The meeting starts at three."),
    "hsk2025.word.l3.0687.v1": ("这只鸡很大。", "Zhè zhī jī hěn dà.", "This chicken is big."),
    "hsk2025.word.l3.0693.v1": ("春季天气很好。", "Chūnjì tiānqì hěn hǎo.", "The weather is nice in spring."),
    "hsk2025.word.l3.0695.v1": ("请再加一点水。", "Qǐng zài jiā yìdiǎn shuǐ.", "Please add a little more water."),
    "hsk2025.word.l3.0697.v1": ("每天坚持练习很重要。", "Měitiān jiānchí liànxí hěn zhòngyào.", "It is important to keep practicing every day."),
    "hsk2025.word.l3.0698.v1": ("老师在检查作业。", "Lǎoshī zài jiǎnchá zuòyè.", "The teacher is checking homework."),
})


OVERRIDES.update({
    "hsk2025.word.l3.0703.v1": ("老师在讲一个故事。", "Lǎoshī zài jiǎng yí gè gùshi.", "The teacher is telling a story."),
    "hsk2025.word.l3.0704.v1": ("这个角有九十度。", "Zhège jiǎo yǒu jiǔshí dù.", "This angle is ninety degrees."),
    "hsk2025.word.l3.0705.v1": ("我的脚很疼。", "Wǒ de jiǎo hěn téng.", "My foot hurts."),
    "hsk2025.word.l3.0708.v1": ("今天有两节课。", "Jīntiān yǒu liǎng jié kè.", "We have two lessons today."),
    "hsk2025.word.l3.0713.v1": ("我们一起解决这个问题。", "Wǒmen yìqǐ jiějué zhège wèntí.", "Let's solve this problem together."),
    "hsk2025.word.l3.0715.v1": ("我可以借你的书吗？", "Wǒ kěyǐ jiè nǐ de shū ma?", "May I borrow your book?"),
    "hsk2025.word.l3.0721.v1": ("这辆车很旧。", "Zhè liàng chē hěn jiù.", "This car is old."),
    "hsk2025.word.l3.0723.v1": ("请读这个句子。", "Qǐng dú zhège jùzi.", "Please read this sentence."),
    "hsk2025.word.l3.0734.v1": ("我想去，可是没时间。", "Wǒ xiǎng qù, kěshì méi shíjiān.", "I want to go, but I don't have time."),
    "hsk2025.word.l3.0735.v1": ("现在三点一刻。", "Xiànzài sān diǎn yí kè.", "It is quarter past three."),
    "hsk2025.word.l3.0738.v1": ("请先读课文。", "Qǐng xiān dú kèwén.", "Please read the lesson text first."),
    "hsk2025.word.l3.0742.v1": ("我买了一瓶矿泉水。", "Wǒ mǎi le yì píng kuàngquánshuǐ.", "I bought a bottle of mineral water."),
    "hsk2025.word.l3.0745.v1": ("我的爷爷老了。", "Wǒ de yéye lǎo le.", "My grandfather has grown old."),
    "hsk2025.word.l3.0750.v1": ("请把脸洗干净。", "Qǐng bǎ liǎn xǐ gānjìng.", "Please wash your face."),
    "hsk2025.word.l3.0751.v1": ("我每天练汉字。", "Wǒ měitiān liàn Hànzì.", "I practice writing Chinese characters every day."),
    "hsk2025.word.l3.0755.v1": ("我想和你聊一聊。", "Wǒ xiǎng hé nǐ liáo yì liáo.", "I would like to chat with you."),
    "hsk2025.word.l3.0761.v1": ("请走楼梯上去。", "Qǐng zǒu lóutī shàngqù.", "Please take the stairs up."),
    "hsk2025.word.l3.0764.v1": ("这匹马跑得很快。", "Zhè pǐ mǎ pǎo de hěn kuài.", "This horse runs very fast."),
    "hsk2025.word.l3.0768.v1": ("这只猫的毛很软。", "Zhè zhī māo de máo hěn ruǎn.", "This cat's fur is soft."),
    "hsk2025.word.l3.0769.v1": ("这条路有三百米长。", "Zhè tiáo lù yǒu sānbǎi mǐ cháng.", "This road is three hundred meters long."),
    "hsk2025.word.l3.0770.v1": ("老师站在我面前。", "Lǎoshī zhàn zài wǒ miànqián.", "The teacher is standing in front of me."),
    "hsk2025.word.l3.0774.v1": ("学校在城市的南边。", "Xuéxiào zài chéngshì de nánbian.", "The school is in the south of the city."),
    "hsk2025.word.l3.0783.v1": ("我妹妹上三年级。", "Wǒ mèimei shàng sān niánjí.", "My younger sister is in third grade."),
    "hsk2025.word.l3.0785.v1": ("这头牛在吃草。", "Zhè tóu niú zài chī cǎo.", "This cow is eating grass."),
})


OVERRIDES.update({
    "hsk2025.word.l3.0801.v1": ("他每天六点起。", "Tā měitiān liù diǎn qǐ.", "He gets up at six every day."),
    "hsk2025.word.l3.0811.v1": ("他们在球场上踢球。", "Tāmen zài qiúchǎng shang tī qiú.", "They are playing ball on the sports field."),
    "hsk2025.word.l3.0814.v1": ("她热情地欢迎我们。", "Tā rèqíng de huānyíng wǒmen.", "She warmly welcomed us."),
    "hsk2025.word.l3.0817.v1": ("请认真听老师说。", "Qǐng rènzhēn tīng lǎoshī shuō.", "Please listen carefully to the teacher."),
    "hsk2025.word.l3.0818.v1": ("这道题很容易。", "Zhè dào tí hěn róngyì.", "This question is easy."),
    "hsk2025.word.l3.0823.v1": ("这座山很高。", "Zhè zuò shān hěn gāo.", "This mountain is high."),
    "hsk2025.word.l3.0824.v1": ("这件上衣是蓝色的。", "Zhè jiàn shàngyī shì lánsè de.", "This jacket is blue."),
    "hsk2025.word.l3.0829.v1": ("我喜欢这里的生活。", "Wǒ xǐhuan zhèlǐ de shēnghuó.", "I like life here."),
    "hsk2025.word.l3.0831.v1": ("我听到了你的声音。", "Wǒ tīng dào le nǐ de shēngyīn.", "I heard your voice."),
    "hsk2025.word.l3.0832.v1": ("这个市有很多公园。", "Zhège shì yǒu hěn duō gōngyuán.", "This city has many parks."),
    "hsk2025.word.l3.0833.v1": ("我想试一下。", "Wǒ xiǎng shì yíxià.", "I want to try it."),
    "hsk2025.word.l3.0834.v1": ("这是一间会议室。", "Zhè shì yì jiān huìyìshì.", "This is a meeting room."),
    "hsk2025.word.l3.0835.v1": ("世界很大。", "Shìjiè hěn dà.", "The world is big."),
    "hsk2025.word.l3.0836.v1": ("请收下这份礼物。", "Qǐng shōu xià zhè fèn lǐwù.", "Please accept this gift."),
    "hsk2025.word.l3.0838.v1": ("他受到了很多帮助。", "Tā shòu dào le hěn duō bāngzhù.", "He received a lot of help."),
    "hsk2025.word.l3.0839.v1": ("他最近瘦了。", "Tā zuìjìn shòu le.", "He has lost weight recently."),
    "hsk2025.word.l3.0845.v1": ("我买了一双鞋。", "Wǒ mǎi le yì shuāng xié.", "I bought a pair of shoes."),
    "hsk2025.word.l3.0850.v1": ("请加一点糖。", "Qǐng jiā yìdiǎn táng.", "Please add a little sugar."),
    "hsk2025.word.l3.0856.v1": ("孩子们在跳。", "Háizimen zài tiào.", "The children are jumping."),
    "hsk2025.word.l3.0858.v1": ("这本书挺有意思。", "Zhè běn shū tǐng yǒu yìsi.", "This book is quite interesting."),
    "hsk2025.word.l3.0864.v1": ("我的腿很疼。", "Wǒ de tuǐ hěn téng.", "My leg hurts."),
    "hsk2025.word.l3.0869.v1": ("桌上有两个碗。", "Zhuō shang yǒu liǎng gè wǎn.", "There are two bowls on the table."),
    "hsk2025.word.l3.0870.v1": ("火车晚点了。", "Huǒchē wǎndiǎn le.", "The train is delayed."),
    "hsk2025.word.l3.0875.v1": ("这是为你准备的。", "Zhè shì wèi nǐ zhǔnbèi de.", "This was prepared for you."),
    "hsk2025.word.l3.0882.v1": ("很多西方学生学汉语。", "Hěn duō xīfāng xuésheng xué Hànyǔ.", "Many Western students study Chinese."),
    "hsk2025.word.l3.0883.v1": ("这个西瓜很甜。", "Zhège xīguā hěn tián.", "This watermelon is sweet."),
    "hsk2025.word.l3.0893.v1": ("请把箱子放在这里。", "Qǐng bǎ xiāngzi fàng zài zhèlǐ.", "Please put the box here."),
    "hsk2025.word.l3.0894.v1": ("你应该向老师问好。", "Nǐ yīnggāi xiàng lǎoshī wènhǎo.", "You should greet the teacher."),
    "hsk2025.word.l3.0897.v1": ("我住在这个小区。", "Wǒ zhù zài zhège xiǎoqū.", "I live in this housing estate."),
    "hsk2025.word.l3.0900.v1": ("校长正在开会。", "Xiàozhǎng zhèngzài kāi huì.", "The principal is in a meeting."),
})

OVERRIDES.update({
    "hsk2025.word.l3.0906.v1": ("我给朋友写了一封信。", "Wǒ gěi péngyou xiě le yì fēng xìn.", "I wrote a letter to a friend."),
    "hsk2025.word.l3.0914.v1": ("你可以选择茶或者咖啡。", "Nǐ kěyǐ xuǎnzé chá huòzhě kāfēi.", "You can choose tea or coffee."),
    "hsk2025.word.l3.0916.v1": ("我的牙有点疼。", "Wǒ de yá yǒudiǎn téng.", "My tooth hurts a little."),
    "hsk2025.word.l3.0918.v1": ("山上有很多羊。", "Shān shang yǒu hěn duō yáng.", "There are many sheep on the mountain."),
    "hsk2025.word.l3.0925.v1": ("这两件衣服的颜色一样。", "Zhè liǎng jiàn yīfu de yánsè yíyàng.", "These two pieces of clothing are the same color."),
    "hsk2025.word.l3.0928.v1": ("六岁以上的孩子可以参加。", "Liù suì yǐshàng de háizi kěyǐ cānjiā.", "Children aged six and above can take part."),
    "hsk2025.word.l3.0929.v1": ("除了周末以外，我每天都去学校。", "Chúle zhōumò yǐwài, wǒ měitiān dōu qù xuéxiào.", "Except for weekends, I go to school every day."),
    "hsk2025.word.l3.0940.v1": ("下雨会影响我们的计划。", "Xià yǔ huì yǐngxiǎng wǒmen de jìhuà.", "Rain will affect our plans."),
    "hsk2025.word.l3.0946.v1": ("我想看一本有关中国历史的书。", "Wǒ xiǎng kàn yì běn yǒuguān Zhōngguó lìshǐ de shū.", "I want to read a book about Chinese history."),
    "hsk2025.word.l3.0956.v1": ("那位服务员很热情。", "Nà wèi fúwùyuán hěn rèqíng.", "That server is very welcoming."),
    "hsk2025.word.l3.0959.v1": ("今晚的月亮很亮。", "Jīnwǎn de yuèliang hěn liàng.", "The moon is bright tonight."),
    "hsk2025.word.l3.0963.v1": ("我的鞋脏了。", "Wǒ de xié zāng le.", "My shoes are dirty."),
    "hsk2025.word.l3.0973.v1": ("我们在公园照相。", "Wǒmen zài gōngyuán zhàoxiàng.", "We are taking photos in the park."),
    "hsk2025.word.l3.0974.v1": ("我们一直等，直到他回来。", "Wǒmen yìzhí děng, zhídào tā huílái.", "We waited until he came back."),
    "hsk2025.word.l3.0981.v1": ("书中有一张照片。", "Shū zhōng yǒu yì zhāng zhàopiàn.", "There is a photo in the book."),
    "hsk2025.word.l3.0986.v1": ("这个周末我们去爬山。", "Zhège zhōumò wǒmen qù pá shān.", "We are going hiking this weekend."),
    "hsk2025.word.l3.0987.v1": ("今天的主要任务是复习。", "Jīntiān de zhǔyào rènwu shì fùxí.", "Today's main task is review."),
    "hsk2025.word.l3.0993.v1": ("我们总共买了三张票。", "Wǒmen zǒnggòng mǎi le sān zhāng piào.", "We bought three tickets in total."),
    "hsk2025.word.l3.0995.v1": ("他张开嘴说话。", "Tā zhāng kāi zuǐ shuōhuà.", "He opens his mouth to speak."),
    "hsk2025.word.l3.1000.v1": ("我做完了今天的作业。", "Wǒ zuò wán le jīntiān de zuòyè.", "I finished today's homework."),
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
