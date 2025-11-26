<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-aa4d19dca0f6a5bcee6dcb45429f182ecbcc920006e57d0df2cd7bdc064dca81
title: >-
  OmniPT: Unleashing the Potential of Large Vision Language Models for
  Pedestrian Tracking and Understanding
slug: briefing-aa4d19dca0f6a5bcee6dcb45429f182ecbcc920006e57d0df2cd7bdc064dca81
author: 'Teng Fu, Mengyang Zhao, Ke Niu, Kaixin Peng, Bin Li'
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17053'
status: pending_review
tags:
  - cs.CV
  - cs.AI
excerpt: >-
  arXiv:2511.17053v1 Announce Type: new 

  Abstract: LVLMs have been shown to perform excellently in image-level tasks
  such as VQA and caption. However, in many instance-level tasks, such as visual
  ground
---
arXiv:2511.17053v1 Announce Type: new 
Abstract: LVLMs have been shown to perform excellently in image-level tasks such as VQA and caption. However, in many instance-level tasks, such as visual grounding and object detection, LVLMs still show performance gaps compared to previous expert models. Meanwhile, although pedestrian tracking is a classical task, there have been a number of new topics in combining object tracking and natural language, such as Referring MOT, Cross-view Referring MOT, and Semantic MOT. These tasks emphasize that models should understand the tracked object at an advanced semantic level, which is exactly where LVLMs excel. In this paper, we propose a new unified Pedestrian Tracking framework, namely OmniPT, which can track, track based on reference and generate semantic understanding of tracked objects interactively. We address two issues: how to model the tracking task into a task that foundation models can perform, and how to make the model output formatted answers. To this end, we implement a training phase consisting of RL-Mid Training-SFT-RL. Based on the pre-trained weights of the LVLM, we first perform a simple RL phase to enable the model to output fixed and supervisable bounding box format. Subsequently, we conduct a mid-training phase using a large number of pedestrian-related datasets. Finally, we perform supervised fine-tuning on several pedestrian tracking datasets, and then carry out another RL phase to improve the model's tracking performance and enhance its ability to follow instructions. We conduct experiments on tracking benchmarks and the experimental results demonstrate that the proposed method can perform better than the previous methods.
