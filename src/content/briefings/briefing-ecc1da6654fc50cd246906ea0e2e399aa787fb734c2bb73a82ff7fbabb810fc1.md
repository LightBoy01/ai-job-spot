<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-ecc1da6654fc50cd246906ea0e2e399aa787fb734c2bb73a82ff7fbabb810fc1
title: >-
  ReBrain: Brain MRI Reconstruction from Sparse CT Slice via Retrieval-Augmented
  Diffusion
slug: briefing-ecc1da6654fc50cd246906ea0e2e399aa787fb734c2bb73a82ff7fbabb810fc1
author: >-
  Junming Liu, Yifei Sun, Weihua Cheng, Yujin Kang, Yirong Chen, Ding Wang,
  Guosun Zeng
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.CV updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.17068'
status: pending_review
tags:
  - cs.CV
  - cs.AI
excerpt: >-
  arXiv:2511.17068v1 Announce Type: new 

  Abstract: Magnetic Resonance Imaging (MRI) plays a crucial role in brain
  disease diagnosis, but it is not always feasible for certain patients due to
  physical or
---
arXiv:2511.17068v1 Announce Type: new 
Abstract: Magnetic Resonance Imaging (MRI) plays a crucial role in brain disease diagnosis, but it is not always feasible for certain patients due to physical or clinical constraints. Recent studies attempt to synthesize MRI from Computed Tomography (CT) scans; however, low-dose protocols often result in highly sparse CT volumes with poor through-plane resolution, making accurate reconstruction of the full brain MRI volume particularly challenging. To address this, we propose ReBrain, a retrieval-augmented diffusion framework for brain MRI reconstruction. Given any 3D CT scan with limited slices, we first employ a Brownian Bridge Diffusion Model (BBDM) to synthesize MRI slices along the 2D dimension. Simultaneously, we retrieve structurally and pathologically similar CT slices from a comprehensive prior database via a fine-tuned retrieval model. These retrieved slices are used as references, incorporated through a ControlNet branch to guide the generation of intermediate MRI slices and ensure structural continuity. We further account for rare retrieval failures when the database lacks suitable references and apply spherical linear interpolation to provide supplementary guidance. Extensive experiments on SynthRAD2023 and BraTS demonstrate that ReBrain achieves state-of-the-art performance in cross-modal reconstruction under sparse conditions.
