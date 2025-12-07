---
id: briefing-cfbb83d2cead5dd40fb08704dcdedaf4646d7ec671a672f8e3b414dfeda57f96
title: >-
  Trained on Tokens, Calibrated on Concepts: The Emergence of Semantic
  Calibration in LLMs
slug: briefing-cfbb83d2cead5dd40fb08704dcdedaf4646d7ec671a672f8e3b414dfeda57f96
author: >-
  Preetum Nakkiran, Arwen Bradley, Adam Goli\'nski, Eugene Ndiaye, Michael
  Kirchhof, Sinead Williamson
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: stat.ML updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04869'
status: pending_review
tags:
  - cs.CL
  - cs.LG
  - stat.ML
excerpt: >-
  arXiv:2511.04869v1 Announce Type: cross 

  Abstract: Large Language Models (LLMs) often lack meaningful confidence
  estimates for their outputs. While base LLMs are known to exhibit next-token
  calibratio
---
arXiv:2511.04869v1 Announce Type: cross 
Abstract: Large Language Models (LLMs) often lack meaningful confidence estimates for their outputs. While base LLMs are known to exhibit next-token calibration, it remains unclear whether they can assess confidence in the actual meaning of their responses beyond the token level. We find that, when using a certain sampling-based notion of semantic calibration, base LLMs are remarkably well-calibrated: they can meaningfully assess confidence in open-domain question-answering tasks, despite not being explicitly trained to do so. Our main theoretical contribution establishes a mechanism for why semantic calibration emerges as a byproduct of next-token prediction, leveraging a recent connection between calibration and local loss optimality. The theory relies on a general definition of "B-calibration," which is a notion of calibration parameterized by a choice of equivalence classes (semantic or otherwise). This theoretical mechanism leads to a testable prediction: base LLMs will be semantically calibrated when they can easily predict their own distribution over semantic answer classes before generating a response. We state three implications of this prediction, which we validate through experiments: (1) Base LLMs are semantically calibrated across question-answering tasks, (2) RL instruction-tuning systematically breaks this calibration, and (3) chain-of-thought reasoning breaks calibration. To our knowledge, our work provides the first principled explanation of when and why semantic calibration emerges in LLMs.
