export interface ToolMetadata {
  slug: string;
  name: string;
  description: string;
  category: 'Agentic AI' | 'Vector Database' | 'Generative Art' | 'LLM Framework' | 'Inference' | 'Other';
  relatedTags: string[]; // For backfill jobs
  whyLearn?: string;
  avgSalary?: string;
}

export const TOOLS: ToolMetadata[] = [
  {
    slug: 'langchain',
    name: 'LangChain',
    description: 'LangChain is a framework for developing applications powered by language models. It enables applications that are data-aware and agentic, allowing language models to interact with their environment.',
    category: 'LLM Framework',
    relatedTags: ['Machine Learning', 'Python', 'Generative AI', 'NLP'],
    whyLearn: 'LangChain has become the de-facto standard for building LLM applications, making it one of the most in-demand skills for AI engineers.',
    avgSalary: '$140,000 - $220,000',
  },
  {
    slug: 'llamaindex',
    name: 'LlamaIndex',
    description: 'LlamaIndex is a data framework for LLM applications to ingest, structure, and access private or domain-specific data. It acts as a bridge between your custom data and large language models.',
    category: 'LLM Framework',
    relatedTags: ['Machine Learning', 'Python', 'Data Science', 'RAG'],
    whyLearn: 'As RAG (Retrieval-Augmented Generation) becomes standard in enterprise AI, LlamaIndex expertise is crucial for connecting data to models.',
    avgSalary: '$135,000 - $210,000',
  },
  {
    slug: 'pinecone',
    name: 'Pinecone',
    description: 'Pinecone is a fully managed vector database that makes it easy to add vector search to production applications. It is essential for building semantic search and recommendation systems.',
    category: 'Vector Database',
    relatedTags: ['Machine Learning', 'Database', 'Python', 'RAG'],
    whyLearn: 'Vector databases are the memory of AI. Pinecone is a market leader, and skills here are applicable to almost all modern AI search applications.',
    avgSalary: '$130,000 - $200,000',
  },
  {
    slug: 'autogpt',
    name: 'AutoGPT',
    description: 'AutoGPT is an experimental open-source application showcasing the capabilities of the GPT-4 language model. It drives the vision of autonomous AI agents that can perform tasks with little human intervention.',
    category: 'Agentic AI',
    relatedTags: ['Generative AI', 'Python', 'Machine Learning'],
    whyLearn: 'Autonomous agents are the next frontier after chatbots. Understanding AutoGPT\'s architecture positions you at the bleeding edge of AI.',
  },
  {
    slug: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: 'Stable Diffusion is a deep learning, text-to-image model released in 2022. It is primarily used to generate detailed images conditioned on text descriptions.',
    category: 'Generative Art',
    relatedTags: ['Computer Vision', 'Generative AI', 'Python', 'PyTorch'],
    whyLearn: 'The ability to fine-tune and deploy custom image generation models is highly valuable in media, gaming, and design industries.',
  },
  {
    slug: 'hugging-face',
    name: 'Hugging Face',
    description: 'Hugging Face is the "GitHub of AI," providing a hub for thousands of pre-trained models, datasets, and demo apps. It is central to the open-source AI ecosystem.',
    category: 'Other',
    relatedTags: ['Machine Learning', 'NLP', 'Python', 'Transformers'],
  },
  {
    slug: 'openai-api',
    name: 'OpenAI API',
    description: 'The OpenAI API provides access to powerful models like GPT-4 and DALL-E. It is the most widely used interface for building commercial AI applications today.',
    category: 'LLM Framework',
    relatedTags: ['Generative AI', 'Python', 'Software Engineer'],
  },
  {
    slug: 'midjourney',
    name: 'Midjourney',
    description: 'Midjourney is a generative artificial intelligence program and service that generates images from natural language descriptions, called prompts. Mastery of Midjourney prompting is a key skill for modern creative directors and designers.',
    category: 'Generative Art',
    relatedTags: ['Generative AI', 'Design', 'Creative Director'],
    avgSalary: '$90,000 - $150,000',
  },
  {
    slug: 'tensorflow',
    name: 'TensorFlow',
    description: 'TensorFlow is an end-to-end open-source platform for machine learning. It has a comprehensive, flexible ecosystem of tools, libraries, and community resources that lets researchers push the state-of-the-art in ML.',
    category: 'LLM Framework',
    relatedTags: ['Machine Learning', 'Deep Learning', 'Python'],
  },
  {
    slug: 'pytorch',
    name: 'PyTorch',
    description: 'PyTorch is an open source machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing. It is favored by researchers for its flexibility.',
    category: 'LLM Framework',
    relatedTags: ['Machine Learning', 'Deep Learning', 'Python', 'Research'],
  },
  {
    slug: 'zapier-ai',
    name: 'Zapier AI Actions',
    description: 'Zapier AI Actions allow AI agents to interact with the 6,000+ apps on Zapier\'s platform. This is a critical tool for building "Agentic" workflows that can actually perform tasks in the real world.',
    category: 'Agentic AI',
    relatedTags: ['Automation', 'No-Code', 'Productivity'],
  },
  {
    slug: 'chromadb',
    name: 'ChromaDB',
    description: 'Chroma is the open-source embedding database. Chroma makes it easy to build LLM apps by making knowledge, facts, and skills pluggable for LLMs.',
    category: 'Vector Database',
    relatedTags: ['Database', 'Python', 'Machine Learning'],
  },
  {
    slug: 'weaviate',
    name: 'Weaviate',
    description: 'Weaviate is an open-source vector database. It allows you to store data objects and vector embeddings from your favorite ML-models, and scale seamlessly into billions of data objects.',
    category: 'Vector Database',
    relatedTags: ['Database', 'Go', 'Machine Learning'],
  },
];

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return TOOLS.find((t) => t.slug === slug.toLowerCase());
}

export function getAllToolSlugs(): string[] {
  return TOOLS.map((t) => t.slug);
}
