<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-1fc4bc1777caa24060216396e5b92afaad9fb2cb724aaccc39e0fb1a484aeb5f
title: 3D Gaussian Point Encoders
slug: briefing-1fc4bc1777caa24060216396e5b92afaad9fb2cb724aaccc39e0fb1a484aeb5f
author: 'Jim James, Ben Wilson, Simon Lucey, James Hays'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04797'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.04797v1 Announce Type: new 

  Abstract: In this work, we introduce the 3D Gaussian Point Encoder, an
  explicit per-point embedding built on mixtures of learned 3D Gaussians. This
  explicit geom
---
arXiv:2511.04797v1 Announce Type: new 
Abstract: In this work, we introduce the 3D Gaussian Point Encoder, an explicit per-point embedding built on mixtures of learned 3D Gaussians. This explicit geometric representation for 3D recognition tasks is a departure from widely used implicit representations such as PointNet. However, it is difficult to learn 3D Gaussian encoders in end-to-end fashion with standard optimizers. We develop optimization techniques based on natural gradients and distillation from PointNets to find a Gaussian Basis that can reconstruct PointNet activations. The resulting 3D Gaussian Point Encoders are faster and more parameter efficient than traditional PointNets. As in the 3D reconstruction literature where there has been considerable interest in the move from implicit (e.g., NeRF) to explicit (e.g., Gaussian Splatting) representations, we can take advantage of computational geometry heuristics to accelerate 3D Gaussian Point Encoders further. We extend filtering techniques from 3D Gaussian Splatting to construct encoders that run 2.7 times faster as a comparable accuracy PointNet while using 46% less memory and 88% fewer FLOPs. Furthermore, we demonstrate the effectiveness of 3D Gaussian Point Encoders as a component in Mamba3D, running 1.27 times faster and achieving a reduction in memory and FLOPs by 42% and 54% respectively. 3D Gaussian Point Encoders are lightweight enough to achieve high framerates on CPU-only devices.
