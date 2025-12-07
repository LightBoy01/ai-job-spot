---
id: briefing-87ba3495bdcda869c6d6b4cf67afcb082ca7eee048c8614a8c3c809a0d188cc3
title: >-
  Splines-Based Feature Importance in Kolmogorov-Arnold Networks: A Framework
  for Supervised Tabula...
slug: briefing-87ba3495bdcda869c6d6b4cf67afcb082ca7eee048c8614a8c3c809a0d188cc3
author: 'Ange-Cl\''ement Akazan, Verlon Roel Mbingui'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2509.23366'
status: pending_review
tags:
  - cs.LG
excerpt: >-
  arXiv:2509.23366v2 Announce Type: replace 

  Abstract: Feature selection is a key step in many tabular prediction problems,
  where multiple candidate variables may be redundant, noisy, or weakly informat
---
arXiv:2509.23366v2 Announce Type: replace 
Abstract: Feature selection is a key step in many tabular prediction problems, where multiple candidate variables may be redundant, noisy, or weakly informative. We investigate feature selection based on Kolmogorov-Arnold Networks (KANs), which parameterize feature transformations with splines and expose per-feature importance scores in a natural way. From this idea we derive four KAN-based selection criteria (coefficient norms, gradient-based saliency, and knockout scores) and compare them with standard methods such as LASSO, Random Forest feature importance, Mutual Information, and SVM-RFE on a suite of real and synthetic classification and regression datasets. Using average F1 and $R^2$ scores across three feature-retention levels (20%, 40%, 60%), we find that KAN-based selectors are generally competitive with, and sometimes superior to, classical baselines. In classification, KAN criteria often match or exceed existing methods on multi-class tasks by removing redundant features and capturing nonlinear interactions. In regression, KAN-based scores provide robust performance on noisy and heterogeneous datasets, closely tracking strong ensemble predictors; we also observe characteristic failure modes, such as overly aggressive pruning with an $\ell_1$ criterion. Stability and redundancy analyses further show that KAN-based selectors yield reproducible feature subsets across folds while avoiding unnecessary correlation inflation, ensuring reliable and non-redundant variable selection. Overall, our findings demonstrate that KAN-based feature selection provides a powerful and interpretable alternative to traditional methods, capable of uncovering nonlinear and multivariate feature relevance beyond sparsity or impurity-based measures.
