export interface JobPosting {
  id?: string; // Optional, as Firestore generates this
  title: string;
  company: string;
  description: string;
  location: string;
  salaryRange?: string; // Optional
  postedDate: Date;
  applicationLink: string;
  tags: string[]; // e.g., ['AI', 'Machine Learning', 'Remote']
  // Add any other fields we deem necessary
}
