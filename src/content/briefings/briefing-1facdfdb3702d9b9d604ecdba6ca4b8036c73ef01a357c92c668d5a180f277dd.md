---
id: briefing-1facdfdb3702d9b9d604ecdba6ca4b8036c73ef01a357c92c668d5a180f277dd
title: >-
  MR-RLVR: Unlocking Deeper Math Reasoning in LLMs with Process-Aware
  Self-Supervision
slug: briefing-1facdfdb3702d9b9d604ecdba6ca4b8036c73ef01a357c92c668d5a180f277dd
author: 'Zhen Wang, Zhifeng Gao, Guolin Ke'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17473'
status: published
tags:
  - cs.CL
  - cs.AI
  - cs.LG
  - LLMs
  - Reinforcement Learning
  - Self-Supervised Learning
  - Mathematical Reasoning
  - AI Performance
excerpt: >-
  arXiv:2511.17473v1 Announce Type: cross 

  Abstract: Test-time scaling has been shown to substantially improve large
  language models' (LLMs) mathematical reasoning. However, for a large portion
  of mathe
---
### Summary
This paper introduces MR-RLVR (Masked-and-Reordered RLVR), a novel approach to enhance large language models' (LLMs) mathematical reasoning, particularly in complex domains like theorem proving where intermediate steps are crucial but direct verification of final answers for Reinforcement Learning from Verifiable Rewards (RLVR) is difficult. Inspired by BERT, MR-RLVR utilizes process-level self-supervised rewards through \"masked-then-fill\" and \"step reordering\" tasks to extract learnable signals from intermediate reasoning. This two-stage training pipeline, which first conducts self-supervised training on mathematical data and then RLVR fine-tuning on outcome-verifiable datasets, achieved significant performance gains, with up to +9.86% relative Pass@1 improvement over original RLVR on smaller models like Qwen2.5-3B and DeepSeek-R1-Distill-Qwen-1.5B across various mathematical benchmarks.

### Why It Matters
This research represents a crucial step in overcoming a long-standing limitation of LLMs: achieving robust, generalizable mathematical and logical reasoning that goes beyond rote memorization. By focusing on learning from the *process* of reasoning rather than just the final outcome, MR-RLVR provides a blueprint for models to develop true \"chain-of-thought\" capabilities, making them more reliable and less prone to superficial pattern matching. For AI professionals, this is significant because it suggests that substantial advancements in reasoning can be achieved through innovative training paradigms, not solely by endlessly scaling model parameters. This opens doors for smaller, more efficient LLMs to tackle complex problems, democratizing access to powerful AI and enabling deployments in resource-constrained environments. Furthermore, the methodology of extracting self-supervised signals from intermediate steps has far-reaching implications beyond mathematics. It could be applied to enhance reasoning in other domains requiring sequential logic, such as complex code generation, scientific discovery, or even medical diagnostics, where understanding the 'how' is as critical as the 'what'. This hybrid learning approach, blending the strengths of self-supervision for foundational process understanding with reinforcement learning for goal-oriented optimization, offers a powerful path forward for developing more intelligent, transparent, and versatile AI systems.
