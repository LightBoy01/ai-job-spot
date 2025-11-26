<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-6cb629665095d349f3aca331ec2bb14050e9debbaab126becff648f22e0d7bd4
title: >-
  DGTN: Graph-Enhanced Transformer with Diffusive Attention Gating Mechanism for
  Enzyme DDG Prediction
slug: briefing-6cb629665095d349f3aca331ec2bb14050e9debbaab126becff648f22e0d7bd4
author: Abigail Lin
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.05483'
status: pending_review
tags:
  - cs.LG
  - cs.AI
excerpt: >-
  arXiv:2511.05483v1 Announce Type: new 

  Abstract: Predicting the effect of amino acid mutations on enzyme
  thermodynamic stability (DDG) is fundamental to protein engineering and drug
  design. While rece
---
arXiv:2511.05483v1 Announce Type: new 
Abstract: Predicting the effect of amino acid mutations on enzyme thermodynamic stability (DDG) is fundamental to protein engineering and drug design. While recent deep learning approaches have shown promise, they often process sequence and structure information independently, failing to capture the intricate coupling between local structural geometry and global sequential patterns. We present DGTN (Diffused Graph-Transformer Network), a novel architecture that co-learns graph neural network (GNN) weights for structural priors and transformer attention through a diffusion mechanism. Our key innovation is a bidirectional diffusion process where: (1) GNN-derived structural embeddings guide transformer attention via learnable diffusion kernels, and (2) transformer representations refine GNN message passing through attention-modulated graph updates. We provide rigorous mathematical analysis showing this co-learning scheme achieves provably better approximation bounds than independent processing. On ProTherm and SKEMPI benchmarks, DGTN achieves state-of-the-art performance (Pearson Rho = 0.87, RMSE = 1.21 kcal/mol), with 6.2% improvement over best baselines. Ablation studies confirm the diffusion mechanism contributes 4.8 points to correlation. Our theoretical analysis proves the diffused attention converges to optimal structure-sequence coupling, with convergence rate O(1/sqrt(T) ) where T is diffusion steps. This work establishes a principled framework for integrating heterogeneous protein representations through learnable diffusion.
