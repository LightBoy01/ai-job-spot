<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-244f67df2fad0b0dd3f0c510ee5b33c1da3a21eab7fe86a098d8e08d758d7ec9
title: >-
  RPRO: Ranked Preference Reinforcement Optimization for Enhancing Medical QA
  and Diagnostic Reasoning
slug: briefing-244f67df2fad0b0dd3f0c510ee5b33c1da3a21eab7fe86a098d8e08d758d7ec9
author: >-
  Chia-Hsuan Hsu, Jun-En Ding, Hsin-Ling Hsu, Chih-Ho Hsu, Li-Hung Yao,
  Chun-Chieh Liao, Feng Liu, Fang-Ming Hung
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2509.00974'
status: pending_review
tags:
  - cs.CL
excerpt: >-
  arXiv:2509.00974v4 Announce Type: replace 

  Abstract: Medical question answering requires advanced reasoning that
  integrates domain knowledge with logical inference. However, existing large
  language mo
---
arXiv:2509.00974v4 Announce Type: replace 
Abstract: Medical question answering requires advanced reasoning that integrates domain knowledge with logical inference. However, existing large language models (LLMs) often generate reasoning chains that lack factual accuracy and clinical reliability. We propose Ranked Preference Reinforcement Optimization (RPRO), a novel framework that combines reinforcement learning with preference-driven reasoning refinement to enhance clinical chain-of-thought (CoT) performance. RPRO distinguishes itself from prior approaches by employing task-adaptive reasoning templates and a probabilistic evaluation mechanism that aligns model outputs with established clinical workflows, while automatically identifying and correcting low-quality reasoning chains. Unlike traditional pairwise preference methods, RPRO introduces a groupwise ranking optimization based on the Bradley--Terry model and incorporates KL-divergence regularization for stable training. Experiments on PubMedQA, MedQA-USMLE, and a real-world clinical dataset from Far Eastern Memorial Hospital (FEMH) demonstrate consistent improvements over strong baselines. Remarkably, our 2B-parameter model outperforms much larger 7B--20B models, including medical-specialized variants. These findings demonstrate that combining preference optimization with quality-driven refinement provides a scalable and clinically grounded approach to building more reliable medical LLMs.
