<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-3e8d1caf35ce57e7b1a5305e0d949addbe1cc86f496ced688f63e2e2beb060f2
title: >-
  Scaling Self-Supervised and Cross-Modal Pretraining for Volumetric CT
  Transformers
slug: briefing-3e8d1caf35ce57e7b1a5305e0d949addbe1cc86f496ced688f63e2e2beb060f2
author: >-
  Cris Claessens, Christiaan Viviers, Giacomo D'Amicantonio, Egor Bondarev, Fons
  van der Sommen
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17209'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.17209v1 Announce Type: new 

  Abstract: We introduce SPECTRE, a fully transformer-based foundation model for
  volumetric computed tomography (CT). Our Self-Supervised & Cross-Modal
  Pretraining
---
arXiv:2511.17209v1 Announce Type: new 
Abstract: We introduce SPECTRE, a fully transformer-based foundation model for volumetric computed tomography (CT). Our Self-Supervised & Cross-Modal Pretraining for CT Representation Extraction (SPECTRE) approach utilizes scalable 3D Vision Transformer architectures and modern self-supervised and vision-language pretraining strategies to learn general-purpose CT representations. Volumetric CT poses unique challenges, such as extreme token scaling, geometric anisotropy, and weak or noisy clinical supervision, that make standard transformer and contrastive learning recipes ineffective out of the box. The framework jointly optimizes a local transformer for high-resolution volumetric feature extraction and a global transformer for whole-scan context modeling, making large-scale 3D attention computationally tractable. Notably, SPECTRE is trained exclusively on openly available CT datasets, demonstrating that high-performing, generalizable representations can be achieved without relying on private data. Pretraining combines DINO-style self-distillation with SigLIP-based vision-language alignment using paired radiology reports, yielding features that are both geometrically consistent and clinically meaningful. Across multiple CT benchmarks, SPECTRE consistently outperforms prior CT foundation models in both zero-shot and fine-tuned settings, establishing SPECTRE as a scalable, open, and fully transformer-based foundation model for 3D medical imaging.
