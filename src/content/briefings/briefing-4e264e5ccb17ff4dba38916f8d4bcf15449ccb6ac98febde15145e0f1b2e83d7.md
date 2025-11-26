<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-4e264e5ccb17ff4dba38916f8d4bcf15449ccb6ac98febde15145e0f1b2e83d7
title: >-
  iTool: Reinforced Fine-Tuning with Dynamic Deficiency Calibration for Advanced
  Tool Use
slug: briefing-4e264e5ccb17ff4dba38916f8d4bcf15449ccb6ac98febde15145e0f1b2e83d7
author: >-
  Yirong Zeng, Xiao Ding, Yuxian Wang, Weiwen Liu, Wu Ning, Yutai Hou, Xu Huang,
  Duyu Tang, Dandan Tu, Bing Qin, Ting Liu
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2501.09766'
status: pending_review
tags:
  - cs.CL
  - cs.AI
  - cs.LG
excerpt: >-
  arXiv:2501.09766v5 Announce Type: replace-cross 

  Abstract: Augmenting large language models (LLMs) with external tools is a
  promising approach to enhance their capabilities, especially for complex tas
---
arXiv:2501.09766v5 Announce Type: replace-cross 
Abstract: Augmenting large language models (LLMs) with external tools is a promising approach to enhance their capabilities, especially for complex tasks. Synthesizing tool-use data through real-world simulations is an effective way to achieve this. However, our investigation reveals that training gains significantly decay as synthetic data increases. The model struggles to benefit from additional synthetic data, which fails to endow it with advanced tool-use capabilities in complex scenarios Moreover, we discovered that the above limitation usually manifests as a fragment deficiency (i.e., parameter errors) in response. To this end, we propose an iterative reinforced fine-tuning strategy designed to alleviate this limitation. This strategy involves: (1) enhancing the diversity of response for synthetic data through path exploration of Monte Carlo Tree Search. (2) iteratively pinpointing the model's deficiency by constructing fine-grained preference pairs, and then improving it by preference optimization algorithms for targeted improvement. The experiments show that our method achieves 13.11% better performance than the same-size base model. It achieves an improvement of 6.5% in complex scenarios compared to the baseline, and it also outperforms larger open-source and closed-source models.
