<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->

---
id: briefing-59ce935effca16f5c2d7ba17d1c071286fe70c8cd1ffc6ac582b86fe891b4a01
title: >-
  SLOFetch: Compressed-Hierarchical Instruction Prefetching for Cloud
  Microservices
slug: briefing-59ce935effca16f5c2d7ba17d1c071286fe70c8cd1ffc6ac582b86fe891b4a01
author: 'Liu Jiang, Zerui Bao, Shiqi Sheng, Di Zhu'
publishDate: 2025-11-10T05:00:00.000Z
contentType: briefing
sourceName: cs.LG updates on arXiv.org
originalUrl: 'https://arxiv.org/abs/2511.04774'
status: pending_review
tags:
  - cs.LG
  - cs.AR
excerpt: >-
  arXiv:2511.04774v1 Announce Type: new 

  Abstract: Large-scale networked services rely on deep soft-ware stacks and
  microservice orchestration, which increase instruction footprints and create
  frontend
---
arXiv:2511.04774v1 Announce Type: new 
Abstract: Large-scale networked services rely on deep soft-ware stacks and microservice orchestration, which increase instruction footprints and create frontend stalls that inflate tail latency and energy. We revisit instruction prefetching for these cloud workloads and present a design that aligns with SLO driven and self optimizing systems. Building on the Entangling Instruction Prefetcher (EIP), we introduce a Compressed Entry that captures up to eight destinations around a base using 36 bits by exploiting spatial clustering, and a Hierarchical Metadata Storage scheme that keeps only L1 resident and frequently queried entries on chip while virtualizing bulk metadata into lower levels. We further add a lightweight Online ML Controller that scores prefetch profitability using context features and a bandit adjusted threshold. On data center applications, our approach preserves EIP like speedups with smaller on chip state and improves efficiency for networked services in the ML era.
