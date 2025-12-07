---
id: briefing-4c6f1b73d49c0f2949bb75edacbac3d187dc66b7b63b356b8d3e9a8fb23a56d1
title: >-
  Online selective conformal inference: adaptive scores, convergence rate and
  optimality
slug: briefing-4c6f1b73d49c0f2949bb75edacbac3d187dc66b7b63b356b8d3e9a8fb23a56d1
author: 'Pierre Humbert, Ulysse Gazin, Ruth Heller, Etienne Roquain'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2508.10336'
status: pending_review
tags:
  - math.ST
  - stat.ML
  - stat.TH
excerpt: >-
  arXiv:2508.10336v2 Announce Type: replace-cross 

  Abstract: In a supervised online setting, quantifying uncertainty has been
  proposed in the seminal work of \cite{gibbs2021adaptive}. For any given poin
---
arXiv:2508.10336v2 Announce Type: replace-cross 
Abstract: In a supervised online setting, quantifying uncertainty has been proposed in the seminal work of \cite{gibbs2021adaptive}. For any given point-prediction algorithm, their method (ACI) produces a conformal prediction set with an average missed coverage getting close to a pre-specified level $\alpha$ for a long time horizon. We introduce an extended version of this algorithm, called OnlineSCI, allowing the user to additionally select times where such an inference should be made. OnlineSCI encompasses several prominent online selective tasks, such as building prediction intervals for extreme outcomes, classification with abstention, and online testing. While OnlineSCI controls the average missed coverage on the selected in an adversarial setting, our theoretical results also show that it controls the instantaneous error rate (IER) at the selected times, up to a non-asymptotical remainder term. Importantly, our theory covers the case where OnlineSCI updates the point-prediction algorithm at each time step, a property which we refer to as {\it adaptive} capability. We show that the adaptive versions of OnlineSCI can convergence to an optimal solution and provide an explicit convergence rate in each of the aforementioned application cases, under specific mild conditions. Finally, the favorable behavior of OnlineSCI in practice is illustrated by numerical experiments.
