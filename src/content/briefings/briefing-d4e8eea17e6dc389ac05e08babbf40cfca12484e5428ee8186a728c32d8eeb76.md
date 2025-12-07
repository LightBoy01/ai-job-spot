---
id: briefing-d4e8eea17e6dc389ac05e08babbf40cfca12484e5428ee8186a728c32d8eeb76
title: >-
  Ship fast, optimize later: top AI engineers don't care about cost - they're
  prioritizing deployment
slug: briefing-d4e8eea17e6dc389ac05e08babbf40cfca12484e5428ee8186a728c32d8eeb76
author: taryn.plumb@venturebeat.com (Taryn Plumb)
publishDate: 2025-11-07T05:00:00.000Z
contentType: briefing
sourceName: AI News | VentureBeat
originalUrl: >-
  https://venturebeat.com/data-infrastructure/ship-fast-optimize-later-top-ai-engineers-dont-care-about-cost-theyre
status: pending_review
tags:
  - Data Infrastructure
  - AI
excerpt: >-
  Across industries, rising compute expenses are often cited as a barrier to AI
  adoption - but leading companies are finding that cost is no longer the real
  constraint. 


  The tougher challenges (and the
---
<p>Across industries, rising compute expenses are often cited as a barrier to <a href="https://venturebeat.com/ai/why-it-leaders-should-pay-attention-to-canvas-imagination-era-strategy">AI adoption</a> - but leading companies are finding that cost is no longer the real constraint. 

The tougher challenges (and the ones top of mind for many tech leaders)? Latency, flexibility and capacity.

At <a href="https://www.wonder.com/">Wonder</a>, for instance, AI adds a mere few cents per order; the food delivery and takeout company is much more concerned with cloud capacity with skyrocketing demands. <a href="https://www.recursion.com/">Recursion</a>, for its part, has been focused on balancing small and larger-scale training and deployment via on-premises clusters and the cloud; this has afforded the biotech company flexibility for rapid experimentation.

The companies' true in-the-wild experiences highlight a broader industry trend: For enterprises operating AI at scale, economics aren't the key decisive factor - the conversation has shifted from how to pay for AI to how fast it can be deployed and sustained.

AI leaders from the two companies recently sat down with Venturebeat's CEO and editor-in-chief Matt Marshall as part of VB's traveling <a href="https://luma.com/user/usr-c6z5eEhRTKVDqRF">AI Impact Series</a>. Here's what they shared. </p><h3><b>Wonder: Rethink what you assume about capacity</b></h3><p>Wonder uses AI to power everything from recommendations to logistics - yet, as of now, reported CTO James Chen, AI adds just a few cents per order. </p><p>Chen explained that the technology component of a meal order costs 14 cents, the AI adds 2 to 3 cents, although that's "going up really rapidly" to 5 to 8 cents. Still, that seems almost immaterial compared to total operating costs. 

Instead, the 100% cloud-native AI company's main concern has been capacity with growing demand. Wonder was built with "the assumption" (which proved to be incorrect) that there would be "unlimited capacity" so they could move "super fast" and wouldn't have to worry about managing infrastructure, Chen noted. 

But the company has grown quite a bit over the last few years, he said; as a result, about six months ago, "we started getting little signals from the cloud providers, 'Hey, you might need to consider going to region two,'" because they were running out of capacity for CPU or data storage at their facilities as demand grew. 

It was "very shocking" that they had to move to plan B earlier than they anticipated. "Obviously it's good practice to be multi-region, but we were thinking maybe two more years down the road," said Chen. </p><h3><b>What's not economically feasible (yet)</b></h3><p>Wonder built its own model to maximize its conversion rate, Chen noted; the goal is to surface new restaurants to relevant customers as much as possible. These are "isolated scenarios" where models are trained over time to be "very, very efficient and very fast."

Currently, the best bet for Wonder's use case is large models, Chen noted. But in the long term, they'd like to move to small models that are hyper-customized to individuals (via AI agents or concierges) based on their purchase history and even their clickstream. "Having these micro models is definitely the best, but right now the cost is very expensive," Chen noted. "If you try to create one for each person, it's just not economically feasible."</p><h3><b>Budgeting is an art, not a science</b></h3><p>Wonder gives its devs and data scientists as much playroom as possible to experiment, and internal teams review the costs of use to make sure nobody turned on a model and "jacked up massive compute around a huge bill," said Chen. 

The company is trying different things to offload to AI and operate within margins. "But then it's very hard to budget because you have no idea," he said. One of the challenging things is the pace of development; when a new model comes out, "we can't just sit there, right? We have to use it."

Budgeting for the unknown economics of a token-based system is "definitely art versus science."

A critical component in the software development lifecycle is preserving context when using large native models, he explained. When you find something that works, you can add it to your company's "corpus of context" that can be sent with every request. That's big and it costs money each time. 

"Over 50%, up to 80% of your costs is just resending the same information back into the same engine again on every request," said Chen. </p><p>In theory, the more they do should require less cost per unit. "I know when a transaction happens, I'll pay the X cent tax for each one, but I don't want to be limited to use the technology for all these other creative ideas."</p><h3><b>The 'vindication moment' for Recursion</b></h3><p>Recursion, for its part, has focused on meeting broad-ranging compute needs via a hybrid infrastructure of on-premise clusters and cloud inference. 

When initially looking to build out its AI infrastructure, the company had to go with its own setup, as "the cloud providers didn't have very many good offerings," explained CTO Ben Mabey. "The vindication moment was that we needed more compute and we looked to the cloud providers and they were like, 'Maybe in a year or so.'"

The company's first cluster in 2017 incorporated Nvidia gaming GPUs (1080s, launched in 2016); they have since added Nvidia H100s and A100s, and use a Kubernetes cluster that they run in the cloud or on-prem. 

Addressing the longevity question, Mabey noted: "These gaming GPUs are actually still being used today, which is crazy, right? The myth that a GPU's life span is only three years, that's definitely not the case. A100s are still top of the list, they're the workhorse of the industry." </p><h3><b>Best use cases on-prem vs cloud; cost differences</b></h3><p>More recently, Mabey's team has been training a foundation model on Recursion's image repository (which consists of petabytes of data and more than 200 pictures). This and other types of big training jobs have required a "massive cluster" and connected, multi-node setups. 

"When we need that fully-connected network and access to a lot of our data in a high parallel file system, we go on-prem," he explained. On the other hand, shorter workloads run in the cloud. 

Recursion's method is to "pre-empt" GPUs and Google tensor processing units (TPUs), which is the process of interrupting running GPU tasks to work on higher-priority ones. "Because we don't care about the speed in some of these inference workloads where we're uploading biological data, whether that's an image or sequencing data, DNA data," Mabey explained. "We can say, 'Give this to us in an hour,' and we're fine if it kills the job." 

From a cost perspective, moving large workloads on-prem is "conservatively" 10 times cheaper, Mabey noted; for a five year TCO, it's half the cost. On the other hand, for smaller storage needs, the cloud can be "pretty competitive" cost-wise. 

Ultimately, Mabey urged tech leaders to step back and determine whether they're truly willing to commit to AI; cost-effective solutions typically require multi-year buy-ins. 

"From a psychological perspective, I've seen peers of ours who will not invest in compute, and as a result they're always paying on demand," said Mabey. "Their teams use far less compute because they don't want to run up the cloud bill. Innovation really gets hampered by people not wanting to burn money." </p>
