---
id: briefing-c693bca90cb0e8d5428f9d965cb1b95a8eece94635d44b6bc82c34dc4ae8fabe
title: >-
  DReX: Pure Vision Fusion of Self-Supervised and Convolutional Representations
  for Image Complexit...
slug: briefing-c693bca90cb0e8d5428f9d965cb1b95a8eece94635d44b6bc82c34dc4ae8fabe
author: 'Jonathan Skaza, Parsa Madinei, Ziqi Wen, Miguel Eckstein'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.16991'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.16991v1 Announce Type: new 

  Abstract: Visual complexity prediction is a fundamental problem in computer
  vision with applications in image compression, retrieval, and classification.
  Underst
---
arXiv:2511.16991v1 Announce Type: new 
Abstract: Visual complexity prediction is a fundamental problem in computer vision with applications in image compression, retrieval, and classification. Understanding what makes humans perceive an image as complex is also a long-standing question in cognitive science. Recent approaches have leveraged multimodal models that combine visual and linguistic representations, but it remains unclear whether language information is necessary for this task. We propose DReX (DINO-ResNet Fusion), a vision-only model that fuses self-supervised and convolutional representations through a learnable attention mechanism to predict image complexity. Our architecture integrates multi-scale hierarchical features from ResNet-50 with semantically rich representations from DINOv3 ViT-S/16, enabling the model to capture both low-level texture patterns and high-level semantic structure. DReX achieves state-of-the-art performance on the IC9600 benchmark (Pearson r = 0.9581), surpassing previous methods--including those trained on multimodal image-text data--while using approximately 21.5x fewer learnable parameters. Furthermore, DReX generalizes robustly across multiple datasets and metrics, achieving superior results on Pearson and Spearman correlation, Root Mean Square Error (RMSE), and Mean Absolute Error (MAE). Ablation and attention analyses confirm that DReX leverages complementary cues from both backbones, with the DINOv3 [CLS] token enhancing sensitivity to visual complexity. Our findings suggest that visual features alone can be sufficient for human-aligned complexity prediction and that, when properly fused, self-supervised transformers and supervised deep convolutional neural networks offer complementary and synergistic benefits for this task.
