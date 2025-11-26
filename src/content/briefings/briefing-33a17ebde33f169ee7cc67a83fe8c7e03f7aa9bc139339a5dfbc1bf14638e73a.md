<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-33a17ebde33f169ee7cc67a83fe8c7e03f7aa9bc139339a5dfbc1bf14638e73a
title: >-
  Hallucinate Less by Thinking More: Aspect-Based Causal Abstention for Large
  Language Models
slug: briefing-33a17ebde33f169ee7cc67a83fe8c7e03f7aa9bc139339a5dfbc1bf14638e73a
author: 'Vy Nguyen, Ziqi Xu, Jeffrey Chan, Estrid He, Feng Xia, Xiuzhen Zhang'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17170'
status: pending_review
tags:
  - cs.CL
  - cs.AI
excerpt: >-
  arXiv:2511.17170v1 Announce Type: new 

  Abstract: Large Language Models (LLMs) often produce fluent but factually
  incorrect responses, a phenomenon known as hallucination. Abstention, where
  the model c
---
arXiv:2511.17170v1 Announce Type: new 
Abstract: Large Language Models (LLMs) often produce fluent but factually incorrect responses, a phenomenon known as hallucination. Abstention, where the model chooses not to answer and instead outputs phrases such as "I don't know", is a common safeguard. However, existing abstention methods typically rely on post-generation signals, such as generation variations or feedback, which limits their ability to prevent unreliable responses in advance. In this paper, we introduce Aspect-Based Causal Abstention (ABCA), a new framework that enables early abstention by analysing the internal diversity of LLM knowledge through causal inference. This diversity reflects the multifaceted nature of parametric knowledge acquired from various sources, representing diverse aspects such as disciplines, legal contexts, or temporal frames. ABCA estimates causal effects conditioned on these aspects to assess the reliability of knowledge relevant to a given query. Based on these estimates, we enable two types of abstention: Type-1, where aspect effects are inconsistent (knowledge conflict), and Type-2, where aspect effects consistently support abstention (knowledge insufficiency). Experiments on standard benchmarks demonstrate that ABCA improves abstention reliability, achieves state-of-the-art performance, and enhances the interpretability of abstention decisions.
