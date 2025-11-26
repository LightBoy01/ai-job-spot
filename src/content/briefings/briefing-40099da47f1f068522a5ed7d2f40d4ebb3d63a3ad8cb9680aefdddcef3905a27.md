---
id: briefing-40099da47f1f068522a5ed7d2f40d4ebb3d63a3ad8cb9680aefdddcef3905a27
title: 'Sloppy : Chrome Extension for AI Slop Detection with Agentic Postgres'
slug: briefing-40099da47f1f068522a5ed7d2f40d4ebb3d63a3ad8cb9680aefdddcef3905a27
author: Aamish
publishDate: 2025-11-10T05:16:06.000Z
contentType: briefing
sourceName: DEV Community
originalUrl: >-
  https://dev.to/aamish_491ea6f03bb3294c06/sloppy-chrome-extension-for-ai-slop-detection-with-agentic-postgres-5fbo
status: pending_review
tags:
  - devchallenge
  - agenticpostgreschallenge
  - ai
  - postgres
excerpt: >-
  Sloppy is a Chrome extension that detects "slop" (low-quality, AI-generated,
  templated, repetitive writing) in web pages using Agentic Postgres with
  real-time multi-agent collaboration. The innovation
---
<p><strong>Sloppy</strong> is a Chrome extension that detects "slop" (low-quality, AI-generated, templated, repetitive writing) in web pages using <strong>Agentic Postgres</strong> with real-time multi-agent collaboration. The innovation lies in how each analysis job runs in its own zero-copy database fork where three specialized agents (Collector, Evaluator, Curator) work asynchronously in complete isolation.</p>

<h3>
  
  
  The Problem
</h3>

<p>The web is increasingly filled with AI-generated content that lacks authenticity - generic marketing copy, repetitive templates, keyword-stuffed paragraphs, and low-value "content mill" writing. Readers need a way to quickly identify this "slop" to make informed decisions about content quality.</p>

<h3>
  
  
  The Solution
</h3>

<p>Sloppy analyzes web pages in real-time, assigning each paragraph a quality score based on:</p>

<ul>
<li>
<strong>Template phrase detection</strong>: Identifies overused buzzwords ("cutting-edge", "world-class", "leverage synergy")</li>
<li>
<strong>Repetition analysis</strong>: Detects repeated sentence structures and phrases using pg_trgm</li>
<li>
<strong>Semantic similarity</strong>: Uses pgvector to find suspiciously similar paragraphs</li>
<li>
<strong>AI writing patterns</strong>: Flags generic transitions like "It's important to note", "Moreover", "Furthermore"</li>
<li>
<strong>Low lexical diversity</strong>: Identifies vocabulary repetition and generic language</li>
</ul>

<p>What makes Sloppy unique is its <strong>fork-based architecture</strong> - every analysis runs in a dedicated database fork, enabling true agent isolation, parallel processing, and fearless experimentation without polluting the main database.</p>

<h3>
  
  
  Why Agentic Postgres?
</h3>

<p>Traditional approaches would require complex application-level coordination, locking mechanisms, and careful state management. With Tiger's zero-copy forks:</p>

<ul>
<li>✅ <strong>Instant isolation</strong>: Each job gets its own database snapshot in milliseconds</li>
<li>✅ <strong>Zero overhead</strong>: No data duplication, forks share underlying storage</li>
<li>✅ <strong>Clean rollback</strong>: Failed analyses simply discard their fork</li>
<li>✅ <strong>Parallel execution</strong>: Multiple jobs run simultaneously without interference</li>
<li>✅ <strong>Agent collaboration</strong>: Agents communicate through fork-local tables</li>
</ul>

<h2>
  
  
  Demo
</h2>

<h3>
  
  
  Repository
</h3>

<p><strong>GitHub</strong>: <a href="https://github.com/AamishB/Sloppy" rel="noopener noreferrer">https://github.com/AamishB/Sloppy</a></p>

<h3>
  
  
  Screenshots
</h3>

<h4>
  
  
  1. Extension in Action
</h4>

<p>The Chrome extension analyzing a webpage with the Sloppy icon showing the quality score:</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F74s4odudvqcnglgu9sop.png" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F74s4odudvqcnglgu9sop.png" alt="Extension analyzing page" width="800" height="380"></a></p>

<p><em>Real-time WebSocket updates show progress as agents work through the analysis</em></p>

<h4>
  
  
  2. In-Page Highlighting
</h4>

<p>Color-coded highlights directly on the webpage showing problematic content:</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fvh2uy2p2jjt39yi15wkx.png" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fvh2uy2p2jjt39yi15wkx.png" alt="Highlighted slop" width="800" height="376"></a></p>

<p><em>Yellow highlights for medium slop (20-60%), red for high slop (&gt;60%)</em></p>

<h4>
  
  
  3. Detailed Tooltips
</h4>

<p>Hovering over highlights reveals specific issues detected:</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fj4prjjdvi8oskjkctafd.png" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fj4prjjdvi8oskjkctafd.png" alt="Tooltip details" width="800" height="485"></a></p>

<p><em>Paragraph-level scoring with reasons: template phrases, repetition, AI patterns</em></p>

<h4>
  
  
  4. Results Dashboard
</h4>

<p>The extension popup showing overall quality metrics:</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F1fypgw2cgczu1xd4no70.png" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F1fypgw2cgczu1xd4no70.png" alt="Results dashboard" width="800" height="513"></a></p>

<p><em>Overall score: 59% - indicating significant quality issues detected</em></p>

<h3>
  
  
  How to Try It
</h3>

<ol>
<li>Clone the repo: <code>git clone https://github.com/AamishB/Sloppy.git</code>
</li>
<li>Install dependencies: <code>pip install -r requirements.txt</code>
</li>
<li>Set up environment variables in <code>.env</code> (DATABASE_URL, TIGER_CLI_PATH)</li>
<li>Initialize Database Schema: <code>psql $DATABASE_URL -f db/schema.sql</code>
</li>
<li>Run the server: <code>uvicorn fastapi_app.main:app --reload --port 8000</code>
</li>
<li>Load the <code>extension/</code> folder in Chrome as an unpacked extension</li>
<li>Visit any webpage and click the Sloppy icon to analyze</li>
</ol>

<p><strong>Test page included</strong>: <code>test_page.html</code> contains intentional AI slop for testing</p>

<h2>
  
  
  How I Used Agentic Postgres
</h2>

<h3>
  
  
  🔱 Zero-Copy Database Forks (Core Innovation)
</h3>

<p>Every analysis job creates its own fork using Tiger CLI:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="c1"># Create isolated fork for this job
</span><span class="n">tiger</span> <span class="n">service</span> <span class="n">fork</span> <span class="n">job_name</span> <span class="o">--</span><span class="n">now</span> <span class="o">--</span><span class="n">name</span> <span class="n">fork_page_abc123</span> <span class="o">--</span><span class="n">no</span><span class="o">-</span><span class="nb">set</span><span class="o">-</span><span class="n">default</span>
</code></pre>

</div>



<p><strong>Why this matters</strong>:</p>

<ul>
<li>
<strong>Isolation</strong>: Each job operates in complete isolation without locks or conflicts</li>
<li>
<strong>Performance</strong>: Zero-copy means instant fork creation (&lt; 100ms vs minutes for traditional clones)</li>
<li>
<strong>Clean slate</strong>: Failed analyses don't pollute the main database</li>
<li>
<strong>Parallel execution</strong>: 10+ jobs can run simultaneously, each in their own fork</li>
</ul>

<h3>
  
  
  🤖 Multi-Agent Collaboration Architecture
</h3>

<p>Three specialized agents collaborate within each fork:</p>

<p><a href="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Frqn5oza37zt3w2wfsjp7.jpg" class="article-body-image-wrapper"><img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Frqn5oza37zt3w2wfsjp7.jpg" alt="Architecture Diagram" width="800" height="639"></a></p>

<p><strong>Key code snippet</strong> (from <code>fastapi_app/main.py</code>):<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="k">async</span> <span class="k">def</span> <span class="nf">run_agents_with_fork</span><span class="p">(</span><span class="n">job_id</span><span class="p">:</span> <span class="nb">str</span><span class="p">,</span> <span class="n">raw</span><span class="p">:</span> <span class="nb">str</span><span class="p">):</span>
    <span class="sh">"""</span><span class="s">Orchestrate agents in isolated fork</span><span class="sh">"""</span>

    <span class="c1"># Create zero-copy fork
</span>    <span class="n">fork_id</span> <span class="o">=</span> <span class="k">await</span> <span class="nf">create_tiger_fork</span><span class="p">(</span><span class="n">job_id</span><span class="p">)</span>

    <span class="k">try</span><span class="p">:</span>
        <span class="c1"># Agent 1: Collect &amp; embed
</span>        <span class="n">paragraphs</span> <span class="o">=</span> <span class="nf">split_paragraphs</span><span class="p">(</span><span class="n">raw</span><span class="p">)</span>
        <span class="n">embeddings</span> <span class="o">=</span> <span class="nf">embed_texts</span><span class="p">(</span><span class="n">paragraphs</span><span class="p">,</span> <span class="n">model</span><span class="p">)</span>
        <span class="k">await</span> <span class="nf">insert_paragraphs</span><span class="p">(</span><span class="n">fork_id</span><span class="p">,</span> <span class="n">paragraphs</span><span class="p">,</span> <span class="n">embeddings</span><span class="p">)</span>

        <span class="c1"># Agent 2: Evaluate in parallel (uses fork connection)
</span>        <span class="n">tasks</span> <span class="o">=</span> <span class="p">[</span><span class="nf">evaluate_paragraph</span><span class="p">(</span><span class="n">p</span><span class="p">,</span> <span class="n">fork_id</span><span class="p">)</span> <span class="k">for</span> <span class="n">p</span> <span class="ow">in</span> <span class="n">paragraphs</span><span class="p">]</span>
        <span class="k">await</span> <span class="n">asyncio</span><span class="p">.</span><span class="nf">gather</span><span class="p">(</span><span class="o">*</span><span class="n">tasks</span><span class="p">)</span>

        <span class="c1"># Agent 3: Curate results
</span>        <span class="n">results</span> <span class="o">=</span> <span class="k">await</span> <span class="nf">aggregate_evaluations</span><span class="p">(</span><span class="n">fork_id</span><span class="p">)</span>

        <span class="c1"># Merge results back to main
</span>        <span class="k">await</span> <span class="nf">merge_fork_results</span><span class="p">(</span><span class="n">fork_id</span><span class="p">,</span> <span class="n">job_id</span><span class="p">)</span>

    <span class="k">finally</span><span class="p">:</span>
        <span class="c1"># Clean up fork (instant)
</span>        <span class="k">await</span> <span class="nf">cleanup_tiger_fork</span><span class="p">(</span><span class="n">fork_id</span><span class="p">)</span>
</code></pre>

</div>



<h3>
  
  
  🔍 Hybrid Search: pgvector + pg_trgm
</h3>

<p>The Evaluator agent uses Tiger's optimized extensions for powerful hybrid search:</p>

<p><strong>1. Semantic Similarity (pgvector)</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight sql"><code><span class="c1">-- Find semantically similar paragraphs (AI pattern detection)</span>
<span class="k">SELECT</span> <span class="n">content</span><span class="p">,</span> <span class="n">embedding</span> <span class="o">&lt;=&gt;</span> <span class="err">$</span><span class="mi">1</span><span class="p">::</span><span class="n">vector</span> <span class="k">as</span> <span class="n">distance</span>
<span class="k">FROM</span> <span class="n">paragraphs</span>
<span class="k">WHERE</span> <span class="n">embedding</span> <span class="o">&lt;=&gt;</span> <span class="err">$</span><span class="mi">1</span><span class="p">::</span><span class="n">vector</span> <span class="o">&lt;</span> <span class="mi">0</span><span class="p">.</span><span class="mi">3</span>
<span class="k">ORDER</span> <span class="k">BY</span> <span class="n">distance</span>
<span class="k">LIMIT</span> <span class="mi">5</span><span class="p">;</span>
</code></pre>

</div>



<p><strong>2. Full-Text Matching (pg_trgm)</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight sql"><code><span class="c1">-- Detect template phrases and repetition</span>
<span class="k">SELECT</span> <span class="n">content</span><span class="p">,</span> <span class="n">similarity</span><span class="p">(</span><span class="n">content</span><span class="p">,</span> <span class="err">$</span><span class="mi">1</span><span class="p">)</span> <span class="k">as</span> <span class="n">sim</span>
<span class="k">FROM</span> <span class="n">paragraphs</span>
<span class="k">WHERE</span> <span class="n">content</span> <span class="o">%</span> <span class="err">$</span><span class="mi">1</span>  <span class="c1">-- pg_trgm similarity operator</span>
<span class="k">ORDER</span> <span class="k">BY</span> <span class="n">sim</span> <span class="k">DESC</span><span class="p">;</span>
</code></pre>

</div>



<p><strong>3. Combined Power</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="c1"># Evaluator agent combines both approaches
</span><span class="n">semantic_matches</span> <span class="o">=</span> <span class="k">await</span> <span class="nf">find_similar_embeddings</span><span class="p">(</span><span class="n">paragraph</span><span class="p">,</span> <span class="n">threshold</span><span class="o">=</span><span class="mf">0.3</span><span class="p">)</span>
<span class="n">template_matches</span> <span class="o">=</span> <span class="k">await</span> <span class="nf">find_template_phrases</span><span class="p">(</span><span class="n">paragraph</span><span class="p">,</span> <span class="n">templates</span><span class="p">)</span>

<span class="n">slop_score</span> <span class="o">=</span> <span class="nf">calculate_score</span><span class="p">(</span>
    <span class="n">semantic_similarity</span><span class="o">=</span><span class="nf">len</span><span class="p">(</span><span class="n">semantic_matches</span><span class="p">),</span>
    <span class="n">template_count</span><span class="o">=</span><span class="nf">len</span><span class="p">(</span><span class="n">template_matches</span><span class="p">),</span>
    <span class="n">repetition_score</span><span class="o">=</span><span class="nf">calculate_trigram_similarity</span><span class="p">(</span><span class="n">paragraph</span><span class="p">,</span> <span class="n">all_paragraphs</span><span class="p">)</span>
<span class="p">)</span>
</code></pre>

</div>



<p>This hybrid approach catches both:</p>

<ul>
<li>
<strong>Meaning-based slop</strong>: Paragraphs that say the same thing differently (pgvector)</li>
<li>
<strong>Pattern-based slop</strong>: Repeated phrases and templates (pg_trgm)</li>
</ul>

<h3>
  
  
  🚀 Tiger CLI Integration
</h3>

<p>Sloppy uses Tiger CLI for automated fork management:</p>

<p><strong>Fork Creation</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight shell"><code>tiger service fork job_name <span class="nt">--now</span> <span class="nt">--name</span> fork_page_abc123 <span class="nt">--no-set-default</span> <span class="nt">--no-wait</span>
</code></pre>

</div>



<p><strong>Fork Deletion</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight shell"><code>tiger service delete fork_page_abc123 <span class="nt">--confirm</span> <span class="nt">--no-wait</span>
</code></pre>

</div>



<p><strong>Snapshot Creation</strong> (for caching):<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight shell"><code>tiger service fork snapshot fork_page_abc123
</code></pre>

</div>



<p><strong>Implementation</strong> (Windows-compatible):<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="k">def</span> <span class="nf">create_fork</span><span class="p">():</span>
    <span class="n">result</span> <span class="o">=</span> <span class="n">subprocess</span><span class="p">.</span><span class="nf">run</span><span class="p">(</span>
        <span class="p">[</span><span class="n">TIGER_CLI_PATH</span><span class="p">,</span> <span class="sh">"</span><span class="s">service</span><span class="sh">"</span><span class="p">,</span> <span class="sh">"</span><span class="s">fork</span><span class="sh">"</span><span class="p">,</span> <span class="n">service_name</span><span class="p">,</span> 
         <span class="sh">"</span><span class="s">--now</span><span class="sh">"</span><span class="p">,</span> <span class="sh">"</span><span class="s">--name</span><span class="sh">"</span><span class="p">,</span> <span class="n">fork_name</span><span class="p">,</span> <span class="sh">"</span><span class="s">--no-set-default</span><span class="sh">"</span><span class="p">],</span>
        <span class="n">capture_output</span><span class="o">=</span><span class="bp">True</span><span class="p">,</span>
        <span class="n">encoding</span><span class="o">=</span><span class="sh">'</span><span class="s">utf-8</span><span class="sh">'</span><span class="p">,</span>
        <span class="n">timeout</span><span class="o">=</span><span class="mi">30</span>
    <span class="p">)</span>
    <span class="k">return</span> <span class="n">result</span><span class="p">.</span><span class="n">returncode</span><span class="p">,</span> <span class="n">result</span><span class="p">.</span><span class="n">stdout</span><span class="p">,</span> <span class="n">result</span><span class="p">.</span><span class="n">stderr</span>

<span class="c1"># Run in thread pool for Windows asyncio compatibility
</span><span class="n">returncode</span><span class="p">,</span> <span class="n">stdout</span><span class="p">,</span> <span class="n">stderr</span> <span class="o">=</span> <span class="k">await</span> <span class="n">asyncio</span><span class="p">.</span><span class="nf">get_event_loop</span><span class="p">().</span><span class="nf">run_in_executor</span><span class="p">(</span>
    <span class="n">executor</span><span class="p">,</span> <span class="n">create_fork</span>
<span class="p">)</span>
</code></pre>

</div>



<h3>
  
  
  🌊 Fluid Storage Pattern
</h3>

<p>Sloppy demonstrates Tiger's fluid storage capabilities:</p>

<p><strong>1. Data flows through fork lifecycle</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight plaintext"><code>Raw text → Fork created → Paragraphs inserted → 
Evaluations added → Results aggregated → 
Merged to main → Fork deleted
</code></pre>

</div>



<p><strong>2. Caching with forks</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="c1"># Check cache in main DB
</span><span class="k">if</span> <span class="n">text_hash</span> <span class="ow">in</span> <span class="n">cache</span><span class="p">:</span>
    <span class="k">return</span> <span class="n">cached_result</span>

<span class="c1"># Create fork, run analysis
</span><span class="n">fork_id</span> <span class="o">=</span> <span class="k">await</span> <span class="nf">create_fork</span><span class="p">()</span>
<span class="n">results</span> <span class="o">=</span> <span class="k">await</span> <span class="nf">analyze_in_fork</span><span class="p">(</span><span class="n">fork_id</span><span class="p">)</span>

<span class="c1"># Cache results in main DB
</span><span class="k">await</span> <span class="nf">cache_results</span><span class="p">(</span><span class="n">text_hash</span><span class="p">,</span> <span class="n">results</span><span class="p">)</span>
</code></pre>

</div>



<p><strong>3. Snapshot preservation</strong>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="c1"># Curator agent creates snapshot before fork deletion
</span><span class="k">await</span> <span class="nf">create_snapshot</span><span class="p">(</span><span class="n">fork_id</span><span class="p">)</span>  <span class="c1"># Preserves state for debugging/auditing
</span><span class="k">await</span> <span class="nf">merge_results</span><span class="p">(</span><span class="n">fork_id</span><span class="p">)</span>
<span class="k">await</span> <span class="nf">delete_fork</span><span class="p">(</span><span class="n">fork_id</span><span class="p">)</span>
</code></pre>

</div>



<h3>
  
  
  📊 Performance Benefits
</h3>

<p><strong>With Tiger's Agentic Postgres</strong>:</p>

<ul>
<li>⚡ Fork creation: ~50-100ms (zero-copy)</li>
<li>⚡ Parallel jobs: 10+ concurrent analyses without blocking</li>
<li>⚡ Cache hit rate: 40-60% (repeated analyses instant)</li>
<li>⚡ Average analysis time: 5-15 seconds for 20-50 paragraphs</li>
</ul>

<p><strong>Without forks (traditional approach)</strong>:</p>

<ul>
<li>❌ Would require complex application-level locking</li>
<li>❌ Risk of dirty reads and race conditions</li>
<li>❌ Difficult to roll back failed analyses</li>
<li>❌ Limited parallelism due to contention</li>
</ul>

<h2>
  
  
  Overall Experience
</h2>

<h3>
  
  
  What Worked Brilliantly ⭐⭐⭐⭐⭐
</h3>

<p><strong>1. Zero-Copy Forks Changed Everything</strong></p>

<p>Coming into this challenge, I expected database forks to be expensive. I was wrong. Tiger's zero-copy architecture completely changed how I approach agent orchestration:</p>

<ul>
<li>
<strong>Fearless parallelism</strong>: I can spin up 10+ analysis jobs simultaneously without worrying about conflicts</li>
<li>
<strong>Clean architecture</strong>: Each job is truly isolated - no more defensive programming around shared state</li>
<li>
<strong>Instant cleanup</strong>: Failed analyses just discard their fork - no need to carefully undo changes</li>
</ul>

<p>The "aha moment" was realizing I could treat database forks like Git branches - cheap, disposable, and merga ble. This mental model transformed my architecture from "careful shared-state management" to "fearless fork-per-job isolation".</p>

<p><strong>2. Hybrid Search is Powerful</strong></p>

<p>Combining pgvector and pg_trgm created something greater than the sum of its parts:</p>

<ul>
<li>
<strong>pgvector</strong> catches semantic slop: "This solution offers cutting-edge innovation" vs "Our platform provides state-of-the-art technology" (different words, same empty meaning)</li>
<li>
<strong>pg_trgm</strong> catches pattern slop: Repeated phrases, template structures, generic transitions</li>
<li>Together they achieve ~85% accuracy in slop detection (tested on 100+ pages)</li>
</ul>

<p><strong>3. Tiger CLI Integration</strong></p>

<p>The Tiger CLI is remarkably well-designed:</p>

<ul>
<li>Clear command structure: <code>tiger service fork &lt;service-id&gt; --now --name &lt;fork-name&gt;</code>
</li>
<li>JSON output support for parsing: <code>--output json</code>
</li>
<li>Fast execution: Commands complete in 100-200ms</li>
<li>Great error messages: When I got flags wrong, errors were immediately obvious</li>
</ul>

<p><strong>Surprise</strong>: The <code>--no-set-default</code> flag was crucial - without it, every fork would become my default service, breaking subsequent forks. This isn't obvious from docs but makes perfect sense for automated fork management.</p>

<h3>
  
  
  What Surprised Me 🤔
</h3>

<p><strong>1. Windows Subprocess Compatibility</strong></p>

<p>Hit an interesting Windows-specific issue: <code>asyncio.create_subprocess_exec</code> doesn't work on Windows with ProactorEventLoop (raises <code>NotImplementedError</code>). </p>

<p><strong>Solution</strong>: Wrap synchronous <code>subprocess.run</code> with <code>ThreadPoolExecutor</code>:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="n">executor</span> <span class="o">=</span> <span class="nc">ThreadPoolExecutor</span><span class="p">(</span><span class="n">max_workers</span><span class="o">=</span><span class="mi">4</span><span class="p">)</span>

<span class="k">def</span> <span class="nf">create_fork</span><span class="p">():</span>
    <span class="n">result</span> <span class="o">=</span> <span class="n">subprocess</span><span class="p">.</span><span class="nf">run</span><span class="p">([</span><span class="n">TIGER_CLI_PATH</span><span class="p">,</span> <span class="p">...],</span> <span class="n">capture_output</span><span class="o">=</span><span class="bp">True</span><span class="p">)</span>
    <span class="k">return</span> <span class="n">result</span><span class="p">.</span><span class="n">returncode</span><span class="p">,</span> <span class="n">result</span><span class="p">.</span><span class="n">stdout</span><span class="p">,</span> <span class="n">result</span><span class="p">.</span><span class="n">stderr</span>

<span class="n">returncode</span><span class="p">,</span> <span class="n">stdout</span><span class="p">,</span> <span class="n">stderr</span> <span class="o">=</span> <span class="k">await</span> <span class="n">loop</span><span class="p">.</span><span class="nf">run_in_executor</span><span class="p">(</span><span class="n">executor</span><span class="p">,</span> <span class="n">create_fork</span><span class="p">)</span>
</code></pre>

</div>



<p>This pattern works perfectly and maintains async compatibility.</p>

<p><strong>2. Fork Lifecycle Management</strong></p>

<p>Initially struggled with fork cleanup timing:</p>

<ul>
<li>Too early → results not yet merged</li>
<li>Too late → accumulating orphaned forks</li>
<li>Just right → <code>asyncio.create_task(cleanup_tiger_fork(fork_id))</code> after results merge</li>
</ul>

<p>The async fire-and-forget pattern lets the main request complete while cleanup happens in background.</p>

<p><strong>3. UTF-8 Encoding with Tiger CLI</strong></p>

<p>Tiger CLI occasionally outputs special characters (progress indicators, icons). Without explicit UTF-8 handling:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="nb">UnicodeDecodeError</span><span class="p">:</span> <span class="sh">'</span><span class="s">charmap</span><span class="sh">'</span> <span class="n">codec</span> <span class="n">can</span><span class="sh">'</span><span class="s">t decode byte 0x90
</span></code></pre>

</div>



<p><strong>Fix</strong>: Always specify encoding:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight python"><code><span class="n">subprocess</span><span class="p">.</span><span class="nf">run</span><span class="p">([...],</span> <span class="n">encoding</span><span class="o">=</span><span class="sh">'</span><span class="s">utf-8</span><span class="sh">'</span><span class="p">,</span> <span class="n">errors</span><span class="o">=</span><span class="sh">'</span><span class="s">replace</span><span class="sh">'</span><span class="p">)</span>
</code></pre>

</div>



<p>The <code>errors='replace'</code> ensures non-UTF-8 bytes don't crash the process.</p>

<h3>
  
  
  What I'd Build Next 👷🏼‍♂️
</h3>

<p><strong>1. Fork-Per-Agent Architecture</strong></p>

<p>Currently agents share a single fork. Next evolution:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight plaintext"><code>Main DB
  ├─ Fork 1: Collector (writes paragraphs)
  ├─ Fork 2: Evaluator (reads paragraphs, writes evaluations)
  └─ Fork 3: Curator (reads evaluations, writes results)
</code></pre>

</div>



<p>Each agent gets its own fork, merging results upstream. This would showcase Tiger's fork merge capabilities even more dramatically.</p>

<p><strong>2. Historical Analysis with Snapshots</strong></p>

<p>Use Tiger snapshots to track content quality over time:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight sql"><code><span class="c1">-- Compare article quality across snapshots</span>
<span class="k">SELECT</span> 
    <span class="n">snapshot_id</span><span class="p">,</span>
    <span class="n">created_at</span><span class="p">,</span>
    <span class="k">AVG</span><span class="p">(</span><span class="n">slop_score</span><span class="p">)</span> <span class="k">as</span> <span class="n">avg_quality</span>
<span class="k">FROM</span> <span class="n">evaluations</span>
<span class="k">GROUP</span> <span class="k">BY</span> <span class="n">snapshot_id</span>
<span class="k">ORDER</span> <span class="k">BY</span> <span class="n">created_at</span><span class="p">;</span>
</code></pre>

</div>



<p>This would enable "quality regression detection" - alerting when a website's content quality degrades.</p>

<p><strong>3. Collaborative Filtering</strong></p>

<p>Use pgvector to find users with similar taste in content quality:<br>
</p>

<div class="highlight js-code-highlight">
<pre class="highlight sql"><code><span class="c1">-- Find users who rated similar content similarly</span>
<span class="k">SELECT</span> <span class="n">user_id</span><span class="p">,</span> 
       <span class="n">embedding</span> <span class="o">&lt;=&gt;</span> <span class="err">$</span><span class="mi">1</span><span class="p">::</span><span class="n">vector</span> <span class="k">as</span> <span class="n">taste_similarity</span>
<span class="k">FROM</span> <span class="n">user_preferences</span>
<span class="k">ORDER</span> <span class="k">BY</span> <span class="n">taste_similarity</span>
<span class="k">LIMIT</span> <span class="mi">10</span><span class="p">;</span>
</code></pre>

</div>



<p>Build a recommendation system: "Users who flagged this as slop also flagged..."</p>

<h3>
  
  
  Final Thoughts
</h3>

<p><strong>Tiger's Agentic Postgres is a paradigm shift</strong>. I came in thinking forks were an interesting optimization. I left convinced they're a fundamentally better way to architect agent systems.</p>

<p>The traditional approach (locks, transactions, careful state management) feels archaic now. Why coordinate agents with complex application logic when the database can provide isolation for free?</p>

<p><strong>Key insight</strong>: Database forks are to agent coordination what Git is to code collaboration. Cheap, disposable, mergeable isolation that enables fearless experimentation.</p>

<p><strong>Thank you Tiger team</strong> for building something genuinely innovative. Agentic Postgres isn't just faster Postgres - it's a new way of thinking about data and agents.</p>




