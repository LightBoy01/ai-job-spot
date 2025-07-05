const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample Data for Jobs
const jobs = [
  {
    title: 'AI Research Scientist',
    company: 'Google',
    description: `
      <p>Google AI is seeking a highly motivated and experienced AI Research Scientist to join our innovative team. In this role, you will be at the forefront of developing cutting-edge artificial intelligence technologies that will shape the future of information and interaction.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Conduct fundamental and applied research in areas such as machine learning, deep learning, natural language processing, computer vision, and reinforcement learning.</li>
        <li>Design, implement, and evaluate novel AI models and algorithms.</li>
        <li>Publish research findings in top-tier conferences and journals.</li>
        <li>Collaborate with product teams to integrate research prototypes into Google products.</li>
        <li>Mentor junior researchers and engineers.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Ph.D. in Computer Science, Artificial Intelligence, Machine Learning, or a related technical field.</li>
        <li>Strong publication record in top-tier AI conferences (e.g., NeurIPS, ICML, ICLR, CVPR, ACL).</li>
        <li>Proficiency in one or more programming languages such as Python, TensorFlow, PyTorch, or JAX.</li>
        <li>Experience with large-scale data processing and distributed systems.</li>
        <li>Excellent communication and collaboration skills.</li>
        <li>Demonstrated ability to lead research projects from conception to publication.</li>
      </ul>
    `,
    location: 'Mountain View, CA',
    salaryRange: '$150,000 - $250,000',
    postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-01T10:00:00Z')),
    applicationLink: 'https://careers.google.com/jobs/results/12345/',
    tags: ['AI', 'Research', 'Full-time', 'Machine Learning'],
  },
  {
    title: 'Machine Learning Engineer',
    company: 'OpenAI',
    description: `
      <p>OpenAI is looking for exceptional Machine Learning Engineers to help us build safe and beneficial artificial general intelligence (AGI). You will work on challenging problems at the intersection of research and engineering, contributing to the development of our foundational models.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Develop and optimize large-scale machine learning systems.</li>
        <li>Implement and fine-tune state-of-the-art deep learning models.</li>
        <li>Contribute to the entire ML lifecycle, from data collection and preprocessing to model deployment and monitoring.</li>
        <li>Collaborate closely with research scientists to translate cutting-edge research into robust and efficient systems.</li>
        <li>Participate in code reviews and contribute to a high-quality codebase.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's or Master's degree in Computer Science, Machine Learning, or a related field.</li>
        <li>3+ years of experience in machine learning engineering.</li>
        <li>Strong programming skills in Python and experience with ML frameworks (e.g., TensorFlow, PyTorch).</li>
        <li>Experience with cloud platforms (e.g., AWS, GCP, Azure) and distributed computing.</li>
        <li>Solid understanding of machine learning fundamentals and algorithms.</li>
      </ul>
      <h3>Preferred Qualifications:</h3>
      <ul>
        <li>Experience with large-scale distributed training of deep neural networks.</li>
        <li>Familiarity with MLOps practices and tools.</li>
      </ul>
    `,
    location: 'San Francisco, CA',
    salaryRange: '$160,000 - $260,000',
    postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-28T14:30:00Z')),
    applicationLink: 'https://openai.com/careers/12346',
    tags: ['ML', 'Engineering', 'Full-time', 'Deep Learning'],
  },
  {
    title: 'Data Scientist',
    company: 'Microsoft',
    description: `
      <p>Microsoft is seeking a talented Data Scientist to join our team, focusing on leveraging data to drive product innovation and business strategy. You will work with vast datasets to uncover insights, build predictive models, and inform critical decisions.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Analyze complex datasets to identify trends, patterns, and actionable insights.</li>
        <li>Develop and implement machine learning models for various applications (e.g., forecasting, recommendation systems, anomaly detection).</li>
        <li>Design and execute A/B tests to evaluate the impact of product changes.</li>
        <li>Communicate findings and recommendations to stakeholders through clear visualizations and presentations.</li>
        <li>Collaborate with engineers and product managers to integrate data science solutions into products.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Master's or Ph.D. in a quantitative field (e.g., Statistics, Computer Science, Mathematics, Economics).</li>
        <li>2+ years of experience in data science or a related role.</li>
        <li>Proficiency in Python or R, and SQL.</li>
        <li>Experience with data visualization tools (e.g., Tableau, Power BI).</li>
        <li>Strong statistical modeling and machine learning skills.</li>
      </ul>
      <h3>Preferred Qualifications:</h3>
      <ul>
        <li>Experience with big data technologies (e.g., Spark, Hadoop).</li>
        <li>Familiarity with cloud-based data platforms (e.g., Azure Data Lake, Databricks).</li>
      </ul>
    `,
    location: 'Redmond, WA',
    salaryRange: '$130,000 - $220,000',
    postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-25T09:15:00Z')),
    applicationLink: 'https://careers.microsoft.com/v2/global/en/job/12347',
    tags: ['Data Science', 'Analytics', 'Full-time'],
  },
  {
    title: 'AI Ethics Specialist',
    company: 'IBM',
    description: `
      <p>IBM is looking for an AI Ethics Specialist to ensure our AI systems are developed and deployed responsibly and ethically. You will work at the intersection of technology, policy, and societal impact, guiding the ethical considerations of AI products and research.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Develop and implement ethical AI guidelines and best practices.</li>
        <li>Conduct ethical reviews of AI projects and products.</li>
        <li>Advise research and development teams on fairness, transparency, accountability, and privacy in AI.</li>
        <li>Stay abreast of emerging ethical AI challenges and regulatory landscapes.</li>
        <li>Contribute to thought leadership and external engagement on AI ethics.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Master's or Ph.D. in Ethics, Philosophy, Law, Computer Science, or a related field with a focus on AI.</li>
        <li>3+ years of experience in AI ethics, responsible AI, or technology policy.</li>
        <li>Strong understanding of AI/ML technologies and their societal implications.</li>
        <li>Excellent analytical, communication, and interpersonal skills.</li>
        <li>Ability to work collaboratively in a multidisciplinary environment.</li>
      </ul>
      <h3>Preferred Qualifications:</h3>
      <ul>
        <li>Experience with ethical AI frameworks and tools.</li>
        <li>Background in legal or policy analysis related to technology.</li>
      </ul>
    `,
    location: 'Armonk, NY (Remote options available)',
    salaryRange: '$120,000 - $190,000',
    postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-20T11:00:00Z')),
    applicationLink: 'https://www.ibm.com/careers/job/12348',
    tags: ['AI Ethics', 'Policy', 'Remote'],
  },
  {
    title: 'Robotics Engineer',
    company: 'Boston Dynamics',
    description: `
      <p>Boston Dynamics is seeking a talented Robotics Engineer to join our team and contribute to the development of advanced mobile robots. You will work on challenging problems related to robot perception, control, and autonomy.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Design, implement, and test software for robot control and navigation.</li>
        <li>Develop algorithms for perception, mapping, and localization.</li>
        <li>Integrate sensors and actuators into robotic systems.</li>
        <li>Conduct experiments and analyze data to improve robot performance.</li>
        <li>Collaborate with a multidisciplinary team of engineers and researchers.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's or Master's degree in Robotics, Computer Science, Electrical Engineering, or a related field.</li>
        <li>2+ years of experience in robotics software development.</li>
        <li>Proficiency in C++ or Python.</li>
        <li>Experience with ROS (Robot Operating System) or similar robotics frameworks.</li>
        <li>Strong understanding of control systems, kinematics, and dynamics.</li>
      </ul>
      <h3>Preferred Qualifications:</h3>
      <ul>
        <li>Experience with real-time operating systems (RTOS).</li>
        <li>Familiarity with computer vision and machine learning techniques for robotics.</li>
      </ul>
    `,
    location: 'Waltham, MA',
    salaryRange: '$140,000 - $230,000',
    postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-18T16:00:00Z')),
    applicationLink: 'https://www.bostondynamics.com/careers/12349',
    tags: ['Robotics', 'Engineering', 'Hardware'],
  },
];

// Sample Data for Articles
const articles = [
  {
    slug: 'the-rise-of-generative-ai',
    title: 'The Rise of Generative AI: A New Era of Creativity',
    author: 'AI Job Spot Team',
    publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-03T08:00:00Z')),
    content: `
      <p>Generative AI, with its ability to create novel content like images, text, and even code, is rapidly transforming industries and redefining creativity. From DALL-E to ChatGPT, these models are pushing the boundaries of what machines can do.</p>
      <h3>Impact on Industries:</h3>
      <ul>
        <li><strong>Art & Design:</strong> Artists are using generative AI as a co-creation tool, exploring new styles and accelerating their workflows.</li>
        <li><strong>Content Creation:</strong> Marketers and writers are leveraging AI to generate drafts, headlines, and social media content, boosting productivity.</li>
        <li><strong>Software Development:</strong> Code-generating AI assistants are helping developers write code faster and more efficiently, reducing repetitive tasks.</li>
      </ul>
      <p>As generative AI continues to evolve, its applications will only expand, leading to unprecedented opportunities and challenges.</p>
    `,
    imageUrl: '/images/generative-ai.jpg', // Placeholder image URL
  },
  {
    slug: 'ethical-considerations-in-ai',
    title: 'Navigating the Ethical Landscape of Artificial Intelligence',
    author: 'Dr. Emily Chen',
    publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-29T10:00:00Z')),
    content: `
      <p>As AI becomes more integrated into our daily lives, the ethical implications of its development and deployment are becoming increasingly critical. Addressing issues like bias, privacy, and accountability is paramount for building trustworthy AI systems.</p>
      <h3>Key Ethical Challenges:</h3>
      <ul>
        <li><strong>Bias:</strong> AI models can perpetuate and amplify existing societal biases if trained on unrepresentative or biased data.</li>
        <li><strong>Privacy:</strong> The collection and use of vast amounts of personal data by AI systems raise significant privacy concerns.</li>
        <li><strong>Accountability:</strong> Determining responsibility when AI systems make errors or cause harm is a complex legal and ethical challenge.</li>
      </ul>
      <p>Developing robust ethical frameworks, fostering interdisciplinary collaboration, and engaging in public discourse are essential steps towards responsible AI innovation.</p>
    `,
    imageUrl: '/images/ethical-ai.jpg', // Placeholder image URL
  },
];

async function seedData() {
  console.log('Starting Firestore data seeding...');

  // Seed Jobs
  for (const job of jobs) {
    try {
      await db.collection('jobs').add(job);
      console.log(`Added job: ${job.title} at ${job.company}`);
    } catch (error) {
      console.error(`Error adding job ${job.title} at ${job.company}:`, error);
    }
  }

  // Seed Articles
  for (const article of articles) {
    try {
      await db.collection('articles').add(article);
      console.log(`Added article: ${article.title}`);
    } catch (error) {
      console.error(`Error adding article ${article.title}:`, error);
    }
  }

  console.log('Firestore data seeding complete.');
}

seedData().catch(console.error);