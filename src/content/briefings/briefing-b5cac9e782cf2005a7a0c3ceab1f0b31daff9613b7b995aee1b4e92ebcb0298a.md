---
id: briefing-b5cac9e782cf2005a7a0c3ceab1f0b31daff9613b7b995aee1b4e92ebcb0298a
title: >-
  LoPT: Lossless Parallel Tokenization Acceleration for Long Context Inference
  of Large Language Model
slug: briefing-b5cac9e782cf2005a7a0c3ceab1f0b31daff9613b7b995aee1b4e92ebcb0298a
author: 'Wei Shao, Lingchao Zheng, Pengyu Wang, Peizhen Zheng, Jun Li, Yuwei Fan'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04952'
status: pending_review
tags:
  - cs.CL
excerpt: >-
  arXiv:2511.04952v1 Announce Type: new 

  Abstract: Long context inference scenarios have become increasingly important
  for large language models, yet they introduce significant computational
  latency. Wh
---
arXiv:2511.04952v1 Announce Type: new 
Abstract: Long context inference scenarios have become increasingly important for large language models, yet they introduce significant computational latency. While prior research has optimized long-sequence inference through operators, model architectures, and system frameworks, tokenization remains an overlooked bottleneck. Existing parallel tokenization methods accelerate processing through text segmentation and multi-process tokenization, but they suffer from inconsistent results due to boundary artifacts that occur after merging. To address this, we propose LoPT, a novel Lossless Parallel Tokenization framework that ensures output identical to standard sequential tokenization. Our approach employs character-position-based matching and dynamic chunk length adjustment to align and merge tokenized segments accurately. Extensive experiments across diverse long-text datasets demonstrate that LoPT achieves significant speedup while guaranteeing lossless tokenization. We also provide theoretical proof of consistency and comprehensive analytical studies to validate the robustness of our method.
