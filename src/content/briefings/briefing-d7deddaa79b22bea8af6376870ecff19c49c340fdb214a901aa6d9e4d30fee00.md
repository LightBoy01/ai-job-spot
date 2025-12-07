---
id: briefing-d7deddaa79b22bea8af6376870ecff19c49c340fdb214a901aa6d9e4d30fee00
title: >-
  PEPPER: Perception-Guided Perturbation for Robust Backdoor Defense in
  Text-to-Image Diffusion Models
slug: briefing-d7deddaa79b22bea8af6376870ecff19c49c340fdb214a901aa6d9e4d30fee00
author: 'Oscar Chew, Po-Yi Lu, Jayden Lin, Kuan-Hao Huang, Hsuan-Tien Lin'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.16830'
status: pending_review
tags:
  - cs.CL
excerpt: >-
  arXiv:2511.16830v1 Announce Type: new 

  Abstract: Recent studies show that text to image (T2I) diffusion models are
  vulnerable to backdoor attacks, where a trigger in the input prompt can steer
  generat
---
arXiv:2511.16830v1 Announce Type: new 
Abstract: Recent studies show that text to image (T2I) diffusion models are vulnerable to backdoor attacks, where a trigger in the input prompt can steer generation toward harmful or unintended content. To address this, we introduce PEPPER (PErcePtion Guided PERturbation), a backdoor defense that rewrites the caption into a semantically distant yet visually similar caption while adding unobstructive elements. With this rewriting strategy, PEPPER disrupt the trigger embedded in the input prompt, dilute the influence of trigger tokens and thereby achieve enhanced robustness. Experiments show that PEPPER is particularly effective against text encoder based attacks, substantially reducing attack success while preserving generation quality. Beyond this, PEPPER can be paired with any existing defenses yielding consistently stronger and generalizable robustness than any standalone method. Our code will be released on Github.
