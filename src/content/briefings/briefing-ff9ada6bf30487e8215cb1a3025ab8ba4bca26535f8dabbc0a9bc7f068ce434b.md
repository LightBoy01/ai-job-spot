<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-ff9ada6bf30487e8215cb1a3025ab8ba4bca26535f8dabbc0a9bc7f068ce434b
title: 'The Finer the Better: Towards Granular-aware Open-set Domain Generalization'
slug: briefing-ff9ada6bf30487e8215cb1a3025ab8ba4bca26535f8dabbc0a9bc7f068ce434b
author: 'Yunyun Wang, Zheng Duan, Xinyue Liao, Ke-Jia Chen, Songcan Chen'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.16979'
status: pending_review
tags:
  - cs.CV
  - cs.AI
excerpt: >-
  arXiv:2511.16979v1 Announce Type: new 

  Abstract: Open-Set Domain Generalization (OSDG) tackles the realistic scenario
  where deployed models encounter both domain shifts and novel object
  categories. De
---
arXiv:2511.16979v1 Announce Type: new 
Abstract: Open-Set Domain Generalization (OSDG) tackles the realistic scenario where deployed models encounter both domain shifts and novel object categories. Despite impressive progress with vision-language models like CLIP, existing methods still fall into the dilemma between structural risk of known-classes and open-space risk from unknown-classes, and easily suffers from over-confidence, especially when distinguishing ``hard unknowns" that share fine-grained visual similarities with known classes. To this end, we propose a Semantic-enhanced CLIP (SeeCLIP) framework that explicitly addresses this dilemma through fine-grained semantic enhancement. In SeeCLIP, we propose a semantic-aware prompt enhancement module to decompose images into discriminative semantic tokens, enabling nuanced vision-language alignment beyond coarse category labels. To position unknown prompts effectively, we introduce duplex contrastive learning with complementary objectives, that is, repulsion to maintain separability from known classes, and cohesion to preserve semantic proximity. Further, our semantic-guided diffusion module synthesizes pseudo-unknowns by perturbing extracted semantic tokens, generating challenging samples that are visually similar to known classes yet exhibit key local differences. These hard negatives force the model to learn finer decision boundaries. Extensive experiments across five benchmarks demonstrate consistent improvements of 3% accuracy and 5% H-score over state-of-the-art methods.
