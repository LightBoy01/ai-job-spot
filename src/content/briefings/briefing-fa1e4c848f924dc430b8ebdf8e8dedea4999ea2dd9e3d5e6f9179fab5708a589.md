---
id: briefing-fa1e4c848f924dc430b8ebdf8e8dedea4999ea2dd9e3d5e6f9179fab5708a589
title: Dual Teacher-Student Learning for Semi-supervised Medical Image Segmentation
slug: briefing-fa1e4c848f924dc430b8ebdf8e8dedea4999ea2dd9e3d5e6f9179fab5708a589
author: 'Pengchen Zhang, Alan J. X. Guo, Sipin Luo, Zhe Han, Lin Guo'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2505.11018'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2505.11018v2 Announce Type: replace 

  Abstract: Semi-supervised learning reduces the costly manual annotation burden
  in medical image segmentation. A popular approach is the mean teacher (MT) str
---
arXiv:2505.11018v2 Announce Type: replace 
Abstract: Semi-supervised learning reduces the costly manual annotation burden in medical image segmentation. A popular approach is the mean teacher (MT) strategy, which applies consistency regularization using a temporally averaged teacher model. In this work, the MT strategy is reinterpreted as a form of self-paced learning in the context of supervised learning, where agreement between the teacher's predictions and the ground truth implicitly guides the model from easy to hard. Extending this insight to semi-supervised learning, we propose dual teacher-student learning (DTSL). It regulates the learning pace on unlabeled data using two signals: a temporally averaged signal from an in-group teacher and a cross-architectural signal from a student in a second, distinct model group. Specifically, a novel consensus label generator (CLG) creates the pseudo-labels from the agreement between these two signals, establishing an effective learning curriculum. Extensive experiments on four benchmark datasets demonstrate that the proposed method consistently outperforms existing state-of-the-art approaches. Remarkably, on three of the four datasets, our semi-supervised method with limited labeled data surpasses its fully supervised counterparts, validating the effectiveness of our self-paced learning design.
