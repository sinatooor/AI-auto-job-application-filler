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
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'First Name', getValue: d => d.personalInfo?.firstName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'first name', getValue: d => d.personalInfo?.firstName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'firstName', getValue: d => d.personalInfo?.firstName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Last Name', getValue: d => d.personalInfo?.lastName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'last name', getValue: d => d.personalInfo?.lastName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'lastName', getValue: d => d.personalInfo?.lastName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Full Name', getValue: d => d.personalInfo?.fullName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'full name', getValue: d => d.personalInfo?.fullName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Name', getValue: d => d.personalInfo?.fullName },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'name', getValue: d => d.personalInfo?.fullName },
  
  // Contact fields
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Email', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'email', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Email Address', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'email address', getValue: d => d.personalInfo?.email },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Phone', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'phone', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Phone Number', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'phone number', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Mobile', getValue: d => d.personalInfo?.phone },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'mobile', getValue: d => d.personalInfo?.phone },
  
  // Location fields
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Address', getValue: d => d.personalInfo?.address },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'address', getValue: d => d.personalInfo?.address },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Street Address', getValue: d => d.personalInfo?.address },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'City', getValue: d => d.personalInfo?.city },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'city', getValue: d => d.personalInfo?.city },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'State', getValue: d => d.personalInfo?.state },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'state', getValue: d => d.personalInfo?.state },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Province', getValue: d => d.personalInfo?.state },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Zip Code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'zip code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Postal Code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'postal code', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'zipCode', getValue: d => d.personalInfo?.zipCode },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Country', getValue: d => d.personalInfo?.country },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'country', getValue: d => d.personalInfo?.country },
  
  // Social/Professional links
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'LinkedIn', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'linkedin', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'LinkedIn URL', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'LinkedIn Profile', getValue: d => d.personalInfo?.linkedIn },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'GitHub', getValue: d => d.personalInfo?.github },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'github', getValue: d => d.personalInfo?.github },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'GitHub URL', getValue: d => d.personalInfo?.github },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Website', getValue: d => d.personalInfo?.website },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'website', getValue: d => d.personalInfo?.website },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Portfolio', getValue: d => d.personalInfo?.website },
  { section: 'Personal Information', fieldType: 'TextInput', fieldName: 'Personal Website', getValue: d => d.personalInfo?.website },
]

// Summary/About mappings
const summaryMappings: FieldMapping[] = [
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'Summary', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'summary', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'About', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'about', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'Professional Summary', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'About Me', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'Bio', getValue: d => d.summary },
  { section: 'Personal Information', fieldType: 'Textarea', fieldName: 'Overview', getValue: d => d.summary },
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
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Company`, answer: exp.company })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Company Name`, answer: exp.company })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Employer`, answer: exp.company })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Company', answer: exp.company })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Company Name', answer: exp.company })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Current Company', answer: exp.company })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Most Recent Company', answer: exp.company })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Employer', answer: exp.company })
      }
    }
    
    if (exp.title) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Job Title`, answer: exp.title })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Title`, answer: exp.title })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Position`, answer: exp.title })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Role`, answer: exp.title })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Job Title', answer: exp.title })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Title', answer: exp.title })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Position', answer: exp.title })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Current Title', answer: exp.title })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Current Position', answer: exp.title })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Role', answer: exp.title })
      }
    }
    
    if (exp.location) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Location`, answer: exp.location })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Location', answer: exp.location })
      }
    }
    
    if (exp.startDate) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Start Date`, answer: exp.startDate })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Start Date', answer: exp.startDate })
      }
    }
    
    if (exp.endDate) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}End Date`, answer: exp.endDate })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'End Date', answer: exp.endDate })
      }
    }
    
    if (exp.description) {
      answers.push({ section, fieldType: 'Textarea', fieldName: `${prefix}Description`, answer: exp.description })
      answers.push({ section, fieldType: 'Textarea', fieldName: `${prefix}Responsibilities`, answer: exp.description })
      if (index === 0) {
        answers.push({ section, fieldType: 'Textarea', fieldName: 'Description', answer: exp.description })
        answers.push({ section, fieldType: 'Textarea', fieldName: 'Job Description', answer: exp.description })
        answers.push({ section, fieldType: 'Textarea', fieldName: 'Responsibilities', answer: exp.description })
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
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}School`, answer: edu.institution })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}University`, answer: edu.institution })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Institution`, answer: edu.institution })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}College`, answer: edu.institution })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'School', answer: edu.institution })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'University', answer: edu.institution })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Institution', answer: edu.institution })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'College', answer: edu.institution })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'School Name', answer: edu.institution })
      }
    }
    
    if (edu.degree) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Degree`, answer: edu.degree })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Degree Type`, answer: edu.degree })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Degree', answer: edu.degree })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Degree Type', answer: edu.degree })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Highest Degree', answer: edu.degree })
      }
    }
    
    if (edu.field) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Field of Study`, answer: edu.field })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Major`, answer: edu.field })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Discipline`, answer: edu.field })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Field of Study', answer: edu.field })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Major', answer: edu.field })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Discipline', answer: edu.field })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Area of Study', answer: edu.field })
      }
    }
    
    if (edu.startDate) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Start Date`, answer: edu.startDate })
    }
    
    if (edu.endDate) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}End Date`, answer: edu.endDate })
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}Graduation Date`, answer: edu.endDate })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Graduation Date', answer: edu.endDate })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Graduation Year', answer: edu.endDate })
      }
    }
    
    if (edu.gpa) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `${prefix}GPA`, answer: edu.gpa })
      if (index === 0) {
        answers.push({ section, fieldType: 'TextInput', fieldName: 'GPA', answer: edu.gpa })
        answers.push({ section, fieldType: 'TextInput', fieldName: 'Grade Point Average', answer: edu.gpa })
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
  
  answers.push({ section, fieldType: 'Textarea', fieldName: 'Skills', answer: skillsText })
  answers.push({ section, fieldType: 'Textarea', fieldName: 'skills', answer: skillsText })
  answers.push({ section, fieldType: 'Textarea', fieldName: 'Technical Skills', answer: skillsText })
  answers.push({ section, fieldType: 'Textarea', fieldName: 'Key Skills', answer: skillsText })
  answers.push({ section, fieldType: 'TextInput', fieldName: 'Skills', answer: skillsText })
  
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
  
  answers.push({ section, fieldType: 'Textarea', fieldName: 'Languages', answer: languagesText })
  answers.push({ section, fieldType: 'TextInput', fieldName: 'Languages', answer: languagesText })
  answers.push({ section, fieldType: 'TextInput', fieldName: 'Languages Spoken', answer: languagesText })
  
  // Individual language entries
  data.languages.forEach((lang, index) => {
    if (lang.language) {
      answers.push({ section, fieldType: 'TextInput', fieldName: `Language ${index + 1}`, answer: lang.language })
      if (lang.proficiency) {
        answers.push({ section, fieldType: 'TextInput', fieldName: `Language ${index + 1} Proficiency`, answer: lang.proficiency })
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
  
  answers.push({ section, fieldType: 'Textarea', fieldName: 'Certifications', answer: certsText })
  answers.push({ section, fieldType: 'TextInput', fieldName: 'Certifications', answer: certsText })
  answers.push({ section, fieldType: 'TextInput', fieldName: 'Licenses and Certifications', answer: certsText })
  
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
