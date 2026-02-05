import { JobInfo } from '../inject/app/services/jobExtractor'
import { v4 as uuidv4 } from 'uuid'

export interface ApplicationRecord extends JobInfo {
    id: string
    appliedAt: string
    status: 'applied' | 'interviewing' | 'rejected' | 'offer'
}

export const TrackerService = {
    async saveApplication(jobInfo: JobInfo): Promise<ApplicationRecord> {
        const record: ApplicationRecord = {
            ...jobInfo,
            id: uuidv4(),
            appliedAt: new Date().toISOString(),
            status: 'applied',
        }

        const apps = await this.getApplications()
        apps.push(record)

        await chrome.storage.local.set({ applications: apps })
        return record
    },

    async getApplications(): Promise<ApplicationRecord[]> {
        const result = await chrome.storage.local.get(['applications'])
        return result.applications || []
    },

    async updateStatus(id: string, status: ApplicationRecord['status']): Promise<void> {
        const apps = await this.getApplications()
        const index = apps.findIndex(a => a.id === id)
        if (index !== -1) {
            apps[index].status = status
            await chrome.storage.local.set({ applications: apps })
        }
    },

    async deleteApplication(id: string): Promise<void> {
        const apps = await this.getApplications()
        const filtered = apps.filter(a => a.id !== id)
        await chrome.storage.local.set({ applications: filtered })
    }
}
