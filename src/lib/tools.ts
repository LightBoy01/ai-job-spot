export interface ToolMetadata {
  slug: string;
  name: string;
  description: string;
  category: 'Agentic AI' | 'Vector Database' | 'Generative Art' | 'LLM Framework' | 'Inference' | 'Infrastructure' | 'Observability' | 'Other';
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
  // --- Agentic AI ---
  {
    slug: 'crewai',
    name: 'CrewAI',
    description: 'CrewAI is a framework for orchestrating role-playing, autonomous AI agents. It enables agents to work together as a cohesive crew to tackle complex tasks.',
    category: 'Agentic AI',
    relatedTags: ['Python', 'Agents', 'LangChain', 'Automation'],
    whyLearn: 'Multi-agent orchestration is the next phase of AI automation. CrewAI is leading the pack for building collaborative agent swarms.',
    avgSalary: '$135,000 - $190,000',
  },
  {
    slug: 'babyagi',
    name: 'BabyAGI',
    description: 'BabyAGI is an AI-powered task management system. It uses OpenAI and vector databases to create, prioritize, and execute tasks autonomously based on a given objective.',
    category: 'Agentic AI',
    relatedTags: ['Python', 'Agents', 'OpenAI', 'Autonomous'],
    whyLearn: 'Understanding recursive task-generation loops is fundamental to building autonomous systems.',
  },
  {
    slug: 'semantic-kernel',
    name: 'Semantic Kernel',
    description: 'Semantic Kernel is an open-source SDK from Microsoft that lets you easily combine AI services like OpenAI, Azure OpenAI, and Hugging Face with conventional programming languages like C# and Python.',
    category: 'Agentic AI',
    relatedTags: ['C#', '.NET', 'Python', 'Microsoft', 'Enterprise'],
    whyLearn: 'For enterprise developers in the Microsoft ecosystem, Semantic Kernel is the bridge to integrating LLMs into existing business apps.',
    avgSalary: '$140,000 - $210,000',
  },
  {
    slug: 'autogen',
    name: 'AutoGen',
    description: 'AutoGen is a framework that enables the development of LLM applications using multiple agents that can converse with each other to solve tasks.',
    category: 'Agentic AI',
    relatedTags: ['Python', 'Microsoft', 'Agents', 'Multi-Agent'],
    whyLearn: 'Microsoft\'s AutoGen is a powerful framework for simulating complex multi-agent conversations and workflows.',
  },

  // --- Infrastructure & Serving ---
  {
    slug: 'vercel-ai-sdk',
    name: 'Vercel AI SDK',
    description: 'The Vercel AI SDK is an open-source library for building AI-powered streaming text and chat interfaces. It abstracts away the complexity of streaming responses from LLMs.',
    category: 'Infrastructure',
    relatedTags: ['Next.js', 'React', 'TypeScript', 'Frontend'],
    whyLearn: 'If you are a frontend or full-stack developer building AI apps, this is the standard toolkit for handling streaming UI.',
    avgSalary: '$120,000 - $180,000',
  },
  {
    slug: 'ollama',
    name: 'Ollama',
    description: 'Ollama allows you to run open-source large language models, such as Llama 3, locally on your machine. It simplifies the deployment and management of local models.',
    category: 'Infrastructure',
    relatedTags: ['Local LLM', 'DevOps', 'Go', 'Privacy'],
    whyLearn: 'Local inference is booming for privacy and cost reasons. Ollama is the easiest way to run models on-prem or on-device.',
  },
  {
    slug: 'groq',
    name: 'Groq',
    description: 'Groq is an AI infrastructure company that built the LPU (Language Processing Unit), enabling the fastest AI inference speeds in the world.',
    category: 'Infrastructure',
    relatedTags: ['Hardware', 'Inference', 'Latency', 'Chip Design'],
    whyLearn: 'Speed opens up new use cases. Building real-time voice or video AI apps requires the ultra-low latency Groq provides.',
  },
  {
    slug: 'modal',
    name: 'Modal',
    description: 'Modal is a serverless cloud computing platform designed for data teams. It allows you to run code in the cloud without managing infrastructure, perfect for AI inference and fine-tuning.',
    category: 'Infrastructure',
    relatedTags: ['Serverless', 'Python', 'DevOps', 'Cloud'],
    whyLearn: 'Modal is becoming the "Vercel for Backend AI," simplifying how engineers deploy complex Python workloads.',
    avgSalary: '$150,000 - $230,000',
  },
  {
    slug: 'runpod',
    name: 'RunPod',
    description: 'RunPod is a cloud platform that provides GPU instances for machine learning and AI. It offers affordable and scalable GPU compute for training and inference.',
    category: 'Infrastructure',
    relatedTags: ['GPU', 'Cloud', 'Training', 'Fine-tuning'],
    whyLearn: 'Cost-effective GPU access is critical for startups training their own models.',
  },

  // --- Observability & Eval ---
  {
    slug: 'langsmith',
    name: 'LangSmith',
    description: 'LangSmith is a platform for debugging, testing, evaluating, and monitoring LLM applications, built by the makers of LangChain.',
    category: 'Observability',
    relatedTags: ['LangChain', 'Testing', 'MLOps', 'Debugging'],
    whyLearn: 'As AI apps move to production, "does it actually work?" becomes the #1 question. LangSmith answers that.',
    avgSalary: '$140,000 - $200,000',
  },
  {
    slug: 'weights-and-biases',
    name: 'Weights & Biases',
    description: 'W&B is the developer platform for machine learning. It helps teams track experiments, version models, and evaluate performance.',
    category: 'Observability',
    relatedTags: ['MLOps', 'Experiment Tracking', 'Data Science'],
    whyLearn: 'The industry standard for tracking ML experiments. Essential for any serious model training workflow.',
  },
  {
    slug: 'arize-ai',
    name: 'Arize AI',
    description: 'Arize AI is an ML observability platform that helps teams monitor, troubleshoot, and explain model performance in production.',
    category: 'Observability',
    relatedTags: ['MLOps', 'Monitoring', 'Enterprise'],
    whyLearn: 'Detecting model drift and hallucinations in production is critical for enterprise AI adoption.',
  },

  // --- Emerging & Specialized ---
  {
    slug: 'unstructured',
    name: 'Unstructured',
    description: 'Unstructured provides open-source components for ingesting and processing unstructured data (PDFs, HTML, Word docs) for LLMs.',
    category: 'Other',
    relatedTags: ['Data Engineering', 'ETL', 'Python', 'RAG'],
    whyLearn: 'Real-world data is messy. Unstructured is the leading tool for cleaning that mess so LLMs can read it.',
  },
  {
    slug: 'haystack',
    name: 'Haystack',
    description: 'Haystack is an open-source NLP framework by deepset that allows you to build end-to-end search pipelines using LLMs and Transformer models.',
    category: 'LLM Framework',
    relatedTags: ['Python', 'NLP', 'Search', 'RAG'],
    whyLearn: 'A powerful, modular alternative to LangChain for building production-ready search and QA systems.',
  },
  {
    slug: 'dspy',
    name: 'DSPy',
    description: 'DSPy is a framework for programming—rather than prompting—language models. It separates the flow of your program from the parameters (prompts) and optimizes them automatically.',
    category: 'LLM Framework',
    relatedTags: ['Prompt Engineering', 'Research', 'Python', 'Stanford'],
    whyLearn: 'DSPy moves us from "prompt guessing" to "prompt programming." It is widely considered the future of robust LLM system design.',
    avgSalary: '$160,000 - $250,000',
  },
  {
    slug: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral AI provides state-of-the-art open models. Their models are known for high performance and efficiency, rivaling much larger proprietary models.',
    category: 'LLM Framework',
    relatedTags: ['Open Source', 'LLM', 'Europe', 'Fine-tuning'],
  },
  {
    slug: 'anthropic-api',
    name: 'Anthropic API',
    description: 'Access to Claude, a family of safe and capable AI models. Claude 3 is particularly known for its large context window and nuanced reasoning.',
    category: 'LLM Framework',
    relatedTags: ['Generative AI', 'LLM', 'Safety', 'Context Window'],
  },
  {
    slug: 'vllm',
    name: 'vLLM',
    description: 'vLLM is a high-throughput and memory-efficient inference and serving engine for LLMs.',
    category: 'Infrastructure',
    relatedTags: ['Inference', 'Python', 'Performance', 'CUDA'],
    whyLearn: 'If you need to serve open-source models at scale, vLLM is the gold standard for performance.',
  },
  {
    slug: 'gradio',
    name: 'Gradio',
    description: 'Gradio is an open-source Python library that is used to create easy-to-use, customizable UI components for your machine learning model.',
    category: 'Infrastructure',
    relatedTags: ['Python', 'Frontend', 'Demo', 'Prototyping'],
    whyLearn: 'The fastest way to build a web interface for your ML model demo. Essential for sharing work with stakeholders.',
  }
];

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return TOOLS.find((t) => t.slug === slug.toLowerCase());
}

export function getAllToolSlugs(): string[] {
  return TOOLS.map((t) => t.slug);
}
