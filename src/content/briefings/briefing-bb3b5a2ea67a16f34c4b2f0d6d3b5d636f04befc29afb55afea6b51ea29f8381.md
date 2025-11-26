<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-bb3b5a2ea67a16f34c4b2f0d6d3b5d636f04befc29afb55afea6b51ea29f8381
title: >-
  Neural at ArchEHR-QA 2025: Agentic Prompt Optimization for Evidence-Grounded
  Clinical Question Answering
slug: briefing-bb3b5a2ea67a16f34c4b2f0d6d3b5d636f04befc29afb55afea6b51ea29f8381
author: >-
  Sai Prasanna Teja Reddy Bogireddy, Abrar Majeedi, Viswanatha Reddy Gajjala,
  Zhuoyan Xu, Siddhant Rai, Vaishnav Potlapalli
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2506.10751'
status: pending_review
tags:
  - cs.LG
  - cs.CL
excerpt: >-
  arXiv:2506.10751v2 Announce Type: replace 

  Abstract: Automated question answering (QA) over electronic health records
  (EHRs) can bridge critical information gaps for clinicians and patients, yet
  it de
---
arXiv:2506.10751v2 Announce Type: replace 
Abstract: Automated question answering (QA) over electronic health records (EHRs) can bridge critical information gaps for clinicians and patients, yet it demands both precise evidence retrieval and faithful answer generation under limited supervision. In this work, we present Neural, the runner-up in the BioNLP 2025 ArchEHR-QA shared task on evidence-grounded clinical QA. Our proposed method decouples the task into (1) sentence-level evidence identification and (2) answer synthesis with explicit citations. For each stage, we automatically explore the prompt space with DSPy's MIPROv2 optimizer, jointly tuning instructions and few-shot demonstrations on the development set. A self-consistency voting scheme further improves evidence recall without sacrificing precision. On the hidden test set, our method attains an overall score of 51.5, placing second stage while outperforming standard zero-shot and few-shot prompting by over 20 and 10 points, respectively. These results indicate that data-driven prompt optimization is a cost-effective alternative to model fine-tuning for high-stakes clinical QA, advancing the reliability of AI assistants in healthcare.
