import { getInitializedDb } from '../../lib/firebaseAdmin.js';
import { JobPosting } from '../../lib/types.js';

const CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

const API = {
    BASE_URL: 'https://hiring.cafe/api/search-jobs',
    HEADERS: {
        'Content-Type': 'application/json',
    },
} as const;

interface JobInformation {
    readonly title: string;
    readonly description: string;
}

interface ProcessedJobData {
    readonly company_name: string;
    readonly is_compensation_transparent: boolean;
    readonly yearly_min_compensation?: number;
    readonly yearly_max_compensation?: number;
    readonly workplace_type?: string;
    readonly requirements_summary?: string;
    readonly job_category: string;
    readonly role_activities: readonly string[];
    readonly formatted_workplace_location?: string;
    readonly estimated_publish_date_millis: string;
}

interface JobResult {
    readonly id: string;
    readonly apply_url: string;
    readonly job_information: JobInformation;
    readonly v5_processed_job_data: ProcessedJobData;
}

interface ApiResponse {
    readonly results: readonly JobResult[];
    readonly total: number;
}

interface SearchParams {
    readonly keywords: string;
    readonly page?: number;
    readonly size?: number;
    readonly sortBy?: 'date' | 'default' | 'compensation_desc' | 'experience_asc';
}

const validateSearchParams = ({ keywords, page = 0, size = CONFIG.DEFAULT_PAGE_SIZE }: SearchParams): SearchParams => ({
    keywords: keywords.trim(),
    page: Math.max(0, Math.floor(Number(page))),
    size: Math.min(Math.max(1, Math.floor(Number(size))), CONFIG.MAX_PAGE_SIZE),
});

const fetchJobsFromApi = async (searchParams: SearchParams): Promise<ApiResponse> => {
    const payload = {
        size: searchParams.size || 20,
        page: searchParams.page || 0,
        searchState: {
            searchQuery: searchParams.keywords,
            sortBy: searchParams.sortBy || 'date',
        },
    };

    const response = await fetch(API.BASE_URL, {
        method: 'POST',
        headers: API.HEADERS,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch jobs from HiringCafe: ${response.statusText}`);
    }

    return response.json();
};

const renderJobDescription = (jobInfo: JobInformation, processedData: ProcessedJobData): string => {
    // For now, just return the description. We don't have the 'art' utility in the pipeline.
    return jobInfo.description ?? '';
};

const transformJobItem = (item: JobResult): JobPosting => {
    const { job_information: jobInfo, v5_processed_job_data: processedData, apply_url, id } = item;

    return {
        id: id,
        title: `${jobInfo.title} - ${processedData.company_name}`,
        company: processedData.company_name,
        description: renderJobDescription(jobInfo, processedData),
        location: processedData.formatted_workplace_location ?? 'Remote/Unspecified',
        postedDate: new Date(processedData.estimated_publish_date_millis),
        applicationLink: apply_url,
        tags: [processedData.job_category, ...processedData.role_activities, processedData.workplace_type].filter((x): x is string => !!x),
        // Add other fields as needed, mapping from processedData
        salaryRange: (processedData.yearly_min_compensation && processedData.yearly_max_compensation) ? 
                     `$${processedData.yearly_min_compensation.toLocaleString()} - $${processedData.yearly_max_compensation.toLocaleString()}` : null,
        status: 'published', // Default status
        source: 'Hiring.cafe API',
        sourceUrl: apply_url,
    };
};

export async function fetchHiringCafeApiJobs(keywords: string = 'AI') {
    const searchParams = validateSearchParams({ keywords });
    const response = await fetchJobsFromApi(searchParams);
    return response.results.map((item) => transformJobItem(item));
}
