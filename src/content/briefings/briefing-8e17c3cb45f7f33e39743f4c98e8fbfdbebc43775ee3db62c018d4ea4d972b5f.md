---
id: briefing-8e17c3cb45f7f33e39743f4c98e8fbfdbebc43775ee3db62c018d4ea4d972b5f
title: >-
  When Bias Pretends to Be Truth: How Spurious Correlations Undermine
  Hallucination Detection in LLMs
slug: briefing-8e17c3cb45f7f33e39743f4c98e8fbfdbebc43775ee3db62c018d4ea4d972b5f
author: >-
  Shaowen Wang, Yiqi Dong, Ruinian Chang, Tansheng Zhu, Yuebo Sun, Kaifeng Lyu,
  Jian Li
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.07318'
status: pending_review
tags:
  - cs.CL
  - cs.AI
  - cs.LG
excerpt: >-
  arXiv:2511.07318v2 Announce Type: replace-cross 

  Abstract: Despite substantial advances, large language models (LLMs) continue
  to exhibit hallucinations, generating plausible yet incorrect responses.
---
arXiv:2511.07318v2 Announce Type: replace-cross 
Abstract: Despite substantial advances, large language models (LLMs) continue to exhibit hallucinations, generating plausible yet incorrect responses. In this paper, we highlight a critical yet previously underexplored class of hallucinations driven by spurious correlations -- superficial but statistically prominent associations between features (e.g., surnames) and attributes (e.g., nationality) present in the training data. We demonstrate that these spurious correlations induce hallucinations that are confidently generated, immune to model scaling, evade current detection methods, and persist even after refusal fine-tuning. Through systematically controlled synthetic experiments and empirical evaluations on state-of-the-art open-source and proprietary LLMs (including GPT-5), we show that existing hallucination detection methods, such as confidence-based filtering and inner-state probing, fundamentally fail in the presence of spurious correlations. Our theoretical analysis further elucidates why these statistical biases intrinsically undermine confidence-based detection techniques. Our findings thus emphasize the urgent need for new approaches explicitly designed to address hallucinations caused by spurious correlations.
