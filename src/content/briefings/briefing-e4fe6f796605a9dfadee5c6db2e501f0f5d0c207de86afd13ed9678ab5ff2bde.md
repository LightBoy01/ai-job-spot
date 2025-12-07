---
id: briefing-e4fe6f796605a9dfadee5c6db2e501f0f5d0c207de86afd13ed9678ab5ff2bde
title: >-
  Closed-Form Beta Distribution Estimation from Sparse Statistics with Random
  Forest Implicit Regul...
slug: briefing-e4fe6f796605a9dfadee5c6db2e501f0f5d0c207de86afd13ed9678ab5ff2bde
author: Jonathan R. Landers
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2507.23767'
status: pending_review
tags:
  - stat.ML
  - cs.LG
excerpt: >-
  arXiv:2507.23767v2 Announce Type: replace 

  Abstract: This work advances distribution recovery from sparse data and
  ensemble classification through three main contributions. First, we introduce
  a close
---
arXiv:2507.23767v2 Announce Type: replace 
Abstract: This work advances distribution recovery from sparse data and ensemble classification through three main contributions. First, we introduce a closed-form estimator that reconstructs scaled beta distributions from limited statistics (minimum, maximum, mean, and median) via composite quantile and moment matching. The recovered parameters $(\alpha,\beta)$, when used as features in Random Forest classifiers, improve pairwise classification on time-series snapshots, validating the fidelity of the recovered distributions. Second, we establish a link between classification accuracy and distributional closeness by deriving error bounds that constrain total variation distance and Jensen-Shannon divergence, the latter exhibiting quadratic convergence. Third, we show that zero-variance features act as an implicit regularizer, increasing selection probability for mid-ranked predictors and producing deeper, more varied trees. A SeatGeek pricing dataset serves as the primary application, illustrating distributional recovery and event-level classification while situating these methods within the structure and dynamics of the secondary ticket marketplace. The UCI handwritten digits dataset confirms the broader regularization effect. Overall, the study outlines a practical route from sparse distributional snapshots to closed-form estimation and improved ensemble accuracy, with reliability enhanced through implicit regularization.
