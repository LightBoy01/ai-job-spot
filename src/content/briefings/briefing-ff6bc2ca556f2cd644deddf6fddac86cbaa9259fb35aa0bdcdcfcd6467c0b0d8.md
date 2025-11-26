<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-ff6bc2ca556f2cd644deddf6fddac86cbaa9259fb35aa0bdcdcfcd6467c0b0d8
title: Less Greedy Equivalence Search
slug: briefing-ff6bc2ca556f2cd644deddf6fddac86cbaa9259fb35aa0bdcdcfcd6467c0b0d8
author: 'Adiba Ejaz, Elias Bareinboim'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2506.22331'
status: pending_review
tags:
  - cs.LG
  - cs.AI
  - stat.ME
  - stat.ML
excerpt: >-
  arXiv:2506.22331v2 Announce Type: replace-cross 

  Abstract: Greedy Equivalence Search (GES) is a classic score-based algorithm
  for causal discovery from observational data. In the sample limit, it reco
---
arXiv:2506.22331v2 Announce Type: replace-cross 
Abstract: Greedy Equivalence Search (GES) is a classic score-based algorithm for causal discovery from observational data. In the sample limit, it recovers the Markov equivalence class of graphs that describe the data. Still, it faces two challenges in practice: computational cost and finite-sample accuracy. In this paper, we develop Less Greedy Equivalence Search (LGES), a variant of GES that retains its theoretical guarantees while partially addressing these limitations. LGES modifies the greedy step; rather than always applying the highest-scoring insertion, it avoids edge insertions between variables for which the score implies some conditional independence. This more targeted search yields up to a \(10\)-fold speed-up and a substantial reduction in structural error relative to GES. Moreover, LGES can guide the search using prior knowledge, and can correct this knowledge when contradicted by data. Finally, LGES can use interventional data to refine the learned observational equivalence class. We prove that LGES recovers the true equivalence class in the sample limit, even with misspecified knowledge. Experiments demonstrate that LGES outperforms GES and other baselines in speed, accuracy, and robustness to misspecified knowledge. Our code is available at https://github.com/CausalAILab/lges.
