<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-67089f7b3378b1ad00fca1aaeaf3262950dc633a3142b4b1cffaa5a82c1cfba9
title: >-
  Seeing the Forest and the Trees: Query-Aware Tokenizer for Long-Video
  Multimodal Language Models
slug: briefing-67089f7b3378b1ad00fca1aaeaf3262950dc633a3142b4b1cffaa5a82c1cfba9
author: >-
  Siyou Li, Huanan Wu, Juexi Shao, Yinghao Ma, Yujian Gan, Yihao Luo, Yuwei
  Wang, Dong Nie, Lu Wang, Wengqing Wu, Le Zhang, Massimo Poesio, Juntao Yu
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.11910'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.11910v2 Announce Type: replace 

  Abstract: Despite the recent advances in the video understanding ability of
  multimodal large language models (MLLMs), long video understanding remains a
  chal
---
arXiv:2511.11910v2 Announce Type: replace 
Abstract: Despite the recent advances in the video understanding ability of multimodal large language models (MLLMs), long video understanding remains a challenge. One of the main issues is that the number of vision tokens grows linearly with video length, which causes an explosion in attention cost, memory, and latency. To solve this challenge, we present Query-aware Token Selector (\textbf{QTSplus}), a lightweight yet powerful visual token selection module that serves as an information gate between the vision encoder and LLMs. Given a text query and video tokens, QTSplus dynamically selects the most important visual evidence for the input text query by (i) scoring visual tokens via cross-attention, (ii) \emph{predicting} an instance-specific retention budget based on the complexity of the query, and (iii) \emph{selecting} Top-$n$ tokens with a differentiable straight-through estimator during training and a hard gate at inference. Furthermore, a small re-encoder preserves temporal order using absolute time information, enabling second-level localization while maintaining global coverage.
  Integrated into Qwen2.5-VL, QTSplus compresses the vision stream by up to \textbf{89\%} and reduces end-to-end latency by \textbf{28\%} on long videos. The evaluation on eight long video understanding benchmarks shows near-parity accuracy overall when compared with the original Qwen models and outperforms the original model by \textbf{+20.5} and \textbf{+5.6} points respectively on TempCompass direction and order accuracies. These results show that QTSplus is an effective, general mechanism for scaling MLLMs to real-world long-video scenarios while preserving task-relevant evidence.
