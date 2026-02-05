import { getElements } from '@src/shared/utils/getElements'

export interface JobInfo {
    position: string
    company: string
    location: string
    salary: string
    jobType: string
}

export const JobExtractor = {
    /**
     * Main extraction function - extracts all job information from current page
     */
    async extractJobInfo(): Promise<JobInfo> {
        const jobInfo: JobInfo = {
            position: await this.extractJobTitle(),
            company: await this.extractCompanyName(),
            location: await this.extractLocation(),
            salary: await this.extractSalary(),
            jobType: await this.extractJobType(),
        }
        return jobInfo
    },

    /**
     * Extract job title from page
     */
    async extractJobTitle(): Promise<string> {
        const selectors = [
            '//h1',
            '//h2',
            '//*[@class[contains(., "job-title")]]',
            '//*[@class[contains(., "jobTitle")]]',
            '//*[@data-testid[contains(., "job-title")]]',
            '//*[@class[contains(., "position")]]',
            '//*[@class[contains(., "JobTitle")]]',
            '//*[@id[contains(., "job-title")]]',
        ]

        for (const selector of selectors) {
            const elements = getElements(document, selector)
            if (elements.length > 0) {
                const text = elements[0].innerText?.trim()
                if (text && text.length > 3) {
                    return text
                }
            }
        }

        // Fallback: extract from page title
        const pageTitle = document.title
        const titleMatch = pageTitle.match(/^([^-|]+?)(?:\s*[-|@]\s*|$)/)
        if (titleMatch && titleMatch[1] && titleMatch[1].trim().length > 3) {
            return titleMatch[1].trim()
        }

        return ''
    },

    /**
     * Extract company name from page
     */
    async extractCompanyName(): Promise<string> {
        // Strategy: URL patterns (simplest first)
        const url = window.location.href
        if (url.includes('greenhouse.io')) {
            const match = url.match(/greenhouse\.io\/([^\/\?]+)/)
            if (match) return this.formatCompanyName(match[1])
        }
        if (url.includes('jobs.lever.co')) {
            const match = url.match(/lever\.co\/([^\/\?]+)/)
            if (match) return this.formatCompanyName(match[1])
        }
        if (url.includes('ashbyhq.com')) {
            const match = url.match(/ashbyhq\.com\/([^\/\?]+)/)
            if (match) return this.formatCompanyName(match[1])
        }

        // Generic selectors (XPath)
        const selectors = [
            '//*[contains(@class, "company-name")]',
            '//*[contains(@class, "companyName")]',
            '//*[contains(@class, "employer")]',
            '//*[@data-testid[contains(., "company")]]',
            '//*[contains(@class, "organization")]',
        ]

        for (const selector of selectors) {
            const elements = getElements(document, selector)
            if (elements.length > 0) {
                const text = elements[0].innerText?.trim()
                if (text && text.length > 2 && text.length < 100) {
                    return text
                }
            }
        }

        return ''
    },

    formatCompanyName(name: string): string {
        return name
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
    },

    /**
     * Extract location information
     */
    async extractLocation(): Promise<string> {
        const selectors = [
            '//*[contains(@class, "location")]',
            '//*[contains(@class, "jobLocation")]',
            '//*[@data-testid[contains(., "location")]]',
            '//*[contains(@class, "city")]',
            '//*[contains(@class, "work-location")]',
        ]

        for (const selector of selectors) {
            const elements = getElements(document, selector)
            if (elements.length > 0) {
                const text = elements[0].innerText?.trim()
                if (text && text.length > 2 && text.length < 100) {
                    return text
                }
            }
        }
        return ''
    },

    /**
     * Extract salary information
     */
    async extractSalary(): Promise<string> {
        const selectors = [
            '//*[contains(@class, "salary")]',
            '//*[contains(@class, "compensation")]',
            '//*[contains(@class, "pay")]',
            '//*[@data-testid[contains(., "salary")]]',
        ]

        for (const selector of selectors) {
            const elements = getElements(document, selector)
            if (elements.length > 0) {
                const text = elements[0].innerText?.trim()
                if (this.isSalaryPattern(text)) {
                    return text
                }
            }
        }
        return ''
    },

    isSalaryPattern(text: string): boolean {
        return !!(text.match(/\$[\d,]+k?/i) || text.match(/\d+[kK]\s*-\s*\d+[kK]/))
    },

    /**
     * Extract job type
     */
    async extractJobType(): Promise<string> {
        const jobTypePatterns = [
            'full-time',
            'part-time',
            'contract',
            'temporary',
            'internship',
            'remote',
            'hybrid',
        ]

        const pageText = document.body.innerText.toLowerCase()

        for (const pattern of jobTypePatterns) {
            if (pageText.includes(pattern)) {
                return pattern
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join('-')
            }
        }
        return ''
    },
}
