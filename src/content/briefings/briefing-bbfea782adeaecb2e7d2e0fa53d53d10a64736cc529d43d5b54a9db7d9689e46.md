---
id: briefing-bbfea782adeaecb2e7d2e0fa53d53d10a64736cc529d43d5b54a9db7d9689e46
title: Redis Critical Remote Code Execution Vulnerability Discovered after 13 Years
slug: briefing-bbfea782adeaecb2e7d2e0fa53d53d10a64736cc529d43d5b54a9db7d9689e46
author: Renato Losio
publishDate: 2025-11-08T10:21:00.000Z
contentType: briefing
sourceName: InfoQ
originalUrl: >-
  https://www.infoq.com/news/2025/11/redis-vulnerability-redishell/?utm_campaign=infoq_content&amp;utm_source=infoq&amp;utm_medium=feed&amp;utm_term=AI,+ML+&+Data+Engineering
status: pending_review
tags:
  - Common Vulnerabilities and Exposures
  - CVE
  - Redis
  - Valkey
  - 'AI, ML &amp; Data Engineering'
  - Development
  - news
excerpt: >-
  Redis recently released a security advisory regarding CVE-2025-49844. This
  critical (CVSS 10.0) use-after-free (UAF) vulnerability in Lua scripting could
  allow authenticated attackers to execute remot
---
<img src="https://www.infoq.com/styles/static/images/logo/logo_bigger.jpg"><p>Redis recently released a security advisory regarding CVE-2025-49844. This critical (CVSS 10.0) use-after-free (UAF) vulnerability in Lua scripting could allow authenticated attackers to execute remote code on older versions of Redis and Valkey with Lua scripting enabled. Developers are urged to upgrade to patched releases as soon as possible.</p> <i>By Renato Losio</i>
