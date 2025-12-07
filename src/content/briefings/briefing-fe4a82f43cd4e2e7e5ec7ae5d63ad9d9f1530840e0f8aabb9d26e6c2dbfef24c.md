---
id: briefing-fe4a82f43cd4e2e7e5ec7ae5d63ad9d9f1530840e0f8aabb9d26e6c2dbfef24c
title: Selective Rotary Position Embedding
slug: briefing-fe4a82f43cd4e2e7e5ec7ae5d63ad9d9f1530840e0f8aabb9d26e6c2dbfef24c
author: >-
  Sajad Movahedi, Timur Carstensen, Arshia Afzal, Frank Hutter, Antonio Orvieto,
  Volkan Cevher
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17388'
status: pending_review
tags:
  - cs.CL
  - cs.LG
excerpt: >-
  arXiv:2511.17388v1 Announce Type: cross 

  Abstract: Position information is essential for language modeling. In softmax
  transformers, Rotary Position Embeddings (\textit{RoPE}) encode positions
  through
---
arXiv:2511.17388v1 Announce Type: cross 
Abstract: Position information is essential for language modeling. In softmax transformers, Rotary Position Embeddings (\textit{RoPE}) encode positions through \textit{fixed-angle} rotations, while in linear transformers, order is handled via input-dependent (selective) gating that decays past key-value associations. Selectivity has generally been shown to improve language-related tasks. Inspired by this, we introduce \textit{Selective RoPE}, an \textit{input-dependent} rotary embedding mechanism, that generalizes \textit{RoPE}, and enables rotation in \textit{arbitrary angles} for both linear and softmax transformers. We show that softmax attention already performs a hidden form of these rotations on query-key pairs, uncovering an implicit positional structure. We further show that in state-space models and gated linear transformers, the real part manages forgetting while the imaginary part encodes positions through rotations. We validate our method by equipping gated transformers with \textit{Selective RoPE}, demonstrating that its input-dependent rotations improve performance in language modeling and on difficult sequence tasks like copying, state tracking, and retrieval.
