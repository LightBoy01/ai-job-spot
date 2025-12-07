---
id: briefing-91a9cf46a032ea19e9a6ce0cf34f22aee6f21be02b7d76371b8d4cc51c4b00dc
title: >-
  Stochastic Approximation with Unbounded Markovian Noise: A General-Purpose
  Theorem
slug: briefing-91a9cf46a032ea19e9a6ce0cf34f22aee6f21be02b7d76371b8d4cc51c4b00dc
author: 'Shaan Ul Haque, Siva Theja Maguluri'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2410.21704'
status: pending_review
tags:
  - cs.LG
  - cs.SY
  - eess.SY
  - math.OC
excerpt: >-
  arXiv:2410.21704v2 Announce Type: replace 

  Abstract: Motivated by engineering applications such as resource allocation in
  networks and inventory systems, we consider average-reward Reinforcement Learn
---
arXiv:2410.21704v2 Announce Type: replace 
Abstract: Motivated by engineering applications such as resource allocation in networks and inventory systems, we consider average-reward Reinforcement Learning with unbounded state space and reward function. Recent works studied this problem in the actor-critic framework and established finite sample bounds assuming access to a critic with certain error guarantees. We complement their work by studying Temporal Difference (TD) learning with linear function approximation and establishing finite-time bounds with the optimal $\mathcal{O}\left(1/\epsilon^2\right)$ sample complexity. These results are obtained using the following general-purpose theorem for non-linear Stochastic Approximation (SA).
  Suppose that one constructs a Lyapunov function for a non-linear SA with certain drift condition. Then, our theorem establishes finite-time bounds when this SA is driven by unbounded Markovian noise under suitable conditions. It serves as a black box tool to generalize sample guarantees on SA from i.i.d. or martingale difference case to potentially unbounded Markovian noise. The generality and the mild assumption of the setup enables broad applicability of our theorem. We illustrate its power by studying two more systems: (i) We improve upon the finite-time bounds of $Q$-learning by tightening the error bounds and also allowing for a larger class of behavior policies. (ii) We establish the first ever finite-time bounds for distributed stochastic optimization of high-dimensional smooth strongly convex function using cyclic block coordinate descent.
