<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-b9cbb7e7c3aadaca15bd9b947b1623278eda18c1746fb403c6de4e32e6ac6dd2
title: 'DSeq-JEPA: Discriminative Sequential Joint-Embedding Predictive Architecture'
slug: briefing-b9cbb7e7c3aadaca15bd9b947b1623278eda18c1746fb403c6de4e32e6ac6dd2
author: >-
  Xiangteng He, Shunsuke Sakai, Kun Yuan, Nicolas Padoy, Tatsuhito Hasegawa,
  Leonid Sigal
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17354'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.17354v1 Announce Type: new 

  Abstract: Image-based Joint-Embedding Predictive Architecture (I-JEPA) learns
  visual representations by predicting latent embeddings of masked regions from
  visib
---
arXiv:2511.17354v1 Announce Type: new 
Abstract: Image-based Joint-Embedding Predictive Architecture (I-JEPA) learns visual representations by predicting latent embeddings of masked regions from visible context. However, it treats all regions uniformly and independently, lacking an explicit notion of where or in what order predictions should be made. Inspired by human visual perception, which deploys attention selectively and sequentially from the most informative to secondary regions, we propose DSeq-JEPA, a Discriminative Sequential Joint-Embedding Predictive Architecture that bridges predictive and autoregressive self-supervised learning, integrating JEPA-style latent prediction with GPT-style sequential reasoning. Specifically, DSeq-JEPA (i) first identifies primary discriminative regions based on a transformer-derived saliency map, emphasizing the distribution of visual importance, and then (ii) predicts subsequent regions in this discriminative order, progressively forming a curriculum-like semantic progression from primary to secondary cues -- a form of GPT-style pre-training. Extensive experiments across diverse tasks, including image classification (ImageNet), fine-grained visual categorization (iNaturalist21, CUB-200-2011, Stanford-Cars), detection and segmentation (MS-COCO, ADE20K), and low-level reasoning tasks (Clevr/Count, Clevr/Dist), demonstrate that DSeq-JEPA consistently focuses on more discriminative and generalizable representations than I-JEPA variants. Project page: https://github.com/SkyShunsuke/DSeq-JEPA.
