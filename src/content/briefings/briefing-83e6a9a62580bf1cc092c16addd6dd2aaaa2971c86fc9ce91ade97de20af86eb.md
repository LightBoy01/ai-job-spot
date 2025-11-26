<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-83e6a9a62580bf1cc092c16addd6dd2aaaa2971c86fc9ce91ade97de20af86eb
title: 'Know What You Don''t Know: Uncertainty Calibration of Process Reward Models'
slug: briefing-83e6a9a62580bf1cc092c16addd6dd2aaaa2971c86fc9ce91ade97de20af86eb
author: 'Young-Jin Park, Kristjan Greenewald, Kaveh Alim, Hao Wang, Navid Azizan'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2506.09338'
status: pending_review
tags:
  - stat.ML
  - cs.AI
  - cs.LG
excerpt: >-
  arXiv:2506.09338v2 Announce Type: replace 

  Abstract: Process reward models (PRMs) play a central role in guiding
  inference-time scaling algorithms for large language models (LLMs). However,
  we observe
---
arXiv:2506.09338v2 Announce Type: replace 
Abstract: Process reward models (PRMs) play a central role in guiding inference-time scaling algorithms for large language models (LLMs). However, we observe that even state-of-the-art PRMs can be poorly calibrated. Specifically, they tend to overestimate the success probability that a partial reasoning step will lead to a correct final answer, particularly when smaller LLMs are used to complete the reasoning trajectory. To address this, we present a calibration approach -- performed via quantile regression -- that adjusts PRM outputs to better align with true success probabilities. Leveraging these calibrated success estimates and their associated confidence bounds, we introduce an \emph{instance-adaptive scaling} (IAS) framework that dynamically adjusts the compute budget based on the estimated likelihood that a partial reasoning trajectory will yield a correct final answer. Unlike conventional methods that allocate a fixed number of reasoning trajectories per query, this approach adapts to each instance and reasoning step when using our calibrated PRMs. Experiments on mathematical reasoning benchmarks show that (i) our PRM calibration method achieves small calibration error, outperforming the baseline methods, (ii) calibration is crucial for enabling effective IAS, and (iii) the proposed IAS strategy reduces inference costs while maintaining final answer accuracy, utilizing less compute on more confident problems as desired.
