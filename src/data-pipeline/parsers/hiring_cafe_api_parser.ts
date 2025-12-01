import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const JobInformationSchema = z.object({
    description: z.string(),
    title: z.string(),
});

const ProcessedJobDataSchema = z.object({
    commitment: z.array(z.string()).optional(),
    company_name: z.string(),
    formatted_workplace_location: z.string().optional(),
    is_compensation_transparent: z.boolean().optional(),
    requirements_summary: z.string().optional(),
    role_activities: z.array(z.string()).optional(),
    seniority_level: z.string().optional(),
    technical_tools: z.array(z.string()).optional(),
    yearly_max_compensation: z.number().optional(),
    yearly_min_compensation: z.number().optional(),
});

const HiringCafeJobSchema = z.object({
    job_information: JobInformationSchema,
    v5_processed_job_data: ProcessedJobDataSchema,
});

type HiringCafeJob = z.infer<typeof HiringCafeJobSchema>;

interface ParsedJobDetails {
    company: string;
    description: string;
    employeeRole?: string;
    jobLevel?: string;
    location?: string;
    qualifications: string[];
    responsibilities: string[];
    salaryRange?: string;
    title: string;
}


// This parser is designed to work with the JSON object of a single job
// from the hiring.cafe internal API response.
export class HiringCafeApiParser {
    parse(data: unknown): ParsedJobDetails {
        const validationResult = HiringCafeJobSchema.safeParse(data);
        if (!validationResult.success) {
            throw new Error(`HiringCafeApiParser validation failed: ${validationResult.error.message}`);
        }

        const typedData: HiringCafeJob = validationResult.data;

        const jobInfo = typedData.job_information;
        const processedData = typedData.v5_processed_job_data;

        // Construct the salary range string
        let salaryRange;
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
            company: processedData.company_name,
            description: DOMPurify.sanitize(jobInfo.description), // This is already in HTML format
            employeeRole: processedData.commitment ? processedData.commitment[0] : undefined,
            jobLevel: processedData.seniority_level,
            location: processedData.formatted_workplace_location,
            qualifications: qualifications,
            responsibilities: responsibilities,
            salaryRange: salaryRange,
            title: jobInfo.title,
        };

        return details;
    }
}