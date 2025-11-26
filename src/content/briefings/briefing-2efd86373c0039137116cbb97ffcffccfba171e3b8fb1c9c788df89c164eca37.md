<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-2efd86373c0039137116cbb97ffcffccfba171e3b8fb1c9c788df89c164eca37
title: >-
  Reinforced Generation of Combinatorial Structures: Applications to Complexity
  Theory
slug: briefing-2efd86373c0039137116cbb97ffcffccfba171e3b8fb1c9c788df89c164eca37
author: 'Ansh Nagda, Prabhakar Raghavan, Abhradeep Thakurta'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2509.18057'
status: pending_review
tags:
  - cs.LG
  - cs.AI
  - cs.CC
  - math.CO
excerpt: >-
  arXiv:2509.18057v5 Announce Type: replace 

  Abstract: Can AI based methods help us make advances in complexity theory? We
  provide evidence towards answering this in the affirmative, using AlphaEvolve
  (
---
arXiv:2509.18057v5 Announce Type: replace 
Abstract: Can AI based methods help us make advances in complexity theory? We provide evidence towards answering this in the affirmative, using AlphaEvolve (an LLM code mutation agent) to obtain new results in three settings:
  a) We improve a recent result of Kunisky and Yu to obtain near-optimal upper and (conditional) lower bounds on certification algorithms for MAX-CUT and MAX-Independent Set on random 3- and 4-regular graphs. Our improved lower bounds are obtained by constructing nearly extremal Ramanujan graphs on as many as $163$ vertices, and our upper bounds are obtained via analytical arguments.
  b) We obtain new inapproximability results for MAX-4-CUT and MAX-3-CUT, proving that it is NP-hard to approximate them within factors of $0.987$ and $0.9649$ respectively, using AlphaEvolve to discover new gadget reductions. Our MAX-4-CUT result improves upon the SOTA of $0.9883$, and our MAX-3-CUT result improves on the current best gadget-based inapproximability result of $0.9853$, but falls short of the SOTA of $16/17$ that relies on a custom PCP (rather than a reduction from ``standard'' H{\aa}stad-style PCPs).
  c) Inapproximability for the metric Traveling Salesman Problem (TSP): We show that it is NP-hard to approximate the minimum cost tour within a factor of $111/110$ using AlphaEvolve to discover a new gadget, thus improving the SOTA of $117/116$. Along the way, we provide new modular soundness and completeness arguments that can be of independent interest.
  A key technical challenge we faced: verifying a candidate construction produced by AlphaEvolve is costly (sometimes requiring time exponential in the size of the construction). We used AlphaEvolve itself to evolve the verification procedure to be faster (sometimes by $10,000\times$ for our gadgets). Our results suggest that gadget based proofs would benefit from a pass through AI-based tools to obtain stronger results.
