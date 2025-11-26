---
id: briefing-16dbff64ebaac4b9108c3d661fe4a313e5552a657c78bcc3f855179ac4cfcdb8
title: 'NINJA Attack: Uncovering Critical Safety Flaws in Long-Context LLMs'
slug: briefing-16dbff64ebaac4b9108c3d661fe4a313e5552a657c78bcc3f855179ac4cfcdb8
author: >-
  Rishi Rajesh Shah, Chen Henry Wu, Shashwat Saxena, Ziqian Zhong, Alexander
  Robey, Aditi Raghunathan
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04707'
status: published
tags:
  - cs.CR
  - cs.AI
  - cs.CL
  - cs.LG
  - AI Safety
  - LLM Vulnerabilities
  - Jailbreaking
  - Long Context Models
excerpt: >-
  arXiv:2511.04707v1 Announce Type: cross 

  Abstract: Recent advances in long-context language models (LMs) have enabled
  million-token inputs, expanding their capabilities across complex tasks like
  compu
---
### Summary\nA new research paper introduces NINJA (Needle-in-haystack jailbreak attack), a novel method to bypass safety alignments in long-context Large Language Models (LLMs). NINJA achieves this by appending benign, model-generated content to harmful user goals, critically observing that the position of these harmful goals within the extended context significantly impacts success. Experiments using the HarmBench benchmark demonstrate that NINJA substantially increases attack success rates across leading open and proprietary models like LLaMA, Qwen, Mistral, and Gemini. Unlike previous methods, NINJA is low-resource, transferable, less detectable, and even compute-optimal, indicating that carefully positioned harmful goals within otherwise benign long contexts expose fundamental safety vulnerabilities in modern LLMs.\n\n### Why It Matters\nThis research is a crucial wake-up call for AI developers, researchers, and security professionals building and deploying long-context Large Language Models (LLMs), especially those intended for complex, agentic tasks. The NINJA attack fundamentally challenges the prevailing safety paradigms, demonstrating that even meticulously aligned models can be compromised not by overtly malicious inputs, but by subtle manipulation of input *structure* and *goal positioning* within an extended, otherwise benign context.\n\nFor developers, it underscores the inadequacy of current safety mechanisms that might focus solely on content filtering. The \\\"needle-in-haystack\\\" approach means that defenses must evolve to understand the semantic intent and potential adversarial positioning of harmful elements within massive data streams. This is particularly relevant as LLMs move towards autonomous agentic capabilities, where long-context understanding is paramount. A compromised agent operating with a deep, manipulated context could have far-reaching and unpredictable harmful consequences.\n\nFrom a security perspective, the claim that NINJA is \\\"low-resource, transferable, and less detectable\\\" is highly concerning. This suggests a new, efficient, and stealthy attack vector that could bypass existing detection systems, making red-teaming efforts even more critical and complex. The \\\"compute-optimal\\\" finding further implies that adversaries can achieve high success rates with relatively modest resources, increasing the overall threat surface.\n\nUltimately, this paper reveals a deeper architectural vulnerability: the scaling of context length in LLMs, while powerful for capabilities, introduces a new class of structural fragility in safety. It demands a significant re-evaluation of how safety is engineered into these complex systems, moving beyond superficial content checks to a profound understanding of contextual integrity and adversarial prompt engineering.
