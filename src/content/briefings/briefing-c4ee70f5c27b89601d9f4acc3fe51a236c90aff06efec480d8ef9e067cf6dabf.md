<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-c4ee70f5c27b89601d9f4acc3fe51a236c90aff06efec480d8ef9e067cf6dabf
title: >-
  RCCDA: Adaptive Model Updates in the Presence of Concept Drift under a
  Constrained Resource Budget
slug: briefing-c4ee70f5c27b89601d9f4acc3fe51a236c90aff06efec480d8ef9e067cf6dabf
author: >-
  Adam Piaseczny, Md Kamran Chowdhury Shisher, Shiqiang Wang, Christopher G.
  Brinton
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2505.24149'
status: pending_review
tags:
  - cs.LG
  - cs.AI
excerpt: >-
  arXiv:2505.24149v2 Announce Type: replace 

  Abstract: Machine learning (ML) algorithms deployed in real-world environments
  are often faced with the challenge of adapting models to concept drift, where
---
arXiv:2505.24149v2 Announce Type: replace 
Abstract: Machine learning (ML) algorithms deployed in real-world environments are often faced with the challenge of adapting models to concept drift, where the task data distributions are shifting over time. The problem becomes even more difficult when model performance must be maintained under adherence to strict resource constraints. Existing solutions often depend on drift-detection methods that produce high computational overhead for resource-constrained environments, and fail to provide strict guarantees on resource usage or theoretical performance assurances. To address these shortcomings, we propose RCCDA: a dynamic model update policy that optimizes ML training dynamics while ensuring compliance to predefined resource constraints, utilizing only past loss information and a tunable drift threshold. In developing our policy, we analytically characterize the evolution of model loss under concept drift with arbitrary training update decisions. Integrating these results into a Lyapunov drift-plus-penalty framework produces a lightweight greedy-optimal policy that provably limits update frequency and cost. Experimental results on four domain generalization datasets demonstrate that our policy outperforms baseline methods in inference accuracy while adhering to strict resource constraints under several schedules of concept drift, making our solution uniquely suited for real-time ML deployments.
