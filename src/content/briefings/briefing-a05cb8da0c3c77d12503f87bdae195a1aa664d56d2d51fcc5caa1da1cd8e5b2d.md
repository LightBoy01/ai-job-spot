---
id: briefing-a05cb8da0c3c77d12503f87bdae195a1aa664d56d2d51fcc5caa1da1cd8e5b2d
title: >-
  What Are the Facts? Automated Extraction of Court-Established Facts from
  Criminal-Court Opinions
slug: briefing-a05cb8da0c3c77d12503f87bdae195a1aa664d56d2d51fcc5caa1da1cd8e5b2d
author: >-
  Kl\'ara Bendov\'a, Tom\'a\v{s} Knap, Jan \v{C}ern\'y, Vojt\v{e}ch Pour,
  Jaromir Savelka, Ivana Kvapil\'ikov\'a, Jakub Dr\'apal
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CL updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.05320'
status: pending_review
tags:
  - cs.CL
  - cs.AI
excerpt: >-
  arXiv:2511.05320v1 Announce Type: new 

  Abstract: Criminal justice administrative data contain only a limited amount
  of information about the committed offense. However, there is an unused source
  of ex
---
arXiv:2511.05320v1 Announce Type: new 
Abstract: Criminal justice administrative data contain only a limited amount of information about the committed offense. However, there is an unused source of extensive information in continental European courts' decisions: descriptions of criminal behaviors in verdicts by which offenders are found guilty. In this paper, we study the feasibility of extracting these descriptions from publicly available court decisions from Slovakia. We use two different approaches for retrieval: regular expressions and large language models (LLMs). Our baseline was a simple method employing regular expressions to identify typical words occurring before and after the description. The advanced regular expression approach further focused on "sparing" and its normalization (insertion of spaces between individual letters), typical for delineating the description. The LLM approach involved prompting the Gemini Flash 2.0 model to extract the descriptions using predefined instructions. Although the baseline identified descriptions in only 40.5% of verdicts, both methods significantly outperformed it, achieving 97% with advanced regular expressions and 98.75% with LLMs, and 99.5% when combined. Evaluation by law students showed that both advanced methods matched human annotations in about 90% of cases, compared to just 34.5% for the baseline. LLMs fully matched human-labeled descriptions in 91.75% of instances, and a combination of advanced regular expressions with LLMs reached 92%.
