# 🚀 AI-Powered Job Application Filler

An intelligent Chrome extension that revolutionizes the job application process by automatically filling tedious application forms on platforms like Workday, Greenhouse, Lever, iCIMS, and more.

![Version](https://img.shields.io/badge/version-2.1.2-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Privacy](https://img.shields.io/badge/privacy-first-brightgreen)


---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **LLM Integration**: Connect with OpenAI GPT, Google Gemini, or Anthropic Claude
- **Smart Field Suggestions**: AI analyzes your CV and job description to suggest optimal answers
- **Auto-Save Options**: Configure whether AI answers save automatically or require manual confirmation
- **Context-Aware**: Uses your work history and job context for personalized suggestions
- **Confidence Thresholds**: Automatically trigger AI when stored answers have low confidence scores

### 📝 CV & Resume Management
- **CV Processing**: Upload and parse your CV/resume with AI
- **Data Extraction**: Automatically extract personal info, experience, education, skills
- **Multiple Formats**: Support for PDF, TXT, DOCX files
- **Smart Storage**: Your CV data is stored locally and never sent to external servers (except LLM APIs when explicitly used)

### 💼 Job Context Management
- **Multi-Job Support**: Manage context for multiple job applications simultaneously
- **Rich Details**: Store company, role, job description, and personal notes
- **Active Context**: Switch between different job contexts easily
- **Context Integration**: AI uses active job context for better suggestions

### 📊 Advanced Features
- **Cover Letter Generator**: AI-powered cover letter generation tailored to specific jobs
- **CV Analysis**: Get a match score and keyword analysis comparing your CV to job descriptions
- **ATS Optimization**: Recommendations for improving your CV's ATS compatibility
- **Database View**: Comprehensive table interface to view, edit, and manage all saved answers

### 🔒 Privacy & Security
- **100% Open Source**: Full transparency - review the code yourself
- **Local Storage**: Your data stays on your device
- **No Tracking**: Zero analytics or data collection
- **Optional AI**: Use AI features only when you want to
- **Self-Hosted Option**: Can be configured to use your own LLM endpoints

### 🎯 Form Filling
- **Multi-Platform Support**: Works on Workday, Greenhouse, Lever, iCIMS, and many more
- **Smart Matching**: Fuzzy matching algorithm finds the best saved answer for each field
- **Field Types**: Supports text, dropdowns, checkboxes, radio buttons, file uploads, dates
- **Bulk Actions**: Fill entire sections or pages with one click
- **Manual Override**: Edit any auto-filled value before submission

---

## 🚀 Quick Start

### Installation from Source

1. **Clone the repository**
```bash
git clone https://github.com/sinatooor/AI-auto-job-application-filler.git
cd AI-auto-job-application-filler
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
# For development (with hot reload)
npm start

# For production
npm run build
```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

![Load Unpacked Extension](https://github.com/berellevy/job_app_filler/blob/main/docs/load_unpacked.gif)

---

## 📖 Usage Guide

### Initial Setup

1. **Click the extension icon** in your Chrome toolbar
2. **Go to Options** (right-click icon → Options or click on the extension)
3. **Configure AI Settings (Optional)**
   - Choose your LLM provider (OpenAI, Gemini, or Anthropic)
   - Enter your API key
   - Set auto-fill preferences and confidence thresholds
   - Toggle auto-save for AI answers

### Setting Up Your Profile

#### Upload Your CV
1. Navigate to the **"CV / Resume"** tab in options
2. Upload your CV or paste the text
3. Click **"Process CV with AI"** to extract information
4. Review the extracted data

#### Add Job Context
1. Go to the **"Job Context"** tab
2. Click **"Add Job"** to create a new job entry
3. Fill in company name, role, and job description
4. This context helps AI provide better suggestions

### Using the Extension on Job Sites

1. **Navigate to a job application website** (e.g., Workday, Greenhouse)
2. **Widget appears** next to form fields that can be auto-filled
3. **Fill Options:**
   - 🎯 **Fill Button**: Auto-fill with your saved answer (uses AI if confidence is low)
   - ✨ **AI Button**: Get AI suggestion based on your CV and job context
   - 💾 **Save Button**: Save the current field value for future use
   - ℹ️ **More Info**: View all saved answers, edit, or manage

### Database Management

1. Go to the **"Database"** tab in options
2. **View all saved answers** in a table format
3. **Edit entries** inline by clicking the edit icon
4. **Delete entries** you no longer need
5. **Add new entries** manually if needed

### Advanced Features

#### Cover Letter Generator
1. Process your CV and add job context first
2. Go to **"Cover Letter"** tab
3. Choose tone (Professional/Friendly/Formal) and length
4. Add custom instructions if needed
5. Click **"Generate Cover Letter"**
6. Copy or download the result

#### CV Analysis
1. Ensure CV and job context are added
2. Go to **"CV Analysis"** tab
3. Click **"Analyze CV"**
4. Review your match score, keyword analysis, and recommendations

---

## 🏗️ Technical Architecture

### Project Structure

```
job_app_filler/
├── src/
│   ├── background/          # Background service worker
│   │   └── services/
│   │       └── llmClient.ts # LLM API integration
│   ├── contentScript/       # Content script (sandboxed)
│   │   ├── utils/storage/  # Data storage and management
│   │   │   ├── Answers1010.ts
│   │   │   ├── DataStore.ts
│   │   │   ├── LLMTypes.ts
│   │   │   └── LLMSettingsStore.ts
│   │   └── contentScript.ts
│   ├── inject/             # Injected script (page context)
│   │   ├── app/
│   │   │   ├── App.tsx     # Main widget app
│   │   │   ├── AppContext.tsx
│   │   │   ├── FieldWidget/
│   │   │   ├── MoreInfoPopup/
│   │   │   └── components/
│   │   └── services/
│   │       └── formFields/ # Form field handlers
│   ├── options/            # Options page
│   │   └── app/
│   │       └── App.tsx     # Settings UI with Database view
│   ├── popup/              # Extension popup
│   └── shared/             # Shared utilities
├── static/
│   └── manifest.json       # Extension manifest
└── dist/                   # Built extension (generated)
```

### Key Components

#### Sandboxed Architecture
The extension uses a dual-script architecture to overcome Chrome's security restrictions:

- **Content Script**: Has access to Chrome APIs and storage but limited DOM access
- **Injected Script**: Full DOM access and can interact with React-controlled forms
- **Communication**: Custom client-server pattern using DOM events

#### Data Storage
- **Local Storage**: Chrome's `chrome.storage.local` API
- **Search Index**: Elasticlunr for fuzzy text search
- **Exact Match Index**: Custom indexing for fast lookups

#### LLM Integration
- **Background Service**: Isolated API calls in background worker
- **Multiple Providers**: Unified interface for OpenAI, Gemini, and Claude
- **Streaming**: Not currently implemented but architecture supports it

---

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Chrome browser

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm start

# Build for production
npm run build

# Create a release
npm run release
```

### Tech Stack

- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Build Tool**: Webpack 5
- **Storage**: Chrome Storage API
- **Search**: Elasticlunr
- **Icons**: Material Icons
- **State**: React Context API

### Testing
Load the extension from the `dist` folder after building. The extension includes comprehensive logging accessible through Chrome DevTools.

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Areas for Contribution
- Add support for more job sites
- Improve AI prompts and suggestions
- Enhance UI/UX
- Add tests
- Improve documentation
- Fix bugs

---

## 🐛 Known Issues & Limitations

- Some dynamically loaded forms may require page refresh
- AI features require valid API keys from providers (user-provided)
- File upload simulation may not work on all sites
- Some sites with heavy anti-bot measures may not be fully supported

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Original project by [Berel Levy](https://github.com/berellevy)
- Enhanced with AI features by the community
- Built with ❤️ for job seekers everywhere

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sinatooor/AI-auto-job-application-filler/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sinatooor/AI-auto-job-application-filler/discussions)

---

## 🎯 Roadmap

- [ ] Streaming LLM responses
- [ ] Custom field mapping templates
- [ ] Import/export saved answers
- [ ] Multi-browser support (Firefox, Edge)
- [ ] Mobile companion app
- [ ] LinkedIn profile import
- [ ] Application tracking dashboard
- [ ] Browser automation for complete applications

---

**⭐ If this project helps you land your dream job, consider giving it a star!**
the injected script. The client recieves a 'response' to each 'request', mimicking classic web requests.

### Main Logic

The main logic lives mostly in the injected script and is broken into two main parts;
The `FormField` class and a `React` app which are attached to each fillable input.

#### FormField

The `FormField` class contains all the logic to discover inputs on a page and fill them.
This structure is ported from a python/selenium project [site_applier](https://github.com/berellevy/site_applier).
This includes form field discovery, answer lookup, answer filling and saving current values as an answer.

For a complete description of every field [see here](https://docs.google.com/spreadsheets/d/1DwpJbDmqmOngjBXQNKXoQaExnx4sHvrND0GoHctqoiQ/edit?usp=drive_link).

#### Form Field Discovery

The `BaseFormInput` has a static method called `autoDiscover` which references a static property called `XPATH`. Each subclass needs to override `XPATH` and then call `autoDiscover` to automatically register any fields that match that `XPATH`.
Since fields are grouped by site, the formFields directory will have a separate subdirectory for each website, which will have an index.js with an autoDiscover 
method that collects all the fields.

When is autoDiscover called? Upon loading the extension, a MutationObserver starts watching for any time elements are added or removed from the dom. Every time, we scan the dom for new fields and register them.
This way, we can register fields that are added to the dom in response to a user action.

See [video](https://youtu.be/mXEDv9PpdGs)

#### Answer Lookup

Answers are correlated with fields by a path containing, in this order, page, section, field type and field name.
Answers are then stored in the extension's localstorage in an object nested in that structure.

Path: see [video](https://youtu.be/mXEDv9PpdGs)

#### Answer Filling

Each field usually requuires it's own field filling logic. Workday, for example, 
is a React site with controlled form fields. To fill a field, you have to find the 
correct method which updates the fields state. For example, for text fields it's onChange, but for text fields that have frontend validation, it's onBlur.

#### Saving Current Values as an answer.

When you want to save or update an answer, the simple way is to take the current value and save it. this works well for text fields, because the current answer can be the exact same format as stored answer. For single dropdowns, however, you need to store more that one answer, in case the current dropdown doesn't have your stored 
answer. Then you need a different method which has not yet been implemented.

#### React App

A small `React` app is attached to each fillable filed on the job app site to provide a ui.
This app recieves it's instance of the `FormField` class as a prop.

#### Design

Utilising Material UI. This project is very open to design suggestions on every topic, including the logo.

### Shared Resources

The context script has access to extension APIs that the injected script doesn't, so if the injected
script imports something from the content script directly it can break. Shared resources need to be
broken out into a separate file which can be imported by both the content script and the injected script.

## Versioning

major.site.field.fix

- major: Initial release, and nothing else for now.
- site: Increment each time a site is completed
- field: Increment each time fields are added.
- fix: Fixes
  Version 1.0.2

## Contributing

Contributors are welcome!


## Roadmap

This is a rough outlook of what's to come. For more specifics, see issues.

### Milestones
* Complete functionality for workday job applications.
* Add startswith matching for answers
* add UI for advanced answer saving
* Complete functionality for icims job applications.
* Profiles for for tailored inputs.


## Changelog 

See CHANGELOG.md
