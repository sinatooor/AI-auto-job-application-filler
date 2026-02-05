import { ExtractedCVData } from './LLMTypes'
import { NewAnswer } from './DataStoreTypes'

/**
 * Common form field name mappings from CV data
 * These map to the most common field names used in job application forms
 */
interface FieldMapping {
  section: string
  fieldType: string
  fieldName: string
  getValue: (data: ExtractedCVData) => any
}

// Personal information field mappings
const personalInfoMappings: FieldMapping[] = [
  // Name fields
  { section: 'Personal Information', fieldType: 'text', fieldName: 'First Name', getValue: d => d.personalInfo?.firstName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'first name', getValue: d => d.personalInfo?.firstName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'firstName', getValue: d => d.personalInfo?.firstName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Last Name', getValue: d => d.personalInfo?.lastName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'last name', getValue: d => d.personalInfo?.lastName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'lastName', getValue: d => d.personalInfo?.lastName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Full Name', getValue: d => d.personalInfo?.fullName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'full name', getValue: d => d.personalInfo?.fullName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Name', getValue: d => d.personalInfo?.fullName },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'name', getValue: d => d.personalInfo?.fullName },
  
  // Contact fields
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Email', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'email', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Email Address', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'email address', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Phone', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'phone', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Phone Number', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'phone number', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Mobile', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'mobile', getValue: d => d.personalInfo?.phone },
  
  // Location fields
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Address', getValue: d => d.personalInfo?.address },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'address', getValue: d => d.personalInfo?.address },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Street Address', getValue: d => d.personalInfo?.address },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'City', getValue: d => d.personalInfo?.city },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'city', getValue: d => d.personalInfo?.city },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'State', getValue: d => d.personalInfo?.state },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'state', getValue: d => d.personalInfo?.state },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Province', getValue: d => d.personalInfo?.state },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Zip Code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'zip code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Postal Code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'postal code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'zipCode', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Country', getValue: d => d.personalInfo?.country },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'country', getValue: d => d.personalInfo?.country },
  
  // Social/Professional links
  { section: 'Personal Information', fieldType: 'text', fieldName: 'LinkedIn', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'linkedin', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'LinkedIn URL', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'LinkedIn Profile', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'GitHub', getValue: d => d.personalInfo?.github },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'github', getValue: d => d.personalInfo?.github },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'GitHub URL', getValue: d => d.personalInfo?.github },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Website', getValue: d => d.personalInfo?.website },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'website', getValue: d => d.personalInfo?.website },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Portfolio', getValue: d => d.personalInfo?.website },
  { section: 'Personal Information', fieldType: 'text', fieldName: 'Personal Website', getValue: d => d.personalInfo?.website },
]

// Summary/About mappings
const summaryMappings: FieldMapping[] = [
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'Summary', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'summary', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'About', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'about', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'Professional Summary', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'About Me', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'Bio', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'textarea', fieldName: 'Overview', getValue: d => d.summary },
]

/**
 * Generate work experience entries as answers
 */
function generateExperienceAnswers(data: ExtractedCVData): NewAnswer[] {
  const answers: NewAnswer[] = []
  
  if (!data.experience || data.experience.length === 0) {
    return answers
  }

  // Add each experience entry with indexed field names
  data.experience.forEach((exp, index) => {
    const prefix = data.experience.length === 1 ? '' : `${index + 1} - `
    const section = 'Work Experience'
    
    if (exp.company) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Company`, answer: exp.company })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Company Name`, answer: exp.company })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Employer`, answer: exp.company })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Company', answer: exp.company })
        answers.push({ section, fieldType: 'text', fieldName: 'Company Name', answer: exp.company })
        answers.push({ section, fieldType: 'text', fieldName: 'Current Company', answer: exp.company })
        answers.push({ section, fieldType: 'text', fieldName: 'Most Recent Company', answer: exp.company })
        answers.push({ section, fieldType: 'text', fieldName: 'Employer', answer: exp.company })
      }
    }
    
    if (exp.title) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Job Title`, answer: exp.title })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Title`, answer: exp.title })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Position`, answer: exp.title })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Role`, answer: exp.title })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Job Title', answer: exp.title })
        answers.push({ section, fieldType: 'text', fieldName: 'Title', answer: exp.title })
        answers.push({ section, fieldType: 'text', fieldName: 'Position', answer: exp.title })
        answers.push({ section, fieldType: 'text', fieldName: 'Current Title', answer: exp.title })
        answers.push({ section, fieldType: 'text', fieldName: 'Current Position', answer: exp.title })
        answers.push({ section, fieldType: 'text', fieldName: 'Role', answer: exp.title })
      }
    }
    
    if (exp.location) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Location`, answer: exp.location })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Location', answer: exp.location })
      }
    }
    
    if (exp.startDate) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Start Date`, answer: exp.startDate })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Start Date', answer: exp.startDate })
      }
    }
    
    if (exp.endDate) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}End Date`, answer: exp.endDate })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'End Date', answer: exp.endDate })
      }
    }
    
    if (exp.description) {
      answers.push({ section, fieldType: 'textarea', fieldName: `${prefix}Description`, answer: exp.description })
      answers.push({ section, fieldType: 'textarea', fieldName: `${prefix}Responsibilities`, answer: exp.description })
      if (index === 0) {
        answers.push({ section, fieldType: 'textarea', fieldName: 'Description', answer: exp.description })
        answers.push({ section, fieldType: 'textarea', fieldName: 'Job Description', answer: exp.description })
        answers.push({ section, fieldType: 'textarea', fieldName: 'Responsibilities', answer: exp.description })
      }
    }
  })
  
  return answers
}

/**
 * Generate education entries as answers
 */
function generateEducationAnswers(data: ExtractedCVData): NewAnswer[] {
  const answers: NewAnswer[] = []
  
  if (!data.education || data.education.length === 0) {
    return answers
  }

  data.education.forEach((edu, index) => {
    const prefix = data.education.length === 1 ? '' : `${index + 1} - `
    const section = 'Education'
    
    if (edu.institution) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}School`, answer: edu.institution })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}University`, answer: edu.institution })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Institution`, answer: edu.institution })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}College`, answer: edu.institution })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'School', answer: edu.institution })
        answers.push({ section, fieldType: 'text', fieldName: 'University', answer: edu.institution })
        answers.push({ section, fieldType: 'text', fieldName: 'Institution', answer: edu.institution })
        answers.push({ section, fieldType: 'text', fieldName: 'College', answer: edu.institution })
        answers.push({ section, fieldType: 'text', fieldName: 'School Name', answer: edu.institution })
      }
    }
    
    if (edu.degree) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Degree`, answer: edu.degree })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Degree Type`, answer: edu.degree })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Degree', answer: edu.degree })
        answers.push({ section, fieldType: 'text', fieldName: 'Degree Type', answer: edu.degree })
        answers.push({ section, fieldType: 'text', fieldName: 'Highest Degree', answer: edu.degree })
      }
    }
    
    if (edu.field) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Field of Study`, answer: edu.field })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Major`, answer: edu.field })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Discipline`, answer: edu.field })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Field of Study', answer: edu.field })
        answers.push({ section, fieldType: 'text', fieldName: 'Major', answer: edu.field })
        answers.push({ section, fieldType: 'text', fieldName: 'Discipline', answer: edu.field })
        answers.push({ section, fieldType: 'text', fieldName: 'Area of Study', answer: edu.field })
      }
    }
    
    if (edu.startDate) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Start Date`, answer: edu.startDate })
    }
    
    if (edu.endDate) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}End Date`, answer: edu.endDate })
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}Graduation Date`, answer: edu.endDate })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'Graduation Date', answer: edu.endDate })
        answers.push({ section, fieldType: 'text', fieldName: 'Graduation Year', answer: edu.endDate })
      }
    }
    
    if (edu.gpa) {
      answers.push({ section, fieldType: 'text', fieldName: `${prefix}GPA`, answer: edu.gpa })
      if (index === 0) {
        answers.push({ section, fieldType: 'text', fieldName: 'GPA', answer: edu.gpa })
        answers.push({ section, fieldType: 'text', fieldName: 'Grade Point Average', answer: edu.gpa })
      }
    }
  })
  
  return answers
}

/**
 * Generate skills answers
 */
function generateSkillsAnswers(data: ExtractedCVData): NewAnswer[] {
  const answers: NewAnswer[] = []
  
  if (!data.skills || data.skills.length === 0) {
    return answers
  }

  const skillsText = data.skills.join(', ')
  const section = 'Skills'
  
  answers.push({ section, fieldType: 'textarea', fieldName: 'Skills', answer: skillsText })
  answers.push({ section, fieldType: 'textarea', fieldName: 'skills', answer: skillsText })
  answers.push({ section, fieldType: 'textarea', fieldName: 'Technical Skills', answer: skillsText })
  answers.push({ section, fieldType: 'textarea', fieldName: 'Key Skills', answer: skillsText })
  answers.push({ section, fieldType: 'text', fieldName: 'Skills', answer: skillsText })
  
  return answers
}

/**
 * Generate language answers
 */
function generateLanguageAnswers(data: ExtractedCVData): NewAnswer[] {
  const answers: NewAnswer[] = []
  
  if (!data.languages || data.languages.length === 0) {
    return answers
  }

  const section = 'Languages'
  const languagesText = data.languages.map(l => 
    l.proficiency ? `${l.language} (${l.proficiency})` : l.language
  ).join(', ')
  
  answers.push({ section, fieldType: 'textarea', fieldName: 'Languages', answer: languagesText })
  answers.push({ section, fieldType: 'text', fieldName: 'Languages', answer: languagesText })
  answers.push({ section, fieldType: 'text', fieldName: 'Languages Spoken', answer: languagesText })
  
  // Individual language entries
  data.languages.forEach((lang, index) => {
    if (lang.language) {
      answers.push({ section, fieldType: 'text', fieldName: `Language ${index + 1}`, answer: lang.language })
      if (lang.proficiency) {
        answers.push({ section, fieldType: 'text', fieldName: `Language ${index + 1} Proficiency`, answer: lang.proficiency })
      }
    }
  })
  
  return answers
}

/**
 * Generate certification answers
 */
function generateCertificationAnswers(data: ExtractedCVData): NewAnswer[] {
  const answers: NewAnswer[] = []
  
  if (!data.certifications || data.certifications.length === 0) {
    return answers
  }

  const section = 'Certifications'
  const certsText = data.certifications.map(c => 
    c.issuer ? `${c.name} (${c.issuer})` : c.name
  ).join(', ')
  
  answers.push({ section, fieldType: 'textarea', fieldName: 'Certifications', answer: certsText })
  answers.push({ section, fieldType: 'text', fieldName: 'Certifications', answer: certsText })
  answers.push({ section, fieldType: 'text', fieldName: 'Licenses and Certifications', answer: certsText })
  
  return answers
}

/**
 * Convert extracted CV data to NewAnswer array for database storage
 */
export function cvDataToAnswers(data: ExtractedCVData): NewAnswer[] {
  const answers: NewAnswer[] = []
  
  // Process personal info mappings
  for (const mapping of personalInfoMappings) {
    const value = mapping.getValue(data)
    if (value) {
      answers.push({
        section: mapping.section,
        fieldType: mapping.fieldType,
        fieldName: mapping.fieldName,
        answer: value,
      })
    }
  }
  
  // Process summary mappings
  for (const mapping of summaryMappings) {
    const value = mapping.getValue(data)
    if (value) {
      answers.push({
        section: mapping.section,
        fieldType: mapping.fieldType,
        fieldName: mapping.fieldName,
        answer: value,
      })
    }
  }
  
  // Generate experience, education, skills, languages, certifications
  answers.push(...generateExperienceAnswers(data))
  answers.push(...generateEducationAnswers(data))
  answers.push(...generateSkillsAnswers(data))
  answers.push(...generateLanguageAnswers(data))
  answers.push(...generateCertificationAnswers(data))
  
  return answers
}

/**
 * Save CV data to the answers database
 * Returns the number of answers added
 */
export async function saveCVDataToDatabase(
  data: ExtractedCVData,
  answers1010Store: { add: (item: NewAnswer) => any; loaded: boolean; load: () => Promise<void> }
): Promise<{ added: number; skipped: number }> {
  const answers = cvDataToAnswers(data)
  
  // Ensure the store is loaded
  if (!answers1010Store.loaded) {
    await answers1010Store.load()
  }
  
  let added = 0
  let skipped = 0
  
  for (const answer of answers) {
    try {
      const result = answers1010Store.add(answer)
      // If the returned answer has the same id as a previous one, it was a duplicate
      if (result) {
        added++
      }
    } catch (e) {
      skipped++
    }
  }
  
  return { added, skipped }
}
