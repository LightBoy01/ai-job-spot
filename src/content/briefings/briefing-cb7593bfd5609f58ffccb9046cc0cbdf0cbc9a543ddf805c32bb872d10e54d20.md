---
id: briefing-cb7593bfd5609f58ffccb9046cc0cbdf0cbc9a543ddf805c32bb872d10e54d20
title: Sublinear iterations can suffice even for DDPMs
slug: briefing-cb7593bfd5609f58ffccb9046cc0cbdf0cbc9a543ddf805c32bb872d10e54d20
author: >-
  Matthew S. Zhang, Stephen Huan, Jerry Huang, Nicholas M. Boffi, Sitan Chen,
  Sinho Chewi
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04844'
status: pending_review
tags:
  - cs.LG
  - math.ST
  - stat.TH
excerpt: >-
  arXiv:2511.04844v1 Announce Type: new 

  Abstract: SDE-based methods such as denoising diffusion probabilistic models
  (DDPMs) have shown remarkable success in real-world sample generation tasks.
  Prior a
---
arXiv:2511.04844v1 Announce Type: new 
Abstract: SDE-based methods such as denoising diffusion probabilistic models (DDPMs) have shown remarkable success in real-world sample generation tasks. Prior analyses of DDPMs have been focused on the exponential Euler discretization, showing guarantees that generally depend at least linearly on the dimension or initial Fisher information. Inspired by works in log-concave sampling (Shen and Lee, 2019), we analyze an integrator -- the denoising diffusion randomized midpoint method (DDRaM) -- that leverages an additional randomized midpoint to better approximate the SDE. Using a recently-developed analytic framework called the "shifted composition rule", we show that this algorithm enjoys favorable discretization properties under appropriate smoothness assumptions, with sublinear $\widetilde{O}(\sqrt{d})$ score evaluations needed to ensure convergence. This is the first sublinear complexity bound for pure DDPM sampling -- prior works which obtained such bounds worked instead with ODE-based sampling and had to make modifications to the sampler which deviate from how they are used in practice. We also provide experimental validation of the advantages of our method, showing that it performs well in practice with pre-trained image synthesis models.
