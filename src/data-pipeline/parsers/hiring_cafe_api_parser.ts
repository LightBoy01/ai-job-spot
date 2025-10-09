import { IParser, ParsedJobDetails } from './base_parser.js';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const JobInformationSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const ProcessedJobDataSchema = z.object({
  company_name: z.string(),
  formatted_workplace_location: z.string().optional(),
  is_compensation_transparent: z.boolean().optional(),
  yearly_min_compensation: z.number().optional(),
  yearly_max_compensation: z.number().optional(),
  seniority_level: z.string().optional(),
  commitment: z.array(z.string()).optional(),
  role_activities: z.array(z.string()).optional(),
  technical_tools: z.array(z.string()).optional(),
  requirements_summary: z.string().optional(),
});

const HiringCafeJobSchema = z.object({
  job_information: JobInformationSchema,
  v5_processed_job_data: ProcessedJobDataSchema,
});


// This parser is designed to work with the JSON object of a single job
// from the hiring.cafe internal API response.
export class HiringCafeApiParser implements IParser {
  parse(data: unknown): ParsedJobDetails {
    const validationResult = HiringCafeJobSchema.safeParse(data);

    if (!validationResult.success) {
      throw new Error(`HiringCafeApiParser validation failed: ${validationResult.error.message}`);
    }

    const typedData = validationResult.data;
    const jobInfo = typedData.job_information;
    const processedData = typedData.v5_processed_job_data;

    // Construct the salary range string
    let salaryRange: string | undefined;
    if (processedData.is_compensation_transparent && processedData.yearly_min_compensation) {
      salaryRange = `$${processedData.yearly_min_compensation.toLocaleString()}`;
      if (processedData.yearly_max_compensation) {
        salaryRange += ` - $${processedData.yearly_max_compensation.toLocaleString()}`;
      }
    }

    const responsibilities = processedData.role_activities || [];
    const qualifications = processedData.technical_tools || [];
    if (processedData.requirements_summary) {
        qualifications.unshift(processedData.requirements_summary);
    }

    const details: ParsedJobDetails = {
      title: jobInfo.title,
      company: processedData.company_name,
      location: processedData.formatted_workplace_location,
      description: DOMPurify.sanitize(jobInfo.description), // This is already in HTML format
      jobLevel: processedData.seniority_level,
      employeeRole: processedData.commitment ? processedData.commitment[0] : undefined,
      salaryRange: salaryRange,
      responsibilities: responsibilities,
      qualifications: qualifications,
    };

    return details;
  }
}
