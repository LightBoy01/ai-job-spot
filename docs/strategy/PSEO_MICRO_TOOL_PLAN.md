# pSEO Strategy: The "Micro-Tool" Dominance

**Objective:** Capture long-tail, high-intent traffic for specific AI tools (e.g., "LangChain," "Pinecone," "LlamaIndex") where competition is lower than broad terms like "AI Jobs."

**Source:** `docs/strategy/pseo_tip.md`

## Phase 1: Structure & Routing (Status: Complete)
- [x] **Data Layer:** Create a registry of AI Tools with metadata (slug, name, description, related tags for backfill).
- [x] **Routing:** Implement `src/pages/tools/[tool].tsx`.
- [x] **Smart Backfill:** Logic to fetch relevant "broad" jobs if specific "tool" jobs are missing.
- [x] **Sitemap:** Add tool pages to sitemap.

## Phase 2: Content Injection (Status: In Progress)
- [x] **Content Generation:** Populate the registry with rich descriptions ("What is X?", "Salary Stats") for 50+ tools (Started with 15+ key tools).
- [x] **UI:** Design the Tool Hub header to display this content effectively (SEO "Hook").
- [x] **Index Page:** Created `/tools` index page with categories and simulator link.

## Phase 3: Conversion & Growth (Status: Pending)
- [x] **Career Simulator:** Implemented interactive career path simulator as a high-engagement tool.
- [ ] **Talent Collective:** Add "Join the [Tool] Talent Pool" CTA.
- [ ] **Salary Transparency:** Add "Reverse Salary" form/chart.

## Tool Registry (Implemented)
1. LangChain
2. LlamaIndex
3. Pinecone
4. AutoGPT
5. Stable Diffusion
6. Midjourney
7. Hugging Face
8. OpenAI API
9. ChromaDB
10. Weaviate
11. TensorFlow
12. PyTorch
13. Zapier AI Actions
... and more.