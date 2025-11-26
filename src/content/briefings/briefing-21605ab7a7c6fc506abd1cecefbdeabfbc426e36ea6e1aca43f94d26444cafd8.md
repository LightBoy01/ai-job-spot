<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-21605ab7a7c6fc506abd1cecefbdeabfbc426e36ea6e1aca43f94d26444cafd8
title: >-
  No One-Model-Fits-All: Uncovering Spatio-Temporal Forecasting Trade-offs with
  Graph Neural Networks and Foundation Models
slug: briefing-21605ab7a7c6fc506abd1cecefbdeabfbc426e36ea6e1aca43f94d26444cafd8
author: >-
  Ragini Gupta, Naman Raina, Bo Chen, Li Chen, Claudiu Danilov, Josh Eckhardt,
  Keyshla Bernard, Klara Nahrstedt
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.05179'
status: pending_review
tags:
  - cs.LG
  - cs.AI
  - cs.NI
excerpt: >-
  arXiv:2511.05179v1 Announce Type: new 

  Abstract: Modern IoT deployments for environmental sensing produce high volume
  spatiotemporal data to support downstream tasks such as forecasting, typically
  pow
---
arXiv:2511.05179v1 Announce Type: new 
Abstract: Modern IoT deployments for environmental sensing produce high volume spatiotemporal data to support downstream tasks such as forecasting, typically powered by machine learning models. While existing filtering and strategic deployment techniques optimize collected data volume at the edge, they overlook how variations in sampling frequencies and spatial coverage affect downstream model performance. In many forecasting models, incorporating data from additional sensors denoise predictions by providing broader spatial contexts. This interplay between sampling frequency, spatial coverage and different forecasting model architectures remain underexplored. This work presents a systematic study of forecasting models - classical models (VAR), neural networks (GRU, Transformer), spatio-temporal graph neural networks (STGNNs), and time series foundation models (TSFMs: Chronos Moirai, TimesFM) under varying spatial sensor nodes density and sampling intervals using real-world temperature data in a wireless sensor network. Our results show that STGNNs are effective when sensor deployments are sparse and sampling rate is moderate, leveraging spatial correlations via encoded graph structure to compensate for limited coverage. In contrast, TSFMs perform competitively at high frequencies but degrade when spatial coverage from neighboring sensors is reduced. Crucially, the multivariate TSFM Moirai outperforms all models by natively learning cross-sensor dependencies. These findings offer actionable insights for building efficient forecasting pipelines in spatio-temporal systems. All code for model configurations, training, dataset, and logs are open-sourced for reproducibility: https://github.com/UIUC-MONET-Projects/Benchmarking-Spatiotemporal-Forecast-Models
