<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-615de63d9819a7f1e3ce87d3feb9cbaf4003b0ed2e1cf78b8f57b62f2e34a96b
title: >-
  LEME: Open Large Language Models for Ophthalmology with Advanced Reasoning and
  Clinical Validation
slug: briefing-615de63d9819a7f1e3ce87d3feb9cbaf4003b0ed2e1cf78b8f57b62f2e34a96b
author: >-
  Hyunjae Kim, Xuguang Ai, Sahana Srinivasan, Aidan Gilson, Maxwell B. Singer,
  Krithi Pushpanathan, Qianqian Xie, Jungwoo Park, Serina Applebaum, Gabriel
  Dawei Yang, Minjie Zou, David Ziyou Chen, Ke Zou, Soshian Sarrafpour, Ji Liu,
  Yu Yin, Jimin Huang, Quang Ngoc Nguyen, Erping Long, Peixing Wan, Dianbo Liu,
  Richard Hintz, W. Jim Zheng, Sophia Y. Wang, Lucila Ohno-Machado, Hua Xu, Ron
  A. Adelman, Luciano V. Del Priore, Yih-Chung Tham, Qingyu Chen
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2410.03740'
status: pending_review
tags:
  - cs.CL
excerpt: >-
  arXiv:2410.03740v3 Announce Type: replace 

  Abstract: The rising prevalence of eye diseases poses a growing public health
  burden. Large language models (LLMs) offer a promising path to reduce
  documenta
---
arXiv:2410.03740v3 Announce Type: replace 
Abstract: The rising prevalence of eye diseases poses a growing public health burden. Large language models (LLMs) offer a promising path to reduce documentation workload and support clinical decision-making. However, few have been tailored for ophthalmology, and most evaluations focus mainly on knowledge-based QA without clinically relevant benchmarks or real-world validation. Here, we present LEME, a suite of open-weight LLMs developed through a two-stage process: (1) instruction tuning on 200,000 samples from clinical guidelines, textbooks, and case reports to enhance reasoning and task-following, and (2) reinforcement learning with ~30,000 preference labels to enhance accuracy and informativeness. LEME was evaluated on five curated zero-shot benchmarks spanning tasks such as patient QA, consultation, and treatment planning. It outperformed all seven baselines (all p &lt; 0.004), exceeding GPT-4o by 3.32% (absolute ROUGE-L gain). It was further evaluated on three downstream tasks using deidentified patient data, reviewed by clinicians. In patient QA, LEME received the highest ratings from attending clinicians in 3 out of 4 criteria, with scores of 4.67 for factuality, 4.77 for specificity, 4.79 for completeness, and 4.88 for safety (1-5 scale). Its completeness score surpassed that of expert-written answers (4.79 vs. 4.56; p = 0.015). In visual acuity extraction, LEME achieved the highest F1, outperforming LLaMA-3 by 14.1% and Eye-LLaMA by 59.0%. In a pilot evaluation on assessment and treatment planning for diabetic retinopathy, AMD, and glaucoma, LEME received scores of 4.36 for factuality, 4.55 for specificity, 4.42 for completeness, and 4.36 for safety, approaching attending-level performance. All models, data, and code will be released to support further development and clinical translation, laying the groundwork for improved efficiency and patient care
