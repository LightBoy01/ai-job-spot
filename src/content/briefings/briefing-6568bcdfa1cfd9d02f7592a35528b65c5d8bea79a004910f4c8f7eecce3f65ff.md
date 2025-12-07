---
id: briefing-6568bcdfa1cfd9d02f7592a35528b65c5d8bea79a004910f4c8f7eecce3f65ff
title: 'Video-R4: Reinforcing Text-Rich Video Reasoning with Visual Rumination'
slug: briefing-6568bcdfa1cfd9d02f7592a35528b65c5d8bea79a004910f4c8f7eecce3f65ff
author: >-
  Yolo Yunlong Tang, Daiki Shimada, Hang Hua, Chao Huang, Jing Bi, Rogerio
  Feris, Chenliang Xu
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17490'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.17490v1 Announce Type: new 

  Abstract: Understanding text-rich videos requires reading small, transient
  textual cues that often demand repeated inspection. Yet most video QA models
  rely on s
---
arXiv:2511.17490v1 Announce Type: new 
Abstract: Understanding text-rich videos requires reading small, transient textual cues that often demand repeated inspection. Yet most video QA models rely on single-pass perception over fixed frames, leading to hallucinations and failures on fine-grained evidence. Inspired by how humans pause, zoom, and re-read critical regions, we introduce Video-R4 (Reinforcing Text-Rich Video Reasoning with Visual Rumination), a video reasoning LMM that performs visual rumination: iteratively selecting frames, zooming into informative regions, re-encoding retrieved pixels, and updating its reasoning state. We construct two datasets with executable rumination trajectories: Video-R4-CoT-17k for supervised practice and Video-R4-RL-30k for reinforcement learning. We propose a multi-stage rumination learning framework that progressively finetunes a 7B LMM to learn atomic and mixing visual operations via SFT and GRPO-based RL. Video-R4-7B achieves state-of-the-art results on M4-ViteVQA and further generalizes to multi-page document QA, slides QA, and generic video QA, demonstrating that iterative rumination is an effective paradigm for pixel-grounded multimodal reasoning.
