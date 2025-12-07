---
id: briefing-997c3f6a7e5220c01accab764d73ad2909f6e7cbbab88d2fae08b05f453d5a2a
title: 'LoRAQuant: Mixed-Precision Quantization of LoRA to Ultra-Low Bits'
slug: briefing-997c3f6a7e5220c01accab764d73ad2909f6e7cbbab88d2fae08b05f453d5a2a
author: 'Amir Reza Mirzaei, Yuqiao Wen, Yanshuai Cao, Lili Mou'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2510.26690'
status: pending_review
tags:
  - cs.LG
excerpt: >-
  arXiv:2510.26690v2 Announce Type: replace 

  Abstract: Low-Rank Adaptation (LoRA) has become a popular technique for
  parameter-efficient fine-tuning of large language models (LLMs). In many
  real-world s
---
arXiv:2510.26690v2 Announce Type: replace 
Abstract: Low-Rank Adaptation (LoRA) has become a popular technique for parameter-efficient fine-tuning of large language models (LLMs). In many real-world scenarios, multiple adapters are loaded simultaneously to enable LLM customization for personalized user experiences or to support a diverse range of tasks. Although each adapter is lightweight in isolation, their aggregate cost becomes substantial at scale. To address this, we propose LoRAQuant, a mixed-precision post-training quantization method tailored to LoRA. Specifically, LoRAQuant reparameterizes each adapter by singular value decomposition (SVD) to concentrate the most important information into specific rows and columns. This makes it possible to quantize the important components to higher precision, while quantizing the rest to ultra-low bitwidth. We conduct comprehensive experiments with LLaMA 2-7B, LLaMA 2-13B, and Mistral 7B models on mathematical reasoning, coding, and summarization tasks. Results show that our LoRAQuant uses significantly lower bits than other quantization methods, but achieves comparable or even higher performance.
