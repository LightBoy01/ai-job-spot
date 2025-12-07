---
id: briefing-da4c2a5bcc9e428193f6fcb5174cf773b7003f9678ef7c5a9bdcbfe3ab20d231
title: Diversity Has Always Been There in Your Visual Autoregressive Models
slug: briefing-da4c2a5bcc9e428193f6fcb5174cf773b7003f9678ef7c5a9bdcbfe3ab20d231
author: >-
  Tong Wang, Guanyu Yang, Nian Liu, Kai Wang, Yaxing Wang, Abdelrahman M Shaker,
  Salman Khan, Fahad Shahbaz Khan, Senmao Li
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17074'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.17074v1 Announce Type: new 

  Abstract: Visual Autoregressive (VAR) models have recently garnered
  significant attention for their innovative next-scale prediction paradigm,
  offering notable a
---
arXiv:2511.17074v1 Announce Type: new 
Abstract: Visual Autoregressive (VAR) models have recently garnered significant attention for their innovative next-scale prediction paradigm, offering notable advantages in both inference efficiency and image quality compared to traditional multi-step autoregressive (AR) and diffusion models. However, despite their efficiency, VAR models often suffer from the diversity collapse i.e., a reduction in output variability, analogous to that observed in few-step distilled diffusion models. In this paper, we introduce DiverseVAR, a simple yet effective approach that restores the generative diversity of VAR models without requiring any additional training. Our analysis reveals the pivotal component of the feature map as a key factor governing diversity formation at early scales. By suppressing the pivotal component in the model input and amplifying it in the model output, DiverseVAR effectively unlocks the inherent generative potential of VAR models while preserving high-fidelity synthesis. Empirical results demonstrate that our approach substantially enhances generative diversity with only neglectable performance influences. Our code will be publicly released at https://github.com/wangtong627/DiverseVAR.
