<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-90e796a96b979e5c9bea46fcfb7e0e3ed0ed82fa7a2b1c0295b1c1b3714defdd
title: >-
  Multi-modal Loop Closure Detection with Foundation Models in Severely
  Unstructured Environments
slug: briefing-90e796a96b979e5c9bea46fcfb7e0e3ed0ed82fa7a2b1c0295b1c1b3714defdd
author: >-
  Laura Alejandra Encinar Gonzalez, John Folkesson, Rudolph Triebel, Riccardo
  Giubilato
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.05404'
status: pending_review
tags:
  - cs.CV
  - cs.AI
excerpt: >-
  arXiv:2511.05404v1 Announce Type: new 

  Abstract: Robust loop closure detection is a critical component of
  Simultaneous Localization and Mapping (SLAM) algorithms in GNSS-denied
  environments, such as i
---
arXiv:2511.05404v1 Announce Type: new 
Abstract: Robust loop closure detection is a critical component of Simultaneous Localization and Mapping (SLAM) algorithms in GNSS-denied environments, such as in the context of planetary exploration. In these settings, visual place recognition often fails due to aliasing and weak textures, while LiDAR-based methods suffer from sparsity and ambiguity. This paper presents MPRF, a multimodal pipeline that leverages transformer-based foundation models for both vision and LiDAR modalities to achieve robust loop closure in severely unstructured environments. Unlike prior work limited to retrieval, MPRF integrates a two-stage visual retrieval strategy with explicit 6-DoF pose estimation, combining DINOv2 features with SALAD aggregation for efficient candidate screening and SONATA-based LiDAR descriptors for geometric verification. Experiments on the S3LI dataset and S3LI Vulcano dataset show that MPRF outperforms state-of-the-art retrieval methods in precision while enhancing pose estimation robustness in low-texture regions. By providing interpretable correspondences suitable for SLAM back-ends, MPRF achieves a favorable trade-off between accuracy, efficiency, and reliability, demonstrating the potential of foundation models to unify place recognition and pose estimation. Code and models will be released at github.com/DLR-RM/MPRF.
