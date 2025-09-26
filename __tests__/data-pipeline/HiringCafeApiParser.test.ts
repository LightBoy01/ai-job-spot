import { HiringCafeApiParser } from '../../src/data-pipeline/parsers/hiring_cafe_api_parser';
import { ParsedJobDetails } from '../../src/data-pipeline/parsers/base_parser';

describe('HiringCafeApiParser', () => {
  it('should correctly parse a job object from the Hiring.Cafe API', () => {
    const parser = new HiringCafeApiParser();
    const mockJob = {
      job_information: {
        title: 'Senior AI Engineer',
        description: '<p>Full job description here.</p>',
      },
      v5_processed_job_data: {
        company_name: 'Test Corp',
        formatted_workplace_location: 'Remote, USA',
        is_compensation_transparent: true,
        yearly_min_compensation: 150000,
        yearly_max_compensation: 200000,
        seniority_level: 'Senior',
        commitment: ['Full Time', 'Contract'],
        role_activities: ['Build models', 'Deploy to production'],
        technical_tools: ['Python', 'PyTorch', 'AWS'],
        requirements_summary: '5+ years of experience required.',
      },
    };

    const expectedDetails: ParsedJobDetails = {
      title: 'Senior AI Engineer',
      company: 'Test Corp',
      location: 'Remote, USA',
      description: '<p>Full job description here.</p>',
      jobLevel: 'Senior',
      employeeRole: 'Full Time',
      salaryRange: '$150,000 - $200,000',
      responsibilities: ['Build models', 'Deploy to production'],
      qualifications: ['5+ years of experience required.', 'Python', 'PyTorch', 'AWS'],
    };

    const parsedDetails = parser.parse(mockJob);

    expect(parsedDetails).toEqual(expectedDetails);
  });

  it('should handle missing optional fields gracefully', () => {
    const parser = new HiringCafeApiParser();
    const mockJob = {
      job_information: {
        title: 'Junior Developer',
        description: ''
      },
      v5_processed_job_data: {
        company_name: 'Startup Inc.',
        formatted_workplace_location: 'New York, NY',
        is_compensation_transparent: false,
        role_activities: [],
        technical_tools: [],
      },
    };

    const parsedDetails = parser.parse(mockJob);

    expect(parsedDetails.title).toBe('Junior Developer');
    expect(parsedDetails.company).toBe('Startup Inc.');
    expect(parsedDetails.salaryRange).toBeUndefined();
    expect(parsedDetails.jobLevel).toBeUndefined();
    expect(parsedDetails.responsibilities).toEqual([]);
    expect(parsedDetails.qualifications).toEqual([]);
  });
});
