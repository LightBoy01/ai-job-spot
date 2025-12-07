---
id: briefing-cbbcef2fb1147d64d8ac545a2f4a0aa544bdd6344deae8d14f36f7be97499af7
title: 'EETnet: a CNN for Gaze Detection and Tracking for Smart-Eyewear'
slug: briefing-cbbcef2fb1147d64d8ac545a2f4a0aa544bdd6344deae8d14f36f7be97499af7
author: >-
  Andrea Aspesi (Department of Electronics, Information and Bioengineering,
  EssilorLuxottica), Andrea Simpsi (Department of Electronics, Information and
  Bioengineering), Aaron Tognoli (Department of Electronics, Information and
  Bioengineering), Simone Mentasti (Department of Electronics, Information and
  Bioengineering), Luca Merigo (EssilorLuxottica), Matteo Matteucci (Department
  of Electronics, Information and Bioengineering)
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04779'
status: pending_review
tags:
  - cs.CV
excerpt: >-
  arXiv:2511.04779v1 Announce Type: new 

  Abstract: Event-based cameras are becoming a popular solution for efficient,
  low-power eye tracking. Due to the sparse and asynchronous nature of event
  data, the
---
arXiv:2511.04779v1 Announce Type: new 
Abstract: Event-based cameras are becoming a popular solution for efficient, low-power eye tracking. Due to the sparse and asynchronous nature of event data, they require less processing power and offer latencies in the microsecond range. However, many existing solutions are limited to validation on powerful GPUs, with no deployment on real embedded devices. In this paper, we present EETnet, a convolutional neural network designed for eye tracking using purely event-based data, capable of running on microcontrollers with limited resources. Additionally, we outline a methodology to train, evaluate, and quantize the network using a public dataset. Finally, we propose two versions of the architecture: a classification model that detects the pupil on a grid superimposed on the original image, and a regression model that operates at the pixel level.
