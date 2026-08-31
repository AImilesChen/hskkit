# 批次1来源与许可清单

## 1. 等级与词表

- 标准依据：中华人民共和国教育部《国际中文教育中文水平等级标准》GF0025-2021。
- 机器可读校订源：`ivankra/hsk30` commit `4ff9e3915ce87baaecd7ebe263085573a4ea3192`。
- 许可：MIT。
- 用途：词条、等级段、拼音、词性和变体；不宣称 HSKKit 获得官方背书。
- 随发行保留的版权与许可正文：`content/licenses/ivankra-hsk30-MIT.txt`。

## 2. 英文释义

- 来源：CC-CEDICT snapshot SHA-256 `08eb651aeee769991f87b1373303ecddd5abab400e98b1db79cdc78927284f2d`。
- 许可：CC BY-SA 4.0，允许商业使用；要求署名及同方式共享改编的词典数据。
- 11,064 条使用 CC-CEDICT；28 条无可用词典匹配的组合短语使用 HSKKit 自有英文释义。

## 3. 音频

- 正式音频资产：0。
- 流式权：无已批准来源，未发布。
- 缓存权：无已批准来源，未缓存。
- 离线再分发权：无，未提供下载。
- 浏览器 Speech Synthesis 是用户设备即时能力，不属于内容发行包。

## 4. 汉字结构与拆分

- 部首与笔画：Unicode Unihan 17.0.0，Unicode License v3；归档 SHA-256 `f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e`。
- IDS 拆分：Make Me a Hanzi `dictionary.txt`，commit `618dbab8a8ddefb958763c8b4afbaa741a4460de`，源文件 SHA-256 `744bb05d5b0742e9ee35c37791f94d56a173349b3367569e7ca11e510364d203`。
- 许可：GNU LGPL 3.0 or later；许可正文保留于 `content/licenses/makemeahanzi-LGPL-3.0.txt`。
- 用途：仅抽取冻结的 2,971 个 HSK 汉字的原始 decomposition，并按顶层 IDS 运算符映射为学习者可读结构；不推断、不伪造缺失拆分。
- 可复现输入：`content/sources/makemeahanzi-618dbab8-hsk-structures.json`；生成器：`scripts/content/build-character-index.py`。

## 5. 归因页面

- 生产公开页：`/content-license`。
