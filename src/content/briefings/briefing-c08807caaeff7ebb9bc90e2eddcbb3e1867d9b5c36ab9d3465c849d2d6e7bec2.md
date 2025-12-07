---
id: briefing-c08807caaeff7ebb9bc90e2eddcbb3e1867d9b5c36ab9d3465c849d2d6e7bec2
title: Real Noise Decoupling for Hyperspectral Image Denoising
slug: briefing-c08807caaeff7ebb9bc90e2eddcbb3e1867d9b5c36ab9d3465c849d2d6e7bec2
author: 'Yingkai Zhang, Tao Zhang, Jing Nie, Ying Fu'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17196'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.17196v1 Announce Type: new 

  Abstract: Hyperspectral image (HSI) denoising is a crucial step in enhancing
  the quality of HSIs. Noise modeling methods can fit noise distributions to
  generate
---
arXiv:2511.17196v1 Announce Type: new 
Abstract: Hyperspectral image (HSI) denoising is a crucial step in enhancing the quality of HSIs. Noise modeling methods can fit noise distributions to generate synthetic HSIs to train denoising networks. However, the noise in captured HSIs is usually complex and difficult to model accurately, which significantly limits the effectiveness of these approaches. In this paper, we propose a multi-stage noise-decoupling framework that decomposes complex noise into explicitly modeled and implicitly modeled components. This decoupling reduces the complexity of noise and enhances the learnability of HSI denoising methods when applied to real paired data. Specifically, for explicitly modeled noise, we utilize an existing noise model to generate paired data for pre-training a denoising network, equipping it with prior knowledge to handle the explicitly modeled noise effectively. For implicitly modeled noise, we introduce a high-frequency wavelet guided network. Leveraging the prior knowledge from the pre-trained module, this network adaptively extracts high-frequency features to target and remove the implicitly modeled noise from real paired HSIs. Furthermore, to effectively eliminate all noise components and mitigate error accumulation across stages, a multi-stage learning strategy, comprising separate pre-training and joint fine-tuning, is employed to optimize the entire framework. Extensive experiments on public and our captured datasets demonstrate that our proposed framework outperforms state-of-the-art methods, effectively handling complex real-world noise and significantly enhancing HSI quality.
