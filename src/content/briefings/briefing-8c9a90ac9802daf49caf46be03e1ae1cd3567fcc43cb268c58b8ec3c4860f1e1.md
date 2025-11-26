<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-8c9a90ac9802daf49caf46be03e1ae1cd3567fcc43cb268c58b8ec3c4860f1e1
title: 'Role-SynthCLIP: A Role Play Driven Diverse Synthetic Data Approach'
slug: briefing-8c9a90ac9802daf49caf46be03e1ae1cd3567fcc43cb268c58b8ec3c4860f1e1
author: 'Yuanxiang Huangfu, Chaochao Wang, Weilei Wang'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.05057'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.05057v1 Announce Type: new 

  Abstract: The effectiveness of Contrastive Language-Image Pre-training (CLIP)
  models critically depends on the semantic diversity and quality of their
  training d
---
arXiv:2511.05057v1 Announce Type: new 
Abstract: The effectiveness of Contrastive Language-Image Pre-training (CLIP) models critically depends on the semantic diversity and quality of their training data. However, while existing synthetic data generation methods primarily focus on increasing data volume, such emphasis often leads to limited semantic diversity and redundant or shallow captions. To address this limitation, we propose Role-SynthCLIP, a novel data synthesis framework that leverages multi-perspective role-playing prompts (e.g., a compositional analyst, an interpreter of image context) to guide Multimodal Large Language Models (MLLMs) in generating semantically diverse captions from distinct viewpoints. This mechanism enhances the semantic diversity and fine-grained image-text alignment of synthetic pairs, thereby improving caption expressiveness and accuracy while keeping the total number of image-text pairs unchanged. Experimental results demonstrate the effectiveness and efficiency of our method. A CLIP-B/16 model trained on only 1 million Role-SynthCLIP pairs achieves a Recall@1 of 64.1% on the MS COCO validation set, surpassing the best existing synthetic data baseline (trained on 5M pairs) by 2.8 percentage points. The code and trained models are released at https://github.com/huangfu170/Role-SynthCLIP.
