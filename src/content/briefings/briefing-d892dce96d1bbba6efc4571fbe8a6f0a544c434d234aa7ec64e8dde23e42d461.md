<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-d892dce96d1bbba6efc4571fbe8a6f0a544c434d234aa7ec64e8dde23e42d461
title: Crafting Imperceptible On-Manifold Adversarial Attacks for Tabular Data
slug: briefing-d892dce96d1bbba6efc4571fbe8a6f0a544c434d234aa7ec64e8dde23e42d461
author: >-
  Zhipeng He, Alexander Stevens, Chun Ouyang, Johannes De Smedt, Alistair
  Barros, Catarina Moreira
publishDate: 2025-11-24T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2507.10998'
status: pending_review
tags:
  - cs.LG
  - cs.AI
excerpt: >-
  arXiv:2507.10998v3 Announce Type: replace 

  Abstract: Adversarial attacks on tabular data present unique challenges due to
  the heterogeneous nature of mixed categorical and numerical features. Unlike i
---
arXiv:2507.10998v3 Announce Type: replace 
Abstract: Adversarial attacks on tabular data present unique challenges due to the heterogeneous nature of mixed categorical and numerical features. Unlike images where pixel perturbations maintain visual similarity, tabular data lacks intuitive similarity metrics, making it difficult to define imperceptible modifications. Additionally, traditional gradient-based methods prioritise $\ell_p$-norm constraints, often producing adversarial examples that deviate from the original data distributions. To address this, we propose a latent-space perturbation framework using a mixed-input Variational Autoencoder (VAE) to generate statistically consistent adversarial examples. The proposed VAE integrates categorical embeddings and numerical features into a unified latent manifold, enabling perturbations that preserve statistical consistency. We introduce In-Distribution Success Rate (IDSR) to jointly evaluate attack effectiveness and distributional alignment. Evaluation across six publicly available datasets and three model architectures demonstrates that our method achieves substantially lower outlier rates and more consistent performance compared to traditional input-space attacks and other VAE-based methods adapted from image domain approaches, achieving substantially lower outlier rates and higher IDSR across six datasets and three model architectures. Our comprehensive analyses of hyperparameter sensitivity, sparsity control, and generative architecture demonstrate that the effectiveness of VAE-based attacks depends strongly on reconstruction quality and the availability of sufficient training data. When these conditions are met, the proposed framework achieves superior practical utility and stability compared with input-space methods. This work underscores the importance of maintaining on-manifold perturbations for generating realistic and robust adversarial examples in tabular domains.
