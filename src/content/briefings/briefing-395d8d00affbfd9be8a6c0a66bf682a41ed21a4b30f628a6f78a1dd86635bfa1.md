---
id: briefing-395d8d00affbfd9be8a6c0a66bf682a41ed21a4b30f628a6f78a1dd86635bfa1
title: 'LoKO: Low-Rank Kalman Optimizer for Online Fine-Tuning of Large Models'
slug: briefing-395d8d00affbfd9be8a6c0a66bf682a41ed21a4b30f628a6f78a1dd86635bfa1
author: 'Hossein Abdi, Mingfei Sun, Andi Zhang, Samuel Kaski, Wei Pan'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2410.11551'
status: pending_review
tags:
  - cs.LG
excerpt: >-
  arXiv:2410.11551v2 Announce Type: replace 

  Abstract: Training large models with millions or even billions of parameters
  from scratch incurs substantial computational costs. Parameter Efficient
  Fine-Tu
---
arXiv:2410.11551v2 Announce Type: replace 
Abstract: Training large models with millions or even billions of parameters from scratch incurs substantial computational costs. Parameter Efficient Fine-Tuning (PEFT) methods, particularly Low-Rank Adaptation (LoRA), address this challenge by adapting only a reduced number of parameters to specific tasks with gradient-based optimizers. In this paper, we cast PEFT as an optimal filtering/state estimation problem and present Low-Rank Kalman Optimizer (LoKO) to estimate the optimal trainable parameters in an online manner. We leverage the low-rank decomposition in LoRA to significantly reduce matrix sizes in Kalman iterations and further capitalize on a diagonal approximation of the covariance matrix to effectively decrease computational complexity from quadratic to linear in the number of trainable parameters. Moreover, we discovered that the initialization of the covariance matrix within the Kalman algorithm and the accurate estimation of the observation noise covariance are the keys in this formulation, and we propose robust approaches that work well across a vast range of well-established computer vision and language models. Our results show that LoKO converges with fewer iterations and yields better performance models compared to commonly used optimizers with LoRA in both image classifications and language tasks. Our study opens up the possibility of leveraging the Kalman filter as an effective optimizer for the online fine-tuning of large models.
