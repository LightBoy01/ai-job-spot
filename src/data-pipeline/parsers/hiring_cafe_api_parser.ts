import { IParser, ParsedJobDetails } from './base_parser.js';

// This parser is designed to work with the JSON object of a single job
// from the hiring.cafe internal API response.
export class HiringCafeApiParser implements IParser {
  parse(data: unknown): ParsedJobDetails {
    if (typeof data !== 'object' || data === null) {
      throw new Error('HiringCafeApiParser expects a JSON object.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedData = data as any; // Assert data to any for property access

    const jobInfo = typedData.job_information || {};
    const processedData = typedData.v5_processed_job_data || {};

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
      description: jobInfo.description, // This is already in HTML format
      jobLevel: processedData.seniority_level,
      employeeRole: processedData.commitment ? processedData.commitment[0] : undefined,
      salaryRange: salaryRange,
      responsibilities: responsibilities,
      qualifications: qualifications,
    };

    return details;
  }
}
