<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-ca5629bdd9f302daf8c9417b7051cdf1e0e8c54cfe8ac92b96dd5d206a7b1e83
title: >-
  Generalization in Representation Models via Random Matrix Theory: Application
  to Recurrent Networks
slug: briefing-ca5629bdd9f302daf8c9417b7051cdf1e0e8c54cfe8ac92b96dd5d206a7b1e83
author: >-
  Yessin Moakher (X), Malik Tiomoko (CUHK-Shenzhen), Cosme Louart
  (CUHK-Shenzhen), Zhenyu Liao (HUST)
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.02401'
status: pending_review
tags:
  - math.ST
  - cs.LG
  - stat.ML
  - stat.TH
excerpt: >-
  arXiv:2511.02401v1 Announce Type: cross 

  Abstract: We first study the generalization error of models that use a fixed
  feature representation (frozen intermediate layers) followed by a trainable
  readou
---
arXiv:2511.02401v1 Announce Type: cross 
Abstract: We first study the generalization error of models that use a fixed feature representation (frozen intermediate layers) followed by a trainable readout layer. This setting encompasses a range of architectures, from deep random-feature models to echo-state networks (ESNs) with recurrent dynamics. Working in the high-dimensional regime, we apply Random Matrix Theory to derive a closed-form expression for the asymptotic generalization error. We then apply this analysis to recurrent representations and obtain concise formula that characterize their performance. Surprisingly, we show that a linear ESN is equivalent to ridge regression with an exponentially time-weighted (''memory'') input covariance, revealing a clear inductive bias toward recent inputs. Experiments match predictions: ESNs win in low-sample, short-memory regimes, while ridge prevails with more data or long-range dependencies. Our methodology provides a general framework for analyzing overparameterized models and offers insights into the behavior of deep learning networks.
