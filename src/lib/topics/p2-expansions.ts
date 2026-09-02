import type { LearningTopic } from "./catalog";

type TopicP2Expansion = Pick<LearningTopic, "description" | "learningGoal" | "wordAssetIds" | "featuredWordAssetIds" | "estimatedMinutes" | "lessons" | "contentVersion">;

export const p2TopicExpansions: Record<string, TopicP2Expansion> = {
  "restaurant-basics": {
    "description": "Move from reading a menu to ordering, checking flavours and paying for a complete restaurant visit.",
    "learningGoal": "Order a meal, ask about flavour and tableware, and complete payment in Chinese.",
    "wordAssetIds": [
      "hsk3.word.l5.0076.v1",
      "hsk3.word.l1.0100.v1",
      "hsk3.word.l2.0047.v1",
      "hsk3.word.l2.0170.v1",
      "hsk3.word.l3.0869.v1",
      "hsk3.word.l1.0035.v1",
      "hsk3.word.l1.0242.v1",
      "hsk3.word.l1.0244.v1",
      "hsk3.word.l1.0310.v1",
      "hsk3.word.l2.0689.v1",
      "hsk3.word.l2.0250.v1",
      "hsk3.word.l1.0164.v1",
      "hsk3.word.l3.0697.v1",
      "hsk3.word.l4.0197.v1",
      "hsk3.word.l2.0573.v1",
      "hsk3.word.l4.0455.v1",
      "hsk3.word.l3.0707.v1",
      "hsk3.word.l4.0687.v1",
      "hsk3.word.l4.0793.v1",
      "hsk3.word.l1.0096.v1",
      "hsk3.word.l2.0013.v1",
      "hsk3.word.l2.0333.v1",
      "hsk3.word.l6.0718.v1",
      "hsk3.word.l2.0564.v1",
      "hsk3.word.l4.0549.v1",
      "hsk3.word.l1.0018.v1",
      "hsk3.word.l5.0905.v1",
      "hsk3.word.l1.0036.v1",
      "hsk3.word.l2.0301.v1",
      "hsk3.word.l7.1207.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l2.0047.v1",
      "hsk3.word.l2.0573.v1",
      "hsk3.word.l7.1207.v1"
    ],
    "estimatedMinutes": 24,
    "lessons": [
      {
        "id": "restaurant-basics.read-and-order",
        "title": "Read and order",
        "titleZh": "看菜单点餐",
        "outcome": "Find a restaurant, understand the menu and request a complete main dish.",
        "wordAssetIds": [
          "hsk3.word.l5.0076.v1",
          "hsk3.word.l1.0100.v1",
          "hsk3.word.l2.0047.v1",
          "hsk3.word.l2.0170.v1",
          "hsk3.word.l3.0869.v1",
          "hsk3.word.l1.0035.v1",
          "hsk3.word.l1.0242.v1",
          "hsk3.word.l1.0244.v1",
          "hsk3.word.l1.0310.v1",
          "hsk3.word.l2.0689.v1"
        ],
        "expressions": [
          {
            "hanzi": "这家餐厅有中文菜单吗？",
            "pinyin": "Zhè jiā cāntīng yǒu Zhōngwén càidān ma?",
            "meaning": "Does this restaurant have a Chinese menu?"
          },
          {
            "hanzi": "我要一碗米饭和一盘菜。",
            "pinyin": "Wǒ yào yì wǎn mǐfàn hé yì pán cài.",
            "meaning": "I would like a bowl of rice and a dish."
          },
          {
            "hanzi": "请服务员推荐一道鱼。",
            "pinyin": "Qǐng fúwùyuán tuījiàn yí dào yú.",
            "meaning": "Ask the server to recommend a fish dish."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "您好，请问几位？",
            "pinyin": "Nínhǎo, qǐngwèn jǐ wèi?",
            "meaning": "Hello, how many people?"
          },
          {
            "speaker": "B",
            "hanzi": "两位。请给我们看看菜单。",
            "pinyin": "Liǎng wèi. Qǐng gěi wǒmen kànkan càidān.",
            "meaning": "Two. Please let us see the menu."
          },
          {
            "speaker": "A",
            "hanzi": "今天有鸡肉、鱼和面条。",
            "pinyin": "Jīntiān yǒu jīròu, yú hé miàntiáo.",
            "meaning": "Today we have chicken, fish and noodles."
          },
          {
            "speaker": "B",
            "hanzi": "我要鱼、米饭，再来一碗汤。",
            "pinyin": "Wǒ yào yú, mǐfàn, zài lái yì wǎn tāng.",
            "meaning": "I want fish, rice and a bowl of soup."
          }
        ],
        "task": {
          "title": "Order a balanced meal",
          "scenario": "You are seated in a busy restaurant and must order food for two people.",
          "successCriteria": [
            "Ask for the menu politely.",
            "Order one staple and two dishes.",
            "Confirm what the server heard."
          ]
        }
      },
      {
        "id": "restaurant-basics.taste-and-adjust",
        "title": "Taste and adjust",
        "titleZh": "说明口味",
        "outcome": "Describe flavour and ask for a dish to be adjusted before eating.",
        "wordAssetIds": [
          "hsk3.word.l2.0250.v1",
          "hsk3.word.l1.0164.v1",
          "hsk3.word.l3.0697.v1",
          "hsk3.word.l4.0197.v1",
          "hsk3.word.l2.0573.v1",
          "hsk3.word.l4.0455.v1",
          "hsk3.word.l3.0707.v1",
          "hsk3.word.l4.0687.v1",
          "hsk3.word.l4.0793.v1",
          "hsk3.word.l1.0096.v1"
        ],
        "expressions": [
          {
            "hanzi": "这个汤的味道有点儿咸。",
            "pinyin": "Zhège tāng de wèidào yǒudiǎnr xián.",
            "meaning": "This soup tastes a little salty."
          },
          {
            "hanzi": "我能吃辣，但是不要太辣。",
            "pinyin": "Wǒ néng chī là, dànshì bú yào tài là.",
            "meaning": "I can eat spicy food, but not too spicy."
          },
          {
            "hanzi": "这个豆腐酸酸甜甜的。",
            "pinyin": "Zhège dòufu suānsuān-tiántián de.",
            "meaning": "This tofu tastes sweet and sour."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "这个菜辣吗？",
            "pinyin": "Zhège cài là ma?",
            "meaning": "Is this dish spicy?"
          },
          {
            "speaker": "B",
            "hanzi": "有一点儿辣，也有一点儿甜。",
            "pinyin": "Yǒu yìdiǎnr là, yě yǒu yìdiǎnr tián.",
            "meaning": "It is a little spicy and a little sweet."
          },
          {
            "speaker": "A",
            "hanzi": "我不吃太咸的，能少放盐吗？",
            "pinyin": "Wǒ bù chī tài xián de, néng shǎo fàng yán ma?",
            "meaning": "I do not eat very salty food; can you use less salt?"
          },
          {
            "speaker": "B",
            "hanzi": "可以，我帮您告诉厨房。",
            "pinyin": "Kěyǐ, wǒ bāng nín gàosu chúfáng.",
            "meaning": "Yes, I will tell the kitchen for you."
          }
        ],
        "task": {
          "title": "Handle a flavour request",
          "scenario": "One dish is too salty and your friend cannot eat very spicy food.",
          "successCriteria": [
            "Describe the problem precisely.",
            "Ask for one adjustment politely.",
            "Confirm the adjusted dish is acceptable."
          ]
        }
      },
      {
        "id": "restaurant-basics.table-and-payment",
        "title": "Table and payment",
        "titleZh": "餐具与付款",
        "outcome": "Request missing tableware, finish the meal and pay the bill.",
        "wordAssetIds": [
          "hsk3.word.l2.0013.v1",
          "hsk3.word.l2.0333.v1",
          "hsk3.word.l6.0718.v1",
          "hsk3.word.l2.0564.v1",
          "hsk3.word.l4.0549.v1",
          "hsk3.word.l1.0018.v1",
          "hsk3.word.l5.0905.v1",
          "hsk3.word.l1.0036.v1",
          "hsk3.word.l2.0301.v1",
          "hsk3.word.l7.1207.v1"
        ],
        "expressions": [
          {
            "hanzi": "请给我一双筷子和一个勺。",
            "pinyin": "Qǐng gěi wǒ yì shuāng kuàizi hé yí ge sháo.",
            "meaning": "Please give me chopsticks and a spoon."
          },
          {
            "hanzi": "再来两个杯子和一壶茶。",
            "pinyin": "Zài lái liǎng ge bēizi hé yì hú chá.",
            "meaning": "Please bring two more cups and a pot of tea."
          },
          {
            "hanzi": "我们吃饱了，现在可以付款吗？",
            "pinyin": "Wǒmen chī bǎo le, xiànzài kěyǐ fùkuǎn ma?",
            "meaning": "We are full; can we pay now?"
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "服务员，我们少一个碗。",
            "pinyin": "Fúwùyuán, wǒmen shǎo yí ge wǎn.",
            "meaning": "Server, we are missing a bowl."
          },
          {
            "speaker": "B",
            "hanzi": "好的，我再拿一个碗和一双筷子。",
            "pinyin": "Hǎo de, wǒ zài ná yí ge wǎn hé yì shuāng kuàizi.",
            "meaning": "Okay, I will bring a bowl and chopsticks."
          },
          {
            "speaker": "A",
            "hanzi": "谢谢。我们还要两杯茶。",
            "pinyin": "Xièxie. Wǒmen hái yào liǎng bēi chá.",
            "meaning": "Thank you. We also want two cups of tea."
          },
          {
            "speaker": "B",
            "hanzi": "没问题。吃完以后可以在前台付款。",
            "pinyin": "Méi wèntí. Chī wán yǐhòu kěyǐ zài qiántái fùkuǎn.",
            "meaning": "No problem. After eating, you can pay at the counter."
          }
        ],
        "task": {
          "title": "Complete the restaurant visit",
          "scenario": "Your table is missing utensils and the group is ready to pay.",
          "successCriteria": [
            "Request the exact missing items.",
            "Say the meal is finished.",
            "Ask where and how to pay."
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "cooking-at-home": {
    "description": "Prepare ingredients, follow safe cooking steps and serve a simple home-cooked meal.",
    "learningGoal": "Explain ingredients, cooking actions and the order of a basic recipe in Chinese.",
    "wordAssetIds": [
      "hsk3.word.l2.0772.v1",
      "hsk3.word.l5.0129.v1",
      "hsk3.word.l5.0307.v1",
      "hsk3.word.l5.0203.v1",
      "hsk3.word.l3.0141.v1",
      "hsk3.word.l4.0581.v1",
      "hsk3.word.l1.0386.v1",
      "hsk3.word.l6.0114.v1",
      "hsk3.word.l6.1097.v1",
      "hsk3.word.l7.2371.v1",
      "hsk3.word.l5.0365.v1",
      "hsk3.word.l2.0681.v1",
      "hsk3.word.l4.0850.v1",
      "hsk3.word.l3.0698.v1",
      "hsk3.word.l6.0173.v1",
      "hsk3.word.l6.0433.v1",
      "hsk3.word.l4.0060.v1",
      "hsk3.word.l7.0308.v1",
      "hsk3.word.l1.0035.v1",
      "hsk3.word.l1.0164.v1",
      "hsk3.word.l5.0808.v1",
      "hsk3.word.l1.0310.v1",
      "hsk3.word.l2.0689.v1",
      "hsk3.word.l4.0197.v1",
      "hsk3.word.l2.0564.v1",
      "hsk3.word.l4.0549.v1",
      "hsk3.word.l3.0311.v1",
      "hsk3.word.l2.0500.v1",
      "hsk3.word.l1.0486.v1",
      "hsk3.word.l1.0494.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l2.0772.v1",
      "hsk3.word.l4.0581.v1",
      "hsk3.word.l6.0114.v1"
    ],
    "estimatedMinutes": 24,
    "lessons": [
      {
        "id": "cooking-at-home.prepare-ingredients",
        "title": "Prepare ingredients",
        "titleZh": "准备食材",
        "outcome": "Gather equipment and prepare vegetables, eggs and meat safely.",
        "wordAssetIds": [
          "hsk3.word.l2.0772.v1",
          "hsk3.word.l5.0129.v1",
          "hsk3.word.l5.0307.v1",
          "hsk3.word.l5.0203.v1",
          "hsk3.word.l3.0141.v1",
          "hsk3.word.l4.0581.v1",
          "hsk3.word.l1.0386.v1",
          "hsk3.word.l6.0114.v1",
          "hsk3.word.l6.1097.v1",
          "hsk3.word.l7.2371.v1"
        ],
        "expressions": [
          {
            "hanzi": "先把材料放在厨房里。",
            "pinyin": "Xiān bǎ cáiliào fàng zài chúfáng lǐ.",
            "meaning": "First put the ingredients in the kitchen."
          },
          {
            "hanzi": "洗好西红柿以后再用刀切。",
            "pinyin": "Xǐ hǎo xīhóngshì yǐhòu zài yòng dāo qiē.",
            "meaning": "Wash the tomatoes before cutting them with a knife."
          },
          {
            "hanzi": "电饭锅里要放米和水。",
            "pinyin": "Diànfànguō lǐ yào fàng mǐ hé shuǐ.",
            "meaning": "Put rice and water in the rice cooker."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "今天我们做什么饭？",
            "pinyin": "Jīntiān wǒmen zuò shénme fàn?",
            "meaning": "What are we cooking today?"
          },
          {
            "speaker": "B",
            "hanzi": "做西红柿炒鸡蛋，再做一条鱼。",
            "pinyin": "Zuò xīhóngshì chǎo jīdàn, zài zuò yì tiáo yú.",
            "meaning": "Tomato scrambled eggs and a fish."
          },
          {
            "speaker": "A",
            "hanzi": "我先洗菜，你来切肉，可以吗？",
            "pinyin": "Wǒ xiān xǐ cài, nǐ lái qiē ròu, kěyǐ ma?",
            "meaning": "I will wash vegetables first; can you cut the meat?"
          },
          {
            "speaker": "B",
            "hanzi": "可以，我也把锅准备好。",
            "pinyin": "Kěyǐ, wǒ yě bǎ guō zhǔnbèi hǎo.",
            "meaning": "Yes, I will also prepare the wok."
          }
        ],
        "task": {
          "title": "Prepare a safe work area",
          "scenario": "You and a friend are dividing the preparation for a two-dish meal.",
          "successCriteria": [
            "Name the dishes and ingredients.",
            "Assign washing and cutting tasks.",
            "Confirm the cookware is ready."
          ]
        }
      },
      {
        "id": "cooking-at-home.cook-with-heat",
        "title": "Cook with heat",
        "titleZh": "掌握火候",
        "outcome": "Choose a cooking method, control heat and season the food.",
        "wordAssetIds": [
          "hsk3.word.l5.0365.v1",
          "hsk3.word.l2.0681.v1",
          "hsk3.word.l4.0850.v1",
          "hsk3.word.l3.0698.v1",
          "hsk3.word.l6.0173.v1",
          "hsk3.word.l6.0433.v1",
          "hsk3.word.l4.0060.v1",
          "hsk3.word.l7.0308.v1",
          "hsk3.word.l1.0035.v1",
          "hsk3.word.l1.0164.v1"
        ],
        "expressions": [
          {
            "hanzi": "锅热了以后再放油。",
            "pinyin": "Guō rè le yǐhòu zài fàng yóu.",
            "meaning": "Add oil after the wok is hot."
          },
          {
            "hanzi": "炒菜时加一点儿盐和酱油。",
            "pinyin": "Chǎo cài shí jiā yìdiǎnr yán hé jiàngyóu.",
            "meaning": "Add a little salt and soy sauce while stir-frying."
          },
          {
            "hanzi": "汤要煮十分钟，肉要完全熟。",
            "pinyin": "Tāng yào zhǔ shí fēnzhōng, ròu yào wánquán shú.",
            "meaning": "Boil the soup for ten minutes and cook the meat fully."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "这个鱼怎么做？",
            "pinyin": "Zhège yú zěnme zuò?",
            "meaning": "How do we cook this fish?"
          },
          {
            "speaker": "B",
            "hanzi": "可以煮，也可以烤。",
            "pinyin": "Kěyǐ zhǔ, yě kěyǐ kǎo.",
            "meaning": "We can boil or roast it."
          },
          {
            "speaker": "A",
            "hanzi": "需要放醋和糖吗？",
            "pinyin": "Xūyào fàng cù hé táng ma?",
            "meaning": "Do we need vinegar and sugar?"
          },
          {
            "speaker": "B",
            "hanzi": "放一点儿醋，不放糖，最后加热两分钟。",
            "pinyin": "Fàng yìdiǎnr cù, bú fàng táng, zuìhòu jiārè liǎng fēnzhōng.",
            "meaning": "Add a little vinegar, no sugar, then heat for two minutes."
          }
        ],
        "task": {
          "title": "Follow the heat plan",
          "scenario": "You must explain how to cook a fish and season it safely.",
          "successCriteria": [
            "Choose one cooking method.",
            "State at least two seasonings.",
            "Give a clear cooking time or doneness check."
          ]
        }
      },
      {
        "id": "cooking-at-home.finish-and-serve",
        "title": "Finish and serve",
        "titleZh": "装盘上桌",
        "outcome": "Check doneness, plate the meal and explain the completed steps.",
        "wordAssetIds": [
          "hsk3.word.l5.0808.v1",
          "hsk3.word.l1.0310.v1",
          "hsk3.word.l2.0689.v1",
          "hsk3.word.l4.0197.v1",
          "hsk3.word.l2.0564.v1",
          "hsk3.word.l4.0549.v1",
          "hsk3.word.l3.0311.v1",
          "hsk3.word.l2.0500.v1",
          "hsk3.word.l1.0486.v1",
          "hsk3.word.l1.0494.v1"
        ],
        "expressions": [
          {
            "hanzi": "豆腐和鱼都熟了，可以关火。",
            "pinyin": "Dòufu hé yú dōu shú le, kěyǐ guān huǒ.",
            "meaning": "The tofu and fish are cooked; turn off the heat."
          },
          {
            "hanzi": "把菜放在盘子里，把汤盛到碗里。",
            "pinyin": "Bǎ cài fàng zài pánzi lǐ, bǎ tāng chéng dào wǎn lǐ.",
            "meaning": "Put the dish on a plate and the soup in a bowl."
          },
          {
            "hanzi": "最后尝一尝味道，再上桌。",
            "pinyin": "Zuìhòu cháng yì cháng wèidào, zài shàng zhuō.",
            "meaning": "Finally taste the food, then serve it."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "鸡蛋熟了吗？",
            "pinyin": "Jīdàn shú le ma?",
            "meaning": "Are the eggs cooked?"
          },
          {
            "speaker": "B",
            "hanzi": "熟了，我已经关火了。",
            "pinyin": "Shú le, wǒ yǐjīng guān huǒ le.",
            "meaning": "Yes, I have turned off the heat."
          },
          {
            "speaker": "A",
            "hanzi": "那我把菜放到盘子里。",
            "pinyin": "Nà wǒ bǎ cài fàng dào pánzi lǐ.",
            "meaning": "Then I will put the dish on a plate."
          },
          {
            "speaker": "B",
            "hanzi": "好，最后把米饭盛到碗里，我们就能吃了。",
            "pinyin": "Hǎo, zuìhòu bǎ mǐfàn chéng dào wǎn lǐ, wǒmen jiù néng chī le.",
            "meaning": "Okay, finally put rice in the bowls and we can eat."
          }
        ],
        "task": {
          "title": "Serve the finished meal",
          "scenario": "The cooking is done and you must safely finish and serve every item.",
          "successCriteria": [
            "Confirm the food is fully cooked.",
            "Turn off the heat.",
            "Plate the dishes and state the final step."
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "morning-routine": {
    "description": "Move through a complete weekday morning: wake up, get ready, eat breakfast and leave on time.",
    "learningGoal": "Describe a natural morning sequence, prepare for the day and explain how you travel to work or school.",
    "wordAssetIds": [
      "hsk3.word.l1.0459.v1",
      "hsk3.word.l1.0288.v1",
      "hsk3.word.l4.0537.v1",
      "hsk3.word.l1.0052.v1",
      "hsk3.word.l1.0348.v1",
      "hsk3.word.l1.0397.v1",
      "hsk3.word.l2.0459.v1",
      "hsk3.word.l1.0386.v1",
      "hsk3.word.l4.0672.v1",
      "hsk3.word.l2.0588.v1",
      "hsk3.word.l1.0051.v1",
      "hsk3.word.l1.0428.v1",
      "hsk3.word.l3.0424.v1",
      "hsk3.word.l2.0612.v1",
      "hsk3.word.l2.0706.v1",
      "hsk3.word.l1.0458.v1",
      "hsk3.word.l1.0046.v1",
      "hsk3.word.l1.0144.v1",
      "hsk3.word.l1.0486.v1",
      "hsk3.word.l1.0015.v1",
      "hsk3.word.l2.0071.v1",
      "hsk3.word.l2.0345.v1",
      "hsk3.word.l1.0316.v1",
      "hsk3.word.l1.0320.v1",
      "hsk3.word.l1.0421.v1",
      "hsk3.word.l2.0194.v1",
      "hsk3.word.l2.0188.v1",
      "hsk3.word.l2.0125.v1",
      "hsk3.word.l3.0143.v1",
      "hsk3.word.l4.0095.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l1.0288.v1",
      "hsk3.word.l1.0428.v1",
      "hsk3.word.l2.0345.v1"
    ],
    "estimatedMinutes": 45,
    "lessons": [
      {
        "id": "wake-and-wash",
        "title": "Wake up and wash",
        "titleZh": "起床洗漱",
        "outcome": "Wake up, say the order of washing actions and get ready without missing a step.",
        "wordAssetIds": [
          "hsk3.word.l1.0459.v1",
          "hsk3.word.l1.0288.v1",
          "hsk3.word.l4.0537.v1",
          "hsk3.word.l1.0052.v1",
          "hsk3.word.l1.0348.v1",
          "hsk3.word.l1.0397.v1",
          "hsk3.word.l2.0459.v1",
          "hsk3.word.l1.0386.v1",
          "hsk3.word.l4.0672.v1",
          "hsk3.word.l2.0588.v1"
        ],
        "expressions": [
          {
            "hanzi": "闹钟响了以后起床",
            "pinyin": "nào zhōng xiǎng le yǐ hòu qǐ chuáng",
            "meaning": "Get up after the alarm rings."
          },
          {
            "hanzi": "先洗脸，再刷牙",
            "pinyin": "xiān xǐ liǎn ， zài shuā yá",
            "meaning": "Wash your face first, then brush your teeth."
          },
          {
            "hanzi": "洗完澡以后穿衣服",
            "pinyin": "xǐ wán zǎo yǐ hòu chuān yī fú",
            "meaning": "Get dressed after taking a shower."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "闹钟响了吗？",
            "pinyin": "Nàozhōng xiǎng le ma?",
            "meaning": "Did the alarm ring?"
          },
          {
            "speaker": "B",
            "hanzi": "响了，我现在起床。",
            "pinyin": "Xiǎng le, wǒ xiànzài qǐchuáng.",
            "meaning": "Yes, I am getting up now."
          },
          {
            "speaker": "A",
            "hanzi": "你先洗澡还是先刷牙？",
            "pinyin": "Nǐ xiān xǐzǎo háishi xiān shuāyá?",
            "meaning": "Will you shower or brush your teeth first?"
          },
          {
            "speaker": "B",
            "hanzi": "我先刷牙，然后洗澡。",
            "pinyin": "Wǒ xiān shuāyá, ránhòu xǐzǎo.",
            "meaning": "I brush my teeth first, then shower."
          }
        ],
        "task": {
          "title": "Complete the wash-up routine",
          "scenario": "Your alarm has rung and you have limited time before breakfast. Explain the order in which you get up, wash and brush your teeth.",
          "successCriteria": [
            "Say when you get up",
            "Use 先 and 然后 to order two actions",
            "Confirm that washing is finished"
          ]
        }
      },
      {
        "id": "dress-and-eat",
        "title": "Dress and eat",
        "titleZh": "穿衣吃早饭",
        "outcome": "Choose suitable clothes, prepare your bag and finish a simple breakfast.",
        "wordAssetIds": [
          "hsk3.word.l1.0051.v1",
          "hsk3.word.l1.0428.v1",
          "hsk3.word.l3.0424.v1",
          "hsk3.word.l2.0612.v1",
          "hsk3.word.l2.0706.v1",
          "hsk3.word.l1.0458.v1",
          "hsk3.word.l1.0046.v1",
          "hsk3.word.l1.0144.v1",
          "hsk3.word.l1.0486.v1",
          "hsk3.word.l1.0015.v1"
        ],
        "expressions": [
          {
            "hanzi": "穿衣服和鞋",
            "pinyin": "chuān yī fú hé xié",
            "meaning": "Put on clothes and shoes."
          },
          {
            "hanzi": "准备上班的包",
            "pinyin": "zhǔn bèi shàng bān de bāo",
            "meaning": "Prepare the bag for work."
          },
          {
            "hanzi": "吃早饭，喝一杯水",
            "pinyin": "chī zǎo fàn ， hē yī bēi shuǐ",
            "meaning": "Eat breakfast and drink a glass of water."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "今天穿什么衣服？",
            "pinyin": "Jīntiān chuān shénme yīfu?",
            "meaning": "What clothes will you wear today?"
          },
          {
            "speaker": "B",
            "hanzi": "我穿这条裤子和这双鞋。",
            "pinyin": "Wǒ chuān zhè tiáo kùzi hé zhè shuāng xié.",
            "meaning": "I will wear these trousers and shoes."
          },
          {
            "speaker": "A",
            "hanzi": "你的包准备好了吗？",
            "pinyin": "Nǐ de bāo zhǔnbèi hǎo le ma?",
            "meaning": "Is your bag ready?"
          },
          {
            "speaker": "B",
            "hanzi": "准备好了，吃完早餐就出门。",
            "pinyin": "Zhǔnbèi hǎo le, chī wán zǎocān jiù chūmén.",
            "meaning": "Yes. I will leave after breakfast."
          }
        ],
        "task": {
          "title": "Get ready for the day",
          "scenario": "You need to choose clothes, pack what you need and eat before leaving. Tell a housemate what is ready and what remains.",
          "successCriteria": [
            "Name two items of clothing",
            "Say that your bag is ready",
            "State what you eat or drink for breakfast"
          ]
        }
      },
      {
        "id": "leave-on-time",
        "title": "Leave on time",
        "titleZh": "准时出门",
        "outcome": "Leave home, choose transport and reach work or school without being late.",
        "wordAssetIds": [
          "hsk3.word.l2.0071.v1",
          "hsk3.word.l2.0345.v1",
          "hsk3.word.l1.0316.v1",
          "hsk3.word.l1.0320.v1",
          "hsk3.word.l1.0421.v1",
          "hsk3.word.l2.0194.v1",
          "hsk3.word.l2.0188.v1",
          "hsk3.word.l2.0125.v1",
          "hsk3.word.l3.0143.v1",
          "hsk3.word.l4.0095.v1"
        ],
        "expressions": [
          {
            "hanzi": "八点出门上班",
            "pinyin": "bā diǎn chū mén shàng bān",
            "meaning": "Leave for work at eight."
          },
          {
            "hanzi": "坐地铁去公司",
            "pinyin": "zuò dì tiě qù gōng sī",
            "meaning": "Take the subway to the office."
          },
          {
            "hanzi": "准时到达学校",
            "pinyin": "zhǔn shí dào dá xué xiào",
            "meaning": "Arrive at school on time."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "你几点出门？",
            "pinyin": "Nǐ jǐ diǎn chūmén?",
            "meaning": "What time do you leave?"
          },
          {
            "speaker": "B",
            "hanzi": "我七点半离开家。",
            "pinyin": "Wǒ qī diǎn bàn líkāi jiā.",
            "meaning": "I leave home at seven thirty."
          },
          {
            "speaker": "A",
            "hanzi": "你坐公共汽车还是地铁？",
            "pinyin": "Nǐ zuò gōnggòng qìchē háishi dìtiě?",
            "meaning": "Do you take the bus or subway?"
          },
          {
            "speaker": "B",
            "hanzi": "我坐地铁去公司，不会迟到。",
            "pinyin": "Wǒ zuò dìtiě qù gōngsī, bú huì chídào.",
            "meaning": "I take the subway to the office and will not be late."
          }
        ],
        "task": {
          "title": "Plan the commute",
          "scenario": "You must reach work or school at a fixed time. Explain when you leave, which transport you take and when you arrive.",
          "successCriteria": [
            "Give a departure time",
            "Choose bus or subway",
            "Confirm you will arrive on time"
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "time-and-plans": {
    "description": "Turn dates and clock times into clear arrangements, then confirm, change or cancel a plan politely.",
    "learningGoal": "Propose a time, confirm an appointment and handle schedule changes in natural Chinese.",
    "wordAssetIds": [
      "hsk3.word.l1.0181.v1",
      "hsk3.word.l1.0248.v1",
      "hsk3.word.l1.0495.v1",
      "hsk3.word.l1.0322.v1",
      "hsk3.word.l1.0395.v1",
      "hsk3.word.l1.0374.v1",
      "hsk3.word.l1.0413.v1",
      "hsk3.word.l2.0743.v1",
      "hsk3.word.l1.0452.v1",
      "hsk3.word.l1.0273.v1",
      "hsk3.word.l1.0309.v1",
      "hsk3.word.l1.0334.v1",
      "hsk3.word.l1.0076.v1",
      "hsk3.word.l2.0167.v1",
      "hsk3.word.l1.0010.v1",
      "hsk3.word.l1.0333.v1",
      "hsk3.word.l2.0654.v1",
      "hsk3.word.l2.0653.v1",
      "hsk3.word.l1.0174.v1",
      "hsk3.word.l2.0157.v1",
      "hsk3.word.l2.0253.v1",
      "hsk3.word.l3.0002.v1",
      "hsk3.word.l4.0915.v1",
      "hsk3.word.l3.0408.v1",
      "hsk3.word.l3.0365.v1",
      "hsk3.word.l4.0984.v1",
      "hsk3.word.l4.0009.v1",
      "hsk3.word.l3.0700.v1",
      "hsk3.word.l4.0735.v1",
      "hsk3.word.l3.0572.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l1.0248.v1",
      "hsk3.word.l1.0334.v1",
      "hsk3.word.l3.0002.v1"
    ],
    "estimatedMinutes": 45,
    "lessons": [
      {
        "id": "choose-a-day",
        "title": "Choose a day",
        "titleZh": "选择日期",
        "outcome": "Use calendar words to identify a suitable day and part of the day.",
        "wordAssetIds": [
          "hsk3.word.l1.0181.v1",
          "hsk3.word.l1.0248.v1",
          "hsk3.word.l1.0495.v1",
          "hsk3.word.l1.0322.v1",
          "hsk3.word.l1.0395.v1",
          "hsk3.word.l1.0374.v1",
          "hsk3.word.l1.0413.v1",
          "hsk3.word.l2.0743.v1",
          "hsk3.word.l1.0452.v1",
          "hsk3.word.l1.0273.v1"
        ],
        "expressions": [
          {
            "hanzi": "今天上午",
            "pinyin": "jīn tiān shàng wǔ",
            "meaning": "This morning."
          },
          {
            "hanzi": "明天下午",
            "pinyin": "míng tiān xià wǔ",
            "meaning": "Tomorrow afternoon."
          },
          {
            "hanzi": "这个周末",
            "pinyin": "zhè ge zhōu mò",
            "meaning": "This weekend."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "你这个星期有时间吗？",
            "pinyin": "Nǐ zhège xīngqī yǒu shíjiān ma?",
            "meaning": "Do you have time this week?"
          },
          {
            "speaker": "B",
            "hanzi": "今天很忙，明天下午可以。",
            "pinyin": "Jīntiān hěn máng, míngtiān xiàwǔ kěyǐ.",
            "meaning": "Today is busy; tomorrow afternoon works."
          },
          {
            "speaker": "A",
            "hanzi": "周末呢？",
            "pinyin": "Zhōumò ne?",
            "meaning": "How about the weekend?"
          },
          {
            "speaker": "B",
            "hanzi": "周末晚上也可以。",
            "pinyin": "Zhōumò wǎnshang yě kěyǐ.",
            "meaning": "Weekend evening also works."
          }
        ],
        "task": {
          "title": "Find a shared day",
          "scenario": "Two people need to meet this week. Compare today, tomorrow and the weekend, then agree on a suitable part of the day.",
          "successCriteria": [
            "Mention at least two days",
            "Use 上午, 下午 or 晚上",
            "Agree on one shared option"
          ]
        }
      },
      {
        "id": "set-a-time",
        "title": "Set the time",
        "titleZh": "确定时间",
        "outcome": "State an exact time and confirm when and where to meet.",
        "wordAssetIds": [
          "hsk3.word.l1.0309.v1",
          "hsk3.word.l1.0334.v1",
          "hsk3.word.l1.0076.v1",
          "hsk3.word.l2.0167.v1",
          "hsk3.word.l1.0010.v1",
          "hsk3.word.l1.0333.v1",
          "hsk3.word.l2.0654.v1",
          "hsk3.word.l2.0653.v1",
          "hsk3.word.l1.0174.v1",
          "hsk3.word.l2.0157.v1"
        ],
        "expressions": [
          {
            "hanzi": "下午三点半",
            "pinyin": "xià wǔ sān diǎn bàn",
            "meaning": "Three thirty in the afternoon."
          },
          {
            "hanzi": "十分钟以后",
            "pinyin": "shí fēn zhōng yǐ hòu",
            "meaning": "Ten minutes later."
          },
          {
            "hanzi": "见面以前确认",
            "pinyin": "jiàn miàn yǐ qián què rèn",
            "meaning": "Confirm before meeting."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "明天什么时候见面方便？",
            "pinyin": "Míngtiān shénme shíhou jiànmiàn fāngbiàn?",
            "meaning": "When is it convenient to meet tomorrow?"
          },
          {
            "speaker": "B",
            "hanzi": "下午三点半方便。",
            "pinyin": "Xiàwǔ sān diǎn bàn fāngbiàn.",
            "meaning": "Three thirty in the afternoon is convenient."
          },
          {
            "speaker": "A",
            "hanzi": "那我们三点半在门口见。",
            "pinyin": "Nà wǒmen sān diǎn bàn zài ménkǒu jiàn.",
            "meaning": "Then let us meet at the entrance at three thirty."
          },
          {
            "speaker": "B",
            "hanzi": "好，我到以前给你消息。",
            "pinyin": "Hǎo, wǒ dào yǐqián gěi nǐ xiāoxi.",
            "meaning": "Okay, I will message before I arrive."
          }
        ],
        "task": {
          "title": "Confirm an appointment",
          "scenario": "You have selected a day but still need an exact meeting time. Agree on the hour and say what happens before arrival.",
          "successCriteria": [
            "Give an exact clock time",
            "Use 以前 or 以后",
            "Repeat the final arrangement"
          ]
        }
      },
      {
        "id": "change-the-plan",
        "title": "Change the plan",
        "titleZh": "调整安排",
        "outcome": "Explain a delay, propose a new time and confirm or cancel the appointment.",
        "wordAssetIds": [
          "hsk3.word.l2.0253.v1",
          "hsk3.word.l3.0002.v1",
          "hsk3.word.l4.0915.v1",
          "hsk3.word.l3.0408.v1",
          "hsk3.word.l3.0365.v1",
          "hsk3.word.l4.0984.v1",
          "hsk3.word.l4.0009.v1",
          "hsk3.word.l3.0700.v1",
          "hsk3.word.l4.0735.v1",
          "hsk3.word.l3.0572.v1"
        ],
        "expressions": [
          {
            "hanzi": "提前开始",
            "pinyin": "tí qián kāi shǐ",
            "meaning": "Start early."
          },
          {
            "hanzi": "按时结束",
            "pinyin": "àn shí jié shù",
            "meaning": "Finish on time."
          },
          {
            "hanzi": "推迟或取消约会",
            "pinyin": "tuī chí huò qǔ xiāo yuē huì",
            "meaning": "Postpone or cancel the appointment."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "下午的安排要改变吗？",
            "pinyin": "Xiàwǔ de ānpái yào gǎibiàn ma?",
            "meaning": "Does the afternoon arrangement need to change?"
          },
          {
            "speaker": "B",
            "hanzi": "会议要推迟半个小时。",
            "pinyin": "Huìyì yào tuīchí bàn ge xiǎoshí.",
            "meaning": "The meeting will be delayed half an hour."
          },
          {
            "speaker": "A",
            "hanzi": "那五点开始，可以准时结束吗？",
            "pinyin": "Nà wǔ diǎn kāishǐ, kěyǐ zhǔnshí jiéshù ma?",
            "meaning": "If it starts at five, can it end on time?"
          },
          {
            "speaker": "B",
            "hanzi": "可以，不用取消约会。",
            "pinyin": "Kěyǐ, bú yòng qǔxiāo yuēhuì.",
            "meaning": "Yes, there is no need to cancel the appointment."
          }
        ],
        "task": {
          "title": "Repair a changed schedule",
          "scenario": "A meeting is delayed and may affect a later appointment. State the change, propose a workable time and confirm the outcome.",
          "successCriteria": [
            "Explain whether it is early or delayed",
            "Propose a new start time",
            "Confirm or cancel the later plan"
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "weather-and-seasons": {
    "description": "Read everyday conditions, compare seasons and use a forecast to choose suitable clothing and travel plans.",
    "learningGoal": "Describe current weather, interpret a short forecast and make a practical decision for the day.",
    "wordAssetIds": [
      "hsk3.word.l1.0360.v1",
      "hsk3.word.l2.0441.v1",
      "hsk3.word.l2.0668.v1",
      "hsk3.word.l2.0701.v1",
      "hsk3.word.l2.0152.v1",
      "hsk3.word.l1.0396.v1",
      "hsk3.word.l1.0449.v1",
      "hsk3.word.l2.0590.v1",
      "hsk3.word.l2.0632.v1",
      "hsk3.word.l1.0110.v1",
      "hsk3.word.l1.0212.v1",
      "hsk3.word.l1.0304.v1",
      "hsk3.word.l3.0520.v1",
      "hsk3.word.l2.0355.v1",
      "hsk3.word.l2.0575.v1",
      "hsk3.word.l2.0139.v1",
      "hsk3.word.l2.0080.v1",
      "hsk3.word.l2.0592.v1",
      "hsk3.word.l2.0445.v1",
      "hsk3.word.l2.0133.v1",
      "hsk3.word.l4.0367.v1",
      "hsk3.word.l3.0865.v1",
      "hsk3.word.l2.0518.v1",
      "hsk3.word.l4.0640.v1",
      "hsk3.word.l3.0549.v1",
      "hsk3.word.l5.0739.v1",
      "hsk3.word.l4.0607.v1",
      "hsk3.word.l4.0741.v1",
      "hsk3.word.l2.0327.v1",
      "hsk3.word.l7.4411.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l2.0441.v1",
      "hsk3.word.l1.0304.v1",
      "hsk3.word.l3.0865.v1"
    ],
    "estimatedMinutes": 45,
    "lessons": [
      {
        "id": "read-the-sky",
        "title": "Read the sky",
        "titleZh": "观察天气",
        "outcome": "Recognise clear, cloudy, rainy, snowy and windy conditions outside.",
        "wordAssetIds": [
          "hsk3.word.l1.0360.v1",
          "hsk3.word.l2.0441.v1",
          "hsk3.word.l2.0668.v1",
          "hsk3.word.l2.0701.v1",
          "hsk3.word.l2.0152.v1",
          "hsk3.word.l1.0396.v1",
          "hsk3.word.l1.0449.v1",
          "hsk3.word.l2.0590.v1",
          "hsk3.word.l2.0632.v1",
          "hsk3.word.l1.0110.v1"
        ],
        "expressions": [
          {
            "hanzi": "天气晴朗",
            "pinyin": "tiān qì qíng lǎng",
            "meaning": "The weather is clear."
          },
          {
            "hanzi": "阴天多云",
            "pinyin": "yīn tiān duō yún",
            "meaning": "Overcast and cloudy."
          },
          {
            "hanzi": "下雨刮风",
            "pinyin": "xià yǔ guā fēng",
            "meaning": "Rainy and windy."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "今天天气怎么样？",
            "pinyin": "Jīntiān tiānqì zěnmeyàng?",
            "meaning": "How is the weather today?"
          },
          {
            "speaker": "B",
            "hanzi": "上午多云，外面有风。",
            "pinyin": "Shàngwǔ duōyún, wàimiàn yǒu fēng.",
            "meaning": "It is cloudy and windy this morning."
          },
          {
            "speaker": "A",
            "hanzi": "下午会下雨吗？",
            "pinyin": "Xiàwǔ huì xiàyǔ ma?",
            "meaning": "Will it rain this afternoon?"
          },
          {
            "speaker": "B",
            "hanzi": "会下雨，晚上可能下雪。",
            "pinyin": "Huì xiàyǔ, wǎnshang kěnéng xiàxuě.",
            "meaning": "It will rain and may snow tonight."
          }
        ],
        "task": {
          "title": "Report current conditions",
          "scenario": "A friend cannot see outside and asks about the weather. Describe the sky, wind and any rain or snow clearly.",
          "successCriteria": [
            "Say whether it is clear or cloudy",
            "Mention wind",
            "State whether rain or snow is happening"
          ]
        }
      },
      {
        "id": "compare-seasons",
        "title": "Compare seasons",
        "titleZh": "比较季节",
        "outcome": "Compare temperature and comfort across the four seasons.",
        "wordAssetIds": [
          "hsk3.word.l1.0212.v1",
          "hsk3.word.l1.0304.v1",
          "hsk3.word.l3.0520.v1",
          "hsk3.word.l2.0355.v1",
          "hsk3.word.l2.0575.v1",
          "hsk3.word.l2.0139.v1",
          "hsk3.word.l2.0080.v1",
          "hsk3.word.l2.0592.v1",
          "hsk3.word.l2.0445.v1",
          "hsk3.word.l2.0133.v1"
        ],
        "expressions": [
          {
            "hanzi": "春天很暖和",
            "pinyin": "chūn tiān hěn nuǎn huo",
            "meaning": "Spring is warm."
          },
          {
            "hanzi": "夏天温度高",
            "pinyin": "xià tiān wēn dù gāo",
            "meaning": "Temperatures are high in summer."
          },
          {
            "hanzi": "秋天凉快，冬天冷",
            "pinyin": "qiū tiān liáng kuài ， dōng tiān lěng",
            "meaning": "Autumn is cool and winter is cold."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "你喜欢哪个季节？",
            "pinyin": "Nǐ xǐhuan nǎge jìjié?",
            "meaning": "Which season do you like?"
          },
          {
            "speaker": "B",
            "hanzi": "我喜欢秋天，天气很凉快。",
            "pinyin": "Wǒ xǐhuan qiūtiān, tiānqì hěn liángkuai.",
            "meaning": "I like autumn because it is pleasantly cool."
          },
          {
            "speaker": "A",
            "hanzi": "这里冬天多少度？",
            "pinyin": "Zhèlǐ dōngtiān duōshao dù?",
            "meaning": "What is the temperature here in winter?"
          },
          {
            "speaker": "B",
            "hanzi": "常常很冷，但是春天很暖和。",
            "pinyin": "Chángcháng hěn lěng, dànshì chūntiān hěn nuǎnhuo.",
            "meaning": "It is often cold, but spring is warm."
          }
        ],
        "task": {
          "title": "Choose a suitable season",
          "scenario": "You are choosing when to visit. Compare the temperature and comfort of at least two seasons before making a choice.",
          "successCriteria": [
            "Name two seasons",
            "Compare hot, cold, warm or cool",
            "Choose one season and explain why"
          ]
        }
      },
      {
        "id": "act-on-forecast",
        "title": "Act on the forecast",
        "titleZh": "根据预报准备",
        "outcome": "Use a forecast to choose clothing, an umbrella and a safe plan.",
        "wordAssetIds": [
          "hsk3.word.l4.0367.v1",
          "hsk3.word.l3.0865.v1",
          "hsk3.word.l2.0518.v1",
          "hsk3.word.l4.0640.v1",
          "hsk3.word.l3.0549.v1",
          "hsk3.word.l5.0739.v1",
          "hsk3.word.l4.0607.v1",
          "hsk3.word.l4.0741.v1",
          "hsk3.word.l2.0327.v1",
          "hsk3.word.l7.4411.v1"
        ],
        "expressions": [
          {
            "hanzi": "查看天气预报",
            "pinyin": "chá kàn tiān qì yù bào",
            "meaning": "Check the weather forecast."
          },
          {
            "hanzi": "带伞和外套",
            "pinyin": "dài sǎn hé wài tào",
            "meaning": "Bring an umbrella and a coat."
          },
          {
            "hanzi": "雾天空气湿",
            "pinyin": "wù tiān kōng qì shī",
            "meaning": "The air is damp on a foggy day."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "天气预报说明天有台风。",
            "pinyin": "Tiānqì yùbào shuō míngtiān yǒu táifēng.",
            "meaning": "The forecast says there will be a typhoon tomorrow."
          },
          {
            "speaker": "B",
            "hanzi": "那我带伞和外套。",
            "pinyin": "Nà wǒ dài sǎn hé wàitào.",
            "meaning": "Then I will take an umbrella and coat."
          },
          {
            "speaker": "A",
            "hanzi": "早上还有雾，空气很湿。",
            "pinyin": "Zǎoshang hái yǒu wù, kōngqì hěn shī.",
            "meaning": "There will also be fog and damp air in the morning."
          },
          {
            "speaker": "B",
            "hanzi": "好，我们先不去海边。",
            "pinyin": "Hǎo, wǒmen xiān bú qù hǎibiān.",
            "meaning": "Okay, we will not go to the seaside yet."
          }
        ],
        "task": {
          "title": "Prepare for severe weather",
          "scenario": "A forecast warns of fog, heavy rain or a typhoon. Decide what to carry and whether the original outdoor plan is safe.",
          "successCriteria": [
            "Refer to the forecast",
            "Choose suitable clothing or an umbrella",
            "Change the plan if conditions are unsafe"
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "departure-and-arrival": {
    "description": "Complete a real departure and arrival sequence: prepare documents, pass the terminal checks, board and reach the destination.",
    "learningGoal": "Handle documents, luggage, timing and directions across a practical air or rail journey.",
    "wordAssetIds": [
      "hsk3.word.l1.0162.v1",
      "hsk3.word.l1.0107.v1",
      "hsk3.word.l4.0311.v1",
      "hsk3.word.l1.0163.v1",
      "hsk3.word.l2.0231.v1",
      "hsk3.word.l5.0583.v1",
      "hsk3.word.l3.0803.v1",
      "hsk3.word.l4.0800.v1",
      "hsk3.word.l7.1505.v1",
      "hsk3.word.l6.0004.v1",
      "hsk3.word.l7.0803.v1",
      "hsk3.word.l2.0068.v1",
      "hsk3.word.l4.0984.v1",
      "hsk3.word.l4.0743.v1",
      "hsk3.word.l2.0469.v1",
      "hsk3.word.l4.0107.v1",
      "hsk3.word.l5.0111.v1",
      "hsk3.word.l2.0769.v1",
      "hsk3.word.l1.0285.v1",
      "hsk3.word.l2.0450.v1",
      "hsk3.word.l1.0161.v1",
      "hsk3.word.l4.0267.v1",
      "hsk3.word.l1.0045.v1",
      "hsk3.word.l6.1041.v1",
      "hsk3.word.l3.0143.v1",
      "hsk3.word.l2.0368.v1",
      "hsk3.word.l2.0369.v1",
      "hsk3.word.l7.2938.v1",
      "hsk3.word.l2.0272.v1",
      "hsk3.word.l2.0161.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l1.0107.v1",
      "hsk3.word.l2.0068.v1",
      "hsk3.word.l4.0267.v1"
    ],
    "estimatedMinutes": 45,
    "lessons": [
      {
        "id": "prepare-at-terminal",
        "title": "Prepare at the terminal",
        "titleZh": "航站准备",
        "outcome": "Find the correct counter, present travel documents and handle luggage safely.",
        "wordAssetIds": [
          "hsk3.word.l1.0162.v1",
          "hsk3.word.l1.0107.v1",
          "hsk3.word.l4.0311.v1",
          "hsk3.word.l1.0163.v1",
          "hsk3.word.l2.0231.v1",
          "hsk3.word.l5.0583.v1",
          "hsk3.word.l3.0803.v1",
          "hsk3.word.l4.0800.v1",
          "hsk3.word.l7.1505.v1",
          "hsk3.word.l6.0004.v1"
        ],
        "expressions": [
          {
            "hanzi": "查看航班和机票",
            "pinyin": "chá kàn háng bān hé jī piào",
            "meaning": "Check the flight and ticket."
          },
          {
            "hanzi": "出示护照和签证",
            "pinyin": "chū shì hù zhào hé qiān zhèng",
            "meaning": "Show the passport and visa."
          },
          {
            "hanzi": "在柜台办理行李",
            "pinyin": "zài guì tái bàn lǐ xíng lǐ",
            "meaning": "Handle luggage at the counter."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "您好，请出示护照和机票。",
            "pinyin": "Nínhǎo, qǐng chūshì hùzhào hé jīpiào.",
            "meaning": "Hello, please show your passport and ticket."
          },
          {
            "speaker": "B",
            "hanzi": "好的。这个航班在哪个柜台办理？",
            "pinyin": "Hǎo de. Zhège hángbān zài nǎge guìtái bànlǐ?",
            "meaning": "Okay. Which counter handles this flight?"
          },
          {
            "speaker": "A",
            "hanzi": "在十二号柜台，行李也在那里办理。",
            "pinyin": "Zài shí'èr hào guìtái, xíngli yě zài nàli bànlǐ.",
            "meaning": "At counter 12; luggage is handled there too."
          },
          {
            "speaker": "B",
            "hanzi": "办完以后去安检，对吗？",
            "pinyin": "Bàn wán yǐhòu qù ānjiǎn, duì ma?",
            "meaning": "After that I go to security, right?"
          }
        ],
        "task": {
          "title": "Complete terminal check-in",
          "scenario": "You have arrived at an unfamiliar airport with a suitcase. Find the correct counter, present the required documents and ask where security is.",
          "successCriteria": [
            "Name the flight or ticket",
            "Present passport or visa",
            "Confirm where luggage and security are handled"
          ]
        }
      },
      {
        "id": "board-on-time",
        "title": "Board on time",
        "titleZh": "准时登乘",
        "outcome": "Interpret entrance, exit, delay and seat information before boarding.",
        "wordAssetIds": [
          "hsk3.word.l7.0803.v1",
          "hsk3.word.l2.0068.v1",
          "hsk3.word.l4.0984.v1",
          "hsk3.word.l4.0743.v1",
          "hsk3.word.l2.0469.v1",
          "hsk3.word.l4.0107.v1",
          "hsk3.word.l5.0111.v1",
          "hsk3.word.l2.0769.v1",
          "hsk3.word.l1.0285.v1",
          "hsk3.word.l2.0450.v1"
        ],
        "expressions": [
          {
            "hanzi": "准时出发",
            "pinyin": "zhǔn shí chū fā",
            "meaning": "Depart on time."
          },
          {
            "hanzi": "航班晚点",
            "pinyin": "háng bān wǎn diǎn",
            "meaning": "The flight is delayed."
          },
          {
            "hanzi": "从入口登机",
            "pinyin": "cóng rù kǒu dēng jī",
            "meaning": "Board through the entrance."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "这个航班准时出发吗？",
            "pinyin": "Zhège hángbān zhǔnshí chūfā ma?",
            "meaning": "Does this flight depart on time?"
          },
          {
            "speaker": "B",
            "hanzi": "晚点二十分钟。",
            "pinyin": "Wǎndiǎn èrshí fēnzhōng.",
            "meaning": "It is delayed twenty minutes."
          },
          {
            "speaker": "A",
            "hanzi": "我从哪个入口登机？",
            "pinyin": "Wǒ cóng nǎge rùkǒu dēngjī?",
            "meaning": "Which entrance do I use to board?"
          },
          {
            "speaker": "B",
            "hanzi": "从三号入口，请先准备好票。",
            "pinyin": "Cóng sān hào rùkǒu, qǐng xiān zhǔnbèi hǎo piào.",
            "meaning": "Entrance 3; please have your ticket ready."
          }
        ],
        "task": {
          "title": "Reach the correct seat",
          "scenario": "A departure is delayed and the gate area has several entrances. Confirm the delay, find the boarding entrance and locate your seat.",
          "successCriteria": [
            "Ask whether departure is on time",
            "Repeat the delay accurately",
            "Confirm entrance and seat information"
          ]
        }
      },
      {
        "id": "arrive-and-connect",
        "title": "Arrive and connect",
        "titleZh": "到达换乘",
        "outcome": "Use rail and destination information to finish the journey or make a connection.",
        "wordAssetIds": [
          "hsk3.word.l1.0161.v1",
          "hsk3.word.l4.0267.v1",
          "hsk3.word.l1.0045.v1",
          "hsk3.word.l6.1041.v1",
          "hsk3.word.l3.0143.v1",
          "hsk3.word.l2.0368.v1",
          "hsk3.word.l2.0369.v1",
          "hsk3.word.l7.2938.v1",
          "hsk3.word.l2.0272.v1",
          "hsk3.word.l2.0161.v1"
        ],
        "expressions": [
          {
            "hanzi": "在车站取票",
            "pinyin": "zài chē zhàn qǔ piào",
            "meaning": "Collect the ticket at the station."
          },
          {
            "hanzi": "去高铁站台",
            "pinyin": "qù gāo tiě zhàn tái",
            "meaning": "Go to the high-speed rail platform."
          },
          {
            "hanzi": "到达旅行目的地",
            "pinyin": "dào dá lǚ xíng mù dì dì",
            "meaning": "Arrive at the travel destination."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "去目的地坐火车还是高铁？",
            "pinyin": "Qù mùdìdì zuò huǒchē háishi gāotiě?",
            "meaning": "Do we take a train or high-speed rail to the destination?"
          },
          {
            "speaker": "B",
            "hanzi": "坐高铁，在车站先取票。",
            "pinyin": "Zuò gāotiě, zài chēzhàn xiān qǔ piào.",
            "meaning": "Take high-speed rail and collect the ticket at the station."
          },
          {
            "speaker": "A",
            "hanzi": "从哪个站台出发？",
            "pinyin": "Cóng nǎge zhàntái chūfā?",
            "meaning": "Which platform does it leave from?"
          },
          {
            "speaker": "B",
            "hanzi": "五号站台，向右走。",
            "pinyin": "Wǔ hào zhàntái, xiàng yòu zǒu.",
            "meaning": "Platform 5; walk to the right."
          }
        ],
        "task": {
          "title": "Complete the connection",
          "scenario": "After arriving, you must continue by rail. Choose the correct train, collect the ticket and follow directions to the platform.",
          "successCriteria": [
            "Choose train or high-speed rail",
            "Ask where to collect the ticket",
            "Confirm the platform and direction"
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "getting-around-town": {
    "description": "Choose local transport, follow stop and transfer information, then complete the last part of a city journey.",
    "learningGoal": "Ask for a route, use public transport and recover from a delay or wrong direction in Chinese.",
    "wordAssetIds": [
      "hsk3.word.l2.0125.v1",
      "hsk3.word.l2.0126.v1",
      "hsk3.word.l2.0188.v1",
      "hsk3.word.l2.0189.v1",
      "hsk3.word.l2.0076.v1",
      "hsk3.word.l1.0045.v1",
      "hsk3.word.l2.0713.v1",
      "hsk3.word.l1.0221.v1",
      "hsk3.word.l1.0285.v1",
      "hsk3.word.l2.0272.v1",
      "hsk3.word.l1.0318.v1",
      "hsk3.word.l1.0392.v1",
      "hsk3.word.l2.0240.v1",
      "hsk3.word.l3.0553.v1",
      "hsk3.word.l3.0295.v1",
      "hsk3.word.l1.0282.v1",
      "hsk3.word.l2.0147.v1",
      "hsk3.word.l1.0222.v1",
      "hsk3.word.l2.0161.v1",
      "hsk3.word.l2.0297.v1",
      "hsk3.word.l1.0073.v1",
      "hsk3.word.l4.0185.v1",
      "hsk3.word.l2.0506.v1",
      "hsk3.word.l4.0202.v1",
      "hsk3.word.l1.0064.v1",
      "hsk3.word.l2.0429.v1",
      "hsk3.word.l4.0057.v1",
      "hsk3.word.l1.0497.v1",
      "hsk3.word.l1.0448.v1",
      "hsk3.word.l1.0490.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l2.0126.v1",
      "hsk3.word.l1.0392.v1",
      "hsk3.word.l4.0185.v1"
    ],
    "estimatedMinutes": 45,
    "lessons": [
      {
        "id": "choose-transport",
        "title": "Choose transport",
        "titleZh": "选择交通",
        "outcome": "Compare bus, subway and taxi options and buy the ticket you need.",
        "wordAssetIds": [
          "hsk3.word.l2.0125.v1",
          "hsk3.word.l2.0126.v1",
          "hsk3.word.l2.0188.v1",
          "hsk3.word.l2.0189.v1",
          "hsk3.word.l2.0076.v1",
          "hsk3.word.l1.0045.v1",
          "hsk3.word.l2.0713.v1",
          "hsk3.word.l1.0221.v1",
          "hsk3.word.l1.0285.v1",
          "hsk3.word.l2.0272.v1"
        ],
        "expressions": [
          {
            "hanzi": "坐地铁去车站",
            "pinyin": "zuò dì tiě qù chē zhàn",
            "meaning": "Take the subway to the station."
          },
          {
            "hanzi": "买一张公交车票",
            "pinyin": "mǎi yī zhāng gōng jiāo chē piào",
            "meaning": "Buy one bus ticket."
          },
          {
            "hanzi": "交通方便",
            "pinyin": "jiāo tōng fāng biàn",
            "meaning": "Transport is convenient."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "去市中心坐什么车？",
            "pinyin": "Qù shì zhōngxīn zuò shénme chē?",
            "meaning": "What transport should I take downtown?"
          },
          {
            "speaker": "B",
            "hanzi": "坐地铁最快，也可以坐公共汽车。",
            "pinyin": "Zuò dìtiě zuì kuài, yě kěyǐ zuò gōnggòng qìchē.",
            "meaning": "The subway is fastest; you can also take the bus."
          },
          {
            "speaker": "A",
            "hanzi": "地铁站远吗？",
            "pinyin": "Dìtiězhàn yuǎn ma?",
            "meaning": "Is the subway station far?"
          },
          {
            "speaker": "B",
            "hanzi": "不远，就在车站旁边。",
            "pinyin": "Bù yuǎn, jiù zài chēzhàn pángbiān.",
            "meaning": "No, it is beside the station."
          }
        ],
        "task": {
          "title": "Choose the best ride",
          "scenario": "You must reach the city centre and can take a bus, subway or taxi. Compare the options and state which ticket you need.",
          "successCriteria": [
            "Name two transport options",
            "Ask where the station is",
            "Choose one route and ticket"
          ]
        }
      },
      {
        "id": "follow-stops",
        "title": "Follow stops",
        "titleZh": "按站换乘",
        "outcome": "Get on, count stops, transfer if needed and get off at the correct place.",
        "wordAssetIds": [
          "hsk3.word.l1.0318.v1",
          "hsk3.word.l1.0392.v1",
          "hsk3.word.l2.0240.v1",
          "hsk3.word.l3.0553.v1",
          "hsk3.word.l3.0295.v1",
          "hsk3.word.l1.0282.v1",
          "hsk3.word.l2.0147.v1",
          "hsk3.word.l1.0222.v1",
          "hsk3.word.l2.0161.v1",
          "hsk3.word.l2.0297.v1"
        ],
        "expressions": [
          {
            "hanzi": "在下一站下车",
            "pinyin": "zài xià yī zhàn xià chē",
            "meaning": "Get off at the next stop."
          },
          {
            "hanzi": "前面路口换车",
            "pinyin": "qián miàn lù kǒu huàn chē",
            "meaning": "Transfer at the intersection ahead."
          },
          {
            "hanzi": "车站就在对面",
            "pinyin": "chē zhàn jiù zài duì miàn",
            "meaning": "The station is directly opposite."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "我在哪一站上车？",
            "pinyin": "Wǒ zài nǎ yí zhàn shàngchē?",
            "meaning": "At which stop do I board?"
          },
          {
            "speaker": "B",
            "hanzi": "在前面的车站上车。",
            "pinyin": "Zài qiánmiàn de chēzhàn shàngchē.",
            "meaning": "Board at the station ahead."
          },
          {
            "speaker": "A",
            "hanzi": "需要换车吗？",
            "pinyin": "Xūyào huàn chē ma?",
            "meaning": "Do I need to transfer?"
          },
          {
            "speaker": "B",
            "hanzi": "需要，坐三站以后下车，在对面换。",
            "pinyin": "Xūyào, zuò sān zhàn yǐhòu xiàchē, zài duìmiàn huàn.",
            "meaning": "Yes. Get off after three stops and transfer opposite."
          }
        ],
        "task": {
          "title": "Complete a transfer",
          "scenario": "A local route includes one transfer. Confirm where to board, count the stops and identify the correct place to change.",
          "successCriteria": [
            "Ask where to board",
            "State the number of stops",
            "Confirm where to transfer and get off"
          ]
        }
      },
      {
        "id": "finish-the-route",
        "title": "Finish the route",
        "titleZh": "完成末段",
        "outcome": "Use a map and address, respond to traffic and walk the final directions.",
        "wordAssetIds": [
          "hsk3.word.l1.0073.v1",
          "hsk3.word.l4.0185.v1",
          "hsk3.word.l2.0506.v1",
          "hsk3.word.l4.0202.v1",
          "hsk3.word.l1.0064.v1",
          "hsk3.word.l2.0429.v1",
          "hsk3.word.l4.0057.v1",
          "hsk3.word.l1.0497.v1",
          "hsk3.word.l1.0448.v1",
          "hsk3.word.l1.0490.v1"
        ],
        "expressions": [
          {
            "hanzi": "把地址给司机",
            "pinyin": "bǎ dì zhǐ gěi sī jī",
            "meaning": "Give the address to the driver."
          },
          {
            "hanzi": "堵车时看地图",
            "pinyin": "dǔ chē shí kàn dì tú",
            "meaning": "Check the map during traffic."
          },
          {
            "hanzi": "向左边步行",
            "pinyin": "xiàng zuǒ biān bù xíng",
            "meaning": "Walk toward the left."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "司机，这是酒店地址。",
            "pinyin": "Sījī, zhè shì jiǔdiàn dìzhǐ.",
            "meaning": "Driver, this is the hotel address."
          },
          {
            "speaker": "B",
            "hanzi": "前面堵车，只能到这个路口。",
            "pinyin": "Qiánmiàn dǔchē, zhǐ néng dào zhège lùkǒu.",
            "meaning": "There is traffic ahead; I can only reach this intersection."
          },
          {
            "speaker": "A",
            "hanzi": "下车以后怎么走？",
            "pinyin": "Xiàchē yǐhòu zěnme zǒu?",
            "meaning": "How do I walk after getting off?"
          },
          {
            "speaker": "B",
            "hanzi": "看地图，向左边步行五分钟。",
            "pinyin": "Kàn dìtú, xiàng zuǒbiān bùxíng wǔ fēnzhōng.",
            "meaning": "Check the map and walk left for five minutes."
          }
        ],
        "task": {
          "title": "Recover from traffic",
          "scenario": "Your taxi cannot reach the exact address because of traffic. Show the address, confirm the drop-off point and follow walking directions.",
          "successCriteria": [
            "Give the exact address",
            "Acknowledge the traffic problem",
            "Repeat left or right walking directions"
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  },
  "hotel-stay": {
    "description": "Complete a hotel stay from reservation and check-in to room requests, problem reporting and checkout.",
    "learningGoal": "Check in with documents, use hotel facilities and solve a room or payment issue politely.",
    "wordAssetIds": [
      "hsk3.word.l2.0302.v1",
      "hsk3.word.l5.0041.v1",
      "hsk3.word.l1.0101.v1",
      "hsk3.word.l7.3259.v1",
      "hsk3.word.l4.0907.v1",
      "hsk3.word.l6.1002.v1",
      "hsk3.word.l2.0325.v1",
      "hsk3.word.l2.0231.v1",
      "hsk3.word.l3.0899.v1",
      "hsk3.word.l3.0803.v1",
      "hsk3.word.l7.4847.v1",
      "hsk3.word.l4.0190.v1",
      "hsk3.word.l1.0218.v1",
      "hsk3.word.l2.0052.v1",
      "hsk3.word.l2.0706.v1",
      "hsk3.word.l3.0421.v1",
      "hsk3.word.l7.5109.v1",
      "hsk3.word.l1.0387.v1",
      "hsk3.word.l4.0501.v1",
      "hsk3.word.l1.0052.v1",
      "hsk3.word.l7.2400.v1",
      "hsk3.word.l2.0170.v1",
      "hsk3.word.l4.0746.v1",
      "hsk3.word.l4.0515.v1",
      "hsk3.word.l1.0152.v1",
      "hsk3.word.l2.0004.v1",
      "hsk3.word.l3.0084.v1",
      "hsk3.word.l4.0138.v1",
      "hsk3.word.l3.0195.v1",
      "hsk3.word.l5.0868.v1"
    ],
    "featuredWordAssetIds": [
      "hsk3.word.l5.0041.v1",
      "hsk3.word.l4.0190.v1",
      "hsk3.word.l2.0170.v1"
    ],
    "estimatedMinutes": 45,
    "lessons": [
      {
        "id": "book-and-check-in",
        "title": "Book and check in",
        "titleZh": "预订入住",
        "outcome": "Confirm a reservation, present identification and leave luggage safely.",
        "wordAssetIds": [
          "hsk3.word.l2.0302.v1",
          "hsk3.word.l5.0041.v1",
          "hsk3.word.l1.0101.v1",
          "hsk3.word.l7.3259.v1",
          "hsk3.word.l4.0907.v1",
          "hsk3.word.l6.1002.v1",
          "hsk3.word.l2.0325.v1",
          "hsk3.word.l2.0231.v1",
          "hsk3.word.l3.0899.v1",
          "hsk3.word.l3.0803.v1"
        ],
        "expressions": [
          {
            "hanzi": "预订酒店房间",
            "pinyin": "yù dìng jiǔ diàn fáng jiān",
            "meaning": "Reserve a hotel room."
          },
          {
            "hanzi": "在前台出示证件",
            "pinyin": "zài qián tái chū shì zhèng jiàn",
            "meaning": "Show identification at reception."
          },
          {
            "hanzi": "客人的护照和行李",
            "pinyin": "kè rén de hù zhào hé xíng lǐ",
            "meaning": "The guest's passport and luggage."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "您好，我预订了一个房间。",
            "pinyin": "Nínhǎo, wǒ yùdìng le yí ge fángjiān.",
            "meaning": "Hello, I reserved a room."
          },
          {
            "speaker": "B",
            "hanzi": "请问客人姓名？请出示证件。",
            "pinyin": "Qǐngwèn kèrén xìngmíng? Qǐng chūshì zhèngjiàn.",
            "meaning": "What is the guest name? Please show identification."
          },
          {
            "speaker": "A",
            "hanzi": "这是我的护照，行李可以放在哪儿？",
            "pinyin": "Zhè shì wǒ de hùzhào, xíngli kěyǐ fàng zài nǎr?",
            "meaning": "Here is my passport. Where can I leave my luggage?"
          },
          {
            "speaker": "B",
            "hanzi": "可以放在前台旁边。",
            "pinyin": "Kěyǐ fàng zài qiántái pángbiān.",
            "meaning": "You can leave it beside reception."
          }
        ],
        "task": {
          "title": "Complete check-in",
          "scenario": "You have a reservation and luggage but do not know the check-in procedure. Confirm the booking, provide identification and ask about luggage.",
          "successCriteria": [
            "State that a room was reserved",
            "Present a passport or other document",
            "Ask where luggage can be stored"
          ]
        }
      },
      {
        "id": "use-the-room",
        "title": "Use the room",
        "titleZh": "使用客房",
        "outcome": "Find the room and ask about breakfast, bathroom items and climate control.",
        "wordAssetIds": [
          "hsk3.word.l7.4847.v1",
          "hsk3.word.l4.0190.v1",
          "hsk3.word.l1.0218.v1",
          "hsk3.word.l2.0052.v1",
          "hsk3.word.l2.0706.v1",
          "hsk3.word.l3.0421.v1",
          "hsk3.word.l7.5109.v1",
          "hsk3.word.l1.0387.v1",
          "hsk3.word.l4.0501.v1",
          "hsk3.word.l1.0052.v1"
        ],
        "expressions": [
          {
            "hanzi": "坐电梯到五楼",
            "pinyin": "zuò diàn tī dào wǔ lóu",
            "meaning": "Take the elevator to the fifth floor."
          },
          {
            "hanzi": "房间里有空调",
            "pinyin": "fáng jiān lǐ yǒu kòng diào",
            "meaning": "There is air conditioning in the room."
          },
          {
            "hanzi": "浴室需要毛巾",
            "pinyin": "yù shì xū yào máo jīn",
            "meaning": "The bathroom needs towels."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "我的房间在几楼？",
            "pinyin": "Wǒ de fángjiān zài jǐ lóu?",
            "meaning": "Which floor is my room on?"
          },
          {
            "speaker": "B",
            "hanzi": "在五楼，坐右边的电梯。",
            "pinyin": "Zài wǔ lóu, zuò yòubiān de diàntī.",
            "meaning": "It is on the fifth floor; take the elevator on the right."
          },
          {
            "speaker": "A",
            "hanzi": "早餐几点开始？房间里有毛巾吗？",
            "pinyin": "Zǎocān jǐ diǎn kāishǐ? Fángjiān lǐ yǒu máojīn ma?",
            "meaning": "When does breakfast start? Are there towels in the room?"
          },
          {
            "speaker": "B",
            "hanzi": "七点开始，浴室里有两条毛巾。",
            "pinyin": "Qī diǎn kāishǐ, yùshì lǐ yǒu liǎng tiáo máojīn.",
            "meaning": "It starts at seven; there are two towels in the bathroom."
          }
        ],
        "task": {
          "title": "Settle into the room",
          "scenario": "You have received a key but still need to find the floor and understand the main room facilities. Ask three practical questions.",
          "successCriteria": [
            "Confirm the floor and elevator",
            "Ask about breakfast",
            "Check a bathroom or air-conditioning item"
          ]
        }
      },
      {
        "id": "solve-and-check-out",
        "title": "Solve and check out",
        "titleZh": "报修结账",
        "outcome": "Report a room problem, request service and confirm charges or deposit.",
        "wordAssetIds": [
          "hsk3.word.l7.2400.v1",
          "hsk3.word.l2.0170.v1",
          "hsk3.word.l4.0746.v1",
          "hsk3.word.l4.0515.v1",
          "hsk3.word.l1.0152.v1",
          "hsk3.word.l2.0004.v1",
          "hsk3.word.l3.0084.v1",
          "hsk3.word.l4.0138.v1",
          "hsk3.word.l3.0195.v1",
          "hsk3.word.l5.0868.v1"
        ],
        "expressions": [
          {
            "hanzi": "网络密码不对",
            "pinyin": "wǎng luò mì mǎ bú duì",
            "meaning": "The network password is incorrect."
          },
          {
            "hanzi": "客房太吵",
            "pinyin": "kè fáng tài chǎo",
            "meaning": "The guest room is too noisy."
          },
          {
            "hanzi": "确认费用和押金",
            "pinyin": "què rèn fèi yòng hé yā jīn",
            "meaning": "Confirm the charges and deposit."
          }
        ],
        "dialogue": [
          {
            "speaker": "A",
            "hanzi": "您好，房间的网络坏了，而且晚上很吵。",
            "pinyin": "Nínhǎo, fángjiān de wǎngluò huài le, érqiě wǎnshang hěn chǎo.",
            "meaning": "Hello, the room internet is broken and it is noisy at night."
          },
          {
            "speaker": "B",
            "hanzi": "对不起，我们马上安排服务。",
            "pinyin": "Duìbuqǐ, wǒmen mǎshàng ānpái fúwù.",
            "meaning": "Sorry, we will arrange service immediately."
          },
          {
            "speaker": "A",
            "hanzi": "明天离开时，费用和押金怎么结算？",
            "pinyin": "Míngtiān líkāi shí, fèiyong hé yājīn zěnme jiésuàn?",
            "meaning": "How are the charges and deposit settled when I leave tomorrow?"
          },
          {
            "speaker": "B",
            "hanzi": "前台会列出费用，押金会退给您。",
            "pinyin": "Qiántái huì lièchū fèiyong, yājīn huì tuì gěi nín.",
            "meaning": "Reception will list the charges and return the deposit."
          }
        ],
        "task": {
          "title": "Resolve a room problem",
          "scenario": "The room is noisy and the internet does not work. Report both issues, request action and confirm the final charges before leaving.",
          "successCriteria": [
            "Describe the broken or noisy item",
            "Request hotel service",
            "Confirm charges and deposit handling"
          ]
        }
      }
    ],
    "contentVersion": "2026.09-topics-p2"
  }
} satisfies Record<string, TopicP2Expansion>;
