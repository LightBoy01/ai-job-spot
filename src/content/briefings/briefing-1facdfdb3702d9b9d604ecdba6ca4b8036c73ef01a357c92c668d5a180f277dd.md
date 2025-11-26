<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-1facdfdb3702d9b9d604ecdba6ca4b8036c73ef01a357c92c668d5a180f277dd
title: >-
  Masked-and-Reordered Self-Supervision for Reinforcement Learning from
  Verifiable Rewards
slug: briefing-1facdfdb3702d9b9d604ecdba6ca4b8036c73ef01a357c92c668d5a180f277dd
author: 'Zhen Wang, Zhifeng Gao, Guolin Ke'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17473'
status: pending_review
tags:
  - cs.CL
  - cs.AI
  - cs.LG
excerpt: >-
  arXiv:2511.17473v1 Announce Type: cross 

  Abstract: Test-time scaling has been shown to substantially improve large
  language models' (LLMs) mathematical reasoning. However, for a large portion
  of mathe
---
arXiv:2511.17473v1 Announce Type: cross 
Abstract: Test-time scaling has been shown to substantially improve large language models' (LLMs) mathematical reasoning. However, for a large portion of mathematical corpora, especially theorem proving, RLVR's scalability is limited: intermediate reasoning is crucial, while final answers are difficult to directly and reliably verify. Meanwhile, token-level SFT often degenerates into rote memorization rather than inducing longer chains of thought. Inspired by BERT's self-supervised tasks, we propose MR-RLVR (Masked-and-Reordered RLVR), which constructs process-level self-supervised rewards via "masked-then-fill" and "step reordering" to extract learnable signals from intermediate reasoning. Our training pipeline comprises two stages: we first perform self-supervised training on sampled mathematical calculation and proof data; we then conduct RLVR fine-tuning on mathematical calculation datasets where only outcomes are verifiable. We implement MR-RLVR on Qwen2.5-3B and DeepSeek-R1-Distill-Qwen-1.5B, and evaluate on AIME24, AIME25, AMC23, and MATH500. Under a fixed sampling and decoding budget, MR-RLVR achieves average relative gains over the original RLVR of +9.86% Pass@1, +5.27% Pass@5, and +4.00% Pass@8. These results indicate that incorporating process-aware self-supervised signals can effectively enhance RLVR's scalability and performance in only outcome-verifiable settings.
