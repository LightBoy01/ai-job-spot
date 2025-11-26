<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-299463f38fed1355a694805cec625c427edebdd3cd9a8d0ccf7e83ebdedc5bad
title: 'ManufactuBERT: Efficient Continual Pretraining for Manufacturing'
slug: briefing-299463f38fed1355a694805cec625c427edebdd3cd9a8d0ccf7e83ebdedc5bad
author: 'Robin Armingaud, Romaric Besan\c{c}on'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.05135'
status: pending_review
tags:
  - cs.CL
excerpt: >-
  arXiv:2511.05135v1 Announce Type: new 

  Abstract: While large general-purpose Transformer-based encoders excel at
  general language understanding, their performance diminishes in specialized
  domains lik
---
arXiv:2511.05135v1 Announce Type: new 
Abstract: While large general-purpose Transformer-based encoders excel at general language understanding, their performance diminishes in specialized domains like manufacturing due to a lack of exposure to domain-specific terminology and semantics. In this paper, we address this gap by introducing ManufactuBERT, a RoBERTa model continually pretrained on a large-scale corpus curated for the manufacturing domain. We present a comprehensive data processing pipeline to create this corpus from web data, involving an initial domain-specific filtering step followed by a multi-stage deduplication process that removes redundancies. Our experiments show that ManufactuBERT establishes a new state-of-the-art on a range of manufacturing-related NLP tasks, outperforming strong specialized baselines. More importantly, we demonstrate that training on our carefully deduplicated corpus significantly accelerates convergence, leading to a 33\% reduction in training time and computational cost compared to training on the non-deduplicated dataset. The proposed pipeline offers a reproducible example for developing high-performing encoders in other specialized domains. We will release our model and curated corpus at https://huggingface.co/cea-list-ia.
