<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-45b9f7d4b73b29cfd57d12cdaafde9eb2d05341bbd0a704d07f17bd37d9d02a4
title: >-
  Data Efficiency and Transfer Robustness in Biomedical Image Segmentation: A
  Study of Redundancy and Forgetting with Cellpose
slug: briefing-45b9f7d4b73b29cfd57d12cdaafde9eb2d05341bbd0a704d07f17bd37d9d02a4
author: 'Shuo Zhao, Jianxu Chen'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04803'
status: pending_review
tags:
  - cs.CV
  - cs.AI
  - cs.LG
excerpt: >-
  arXiv:2511.04803v1 Announce Type: cross 

  Abstract: Generalist biomedical image segmentation models such as Cellpose are
  increasingly applied across diverse imaging modalities and cell types.
  However,
---
arXiv:2511.04803v1 Announce Type: cross 
Abstract: Generalist biomedical image segmentation models such as Cellpose are increasingly applied across diverse imaging modalities and cell types. However, two critical challenges remain underexplored: (1) the extent of training data redundancy and (2) the impact of cross domain transfer on model retention. In this study, we conduct a systematic empirical analysis of these challenges using Cellpose as a case study. First, to assess data redundancy, we propose a simple dataset quantization (DQ) strategy for constructing compact yet diverse training subsets. Experiments on the Cyto dataset show that image segmentation performance saturates with only 10% of the data, revealing substantial redundancy and potential for training with minimal annotations. Latent space analysis using MAE embeddings and t-SNE confirms that DQ selected patches capture greater feature diversity than random sampling. Second, to examine catastrophic forgetting, we perform cross domain finetuning experiments and observe significant degradation in source domain performance, particularly when adapting from generalist to specialist domains. We demonstrate that selective DQ based replay reintroducing just 5-10% of the source data effectively restores source performance, while full replay can hinder target adaptation. Additionally, we find that training domain sequencing improves generalization and reduces forgetting in multi stage transfer. Our findings highlight the importance of data centric design in biomedical image segmentation and suggest that efficient training requires not only compact subsets but also retention aware learning strategies and informed domain ordering. The code is available at https://github.com/MMV-Lab/biomedseg-efficiency.
