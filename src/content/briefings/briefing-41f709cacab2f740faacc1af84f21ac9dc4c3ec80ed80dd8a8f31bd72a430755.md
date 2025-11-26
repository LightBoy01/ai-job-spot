<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-41f709cacab2f740faacc1af84f21ac9dc4c3ec80ed80dd8a8f31bd72a430755
title: Improving Latent Reasoning in LLMs via Soft Concept Mixing
slug: briefing-41f709cacab2f740faacc1af84f21ac9dc4c3ec80ed80dd8a8f31bd72a430755
author: 'Kang Wang, Xiangyu Duan, Tianyi Du'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.16885'
status: pending_review
tags:
  - cs.CL
excerpt: >-
  arXiv:2511.16885v1 Announce Type: new 

  Abstract: Unlike human reasoning in abstract conceptual spaces, large language
  models (LLMs) typically reason by generating discrete tokens, which
  potentially li
---
arXiv:2511.16885v1 Announce Type: new 
Abstract: Unlike human reasoning in abstract conceptual spaces, large language models (LLMs) typically reason by generating discrete tokens, which potentially limit their expressive power. The recent work Soft Thinking has shown that LLMs' latent reasoning via soft concepts is a promising direction, but LLMs are trained on discrete tokens. To reduce this gap between the soft concepts in reasoning and the discrete tokens in training, we propose Soft Concept Mixing (SCM), a soft concept aware training scheme that directly exposes the model to soft representations during training. Specifically, SCM constructs a soft concept vector by forming a probability-weighted average of embeddings. Then, this vector is mixed into the model's hidden states, which embody rich contextual information. Finally, the entire latent reasoning process is optimized with Reinforcement Learning (RL). Experiments on five reasoning benchmarks demonstrate that SCM improves the reasoning performance of LLMs, and simultaneously maintains a stable training dynamic.
