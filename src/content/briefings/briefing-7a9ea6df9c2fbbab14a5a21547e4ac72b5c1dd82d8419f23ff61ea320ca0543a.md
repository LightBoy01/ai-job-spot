<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-7a9ea6df9c2fbbab14a5a21547e4ac72b5c1dd82d8419f23ff61ea320ca0543a
title: Conformal Prediction Adaptive to Unknown Subpopulation Shifts
slug: briefing-7a9ea6df9c2fbbab14a5a21547e4ac72b5c1dd82d8419f23ff61ea320ca0543a
author: 'Nien-Shao Wang, Duygu Nur Yaldiz, Yavuz Faruk Bakman, Sai Praneeth Karimireddy'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2506.05583'
status: pending_review
tags:
  - cs.LG
  - cs.AI
  - stat.ML
excerpt: >-
  arXiv:2506.05583v2 Announce Type: replace-cross 

  Abstract: Conformal prediction is widely used to equip black-box machine
  learning models with uncertainty quantification, offering formal coverage guar
---
arXiv:2506.05583v2 Announce Type: replace-cross 
Abstract: Conformal prediction is widely used to equip black-box machine learning models with uncertainty quantification, offering formal coverage guarantees under exchangeable data. However, these guarantees fail when faced with subpopulation shifts, where the test environment contains a different mix of subpopulations than the calibration data. In this work, we focus on unknown subpopulation shifts where we are not given group-information i.e. the subpopulation labels of datapoints have to be inferred. We propose new methods that provably adapt conformal prediction to such shifts, ensuring valid coverage without explicit knowledge of subpopulation structure. While existing methods in similar setups assume perfect subpopulation labels, our framework explicitly relaxes this requirement and characterizes conditions where formal coverage guarantees remain feasible. Further, our algorithms scale to high-dimensional settings and remain practical in realistic machine learning tasks. Extensive experiments on vision (with vision transformers) and language (with large language models) benchmarks demonstrate that our methods reliably maintain coverage and effectively control risks in scenarios where standard conformal prediction fails.
