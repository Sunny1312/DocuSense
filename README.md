# 🚀 DocuSense - AI-Powered Resume & Document Analyzer

<div align="center">

![DocuSense Banner](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge&logo=openai)
![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge&logo=vercel)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![Google Gemini](https://img.shields.io/badge/Google-Gemini%202.5-orange?style=for-the-badge&logo=google)

### 🌐 **[LIVE DEMO](https://docu-sense-two.vercel.app/)** 🌐

*Elevate your job search with AI-powered resume optimization and career insights*

[Features](#-features) • [Demo](#-live-demo) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📖 About

**DocuSense** is an intelligent career companion that leverages Google's Gemini 2.5 AI to help job seekers optimize their resumes, prepare for interviews, and analyze documents. Built with modern web technologies, it provides instant ATS (Applicant Tracking System) scoring, personalized career insights, and AI-powered recommendations.

### 🎯 Why DocuSense?

- **Beat ATS Systems**: Get instant feedback on how well your resume will perform with automated screening
- **AI-Powered Insights**: Receive personalized suggestions from Google's latest Gemini 2.5 Flash model
- **Interview Ready**: Generate role-specific interview questions tailored to your experience
- **Universal Document Analysis**: Analyze any document beyond just resumes
- **100% Free**: Completely free to use with no hidden costs

---

## ✨ Features

### 🎯 Resume Analysis
- **ATS Score Calculation**: Instant feedback on resume compatibility with applicant tracking systems
- **Keyword Matching**: Identify which keywords from job descriptions are present in your resume
- **AI-Powered Insights**: Get personalized suggestions to improve your resume using Gemini 2.5
- **Skill Coverage Analysis**: See how well your skills match specific job requirements
- **Visual Analytics**: Beautiful charts showing skill distribution and performance metrics

### 📊 Document Analysis
- **Universal Support**: Analyze PDFs, DOCX, TXT, and more
- **Content Insights**: AI-generated summaries, key points, and sentiment analysis
- **Readability Scoring**: Understand how clear and accessible your document is
- **Smart Suggestions**: Receive actionable feedback to enhance your content

### 💼 Career Tools
- **Interview Question Generator**: Get role-specific questions tailored to your experience level
- **Salary Analysis**: Estimate salary ranges based on role, experience, and location
- **Cover Letter Generator**: Create personalized cover letters highlighting your strengths
- **Career Insights**: Industry-specific recommendations and market trends

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Drag & Drop**: Effortless file uploads with drag-and-drop support
- **Real-time Analysis**: Instant feedback as you upload documents
- **History Tracking**: Keep track of your previous analyses
- **Mobile Friendly**: Works seamlessly on all devices

---

## 🌐 Live Demo

### 🔗 **Try it now: [https://docu-sense-two.vercel.app/](https://docu-sense-two.vercel.app/)**

> **Note**: First load may take 30-60 seconds as the backend wakes up (free tier limitation). Subsequent requests are fast!

### 📸 Screenshots

<div align="center">

| Resume Analysis | Document Insights | Interview Prep |
|:--------------:|:----------------:|:-------------:|
| ![Resume](https://via.placeholder.com/300x200?text=Resume+Analysis) | ![Document](https://via.placeholder.com/300x200?text=Document+Analysis) | ![Interview](https://via.placeholder.com/300x200?text=Interview+Prep) |

</div>

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful data visualizations
- **Lucide React** - Premium icon library
- **Vercel** - Blazing fast hosting

### Backend
- **FastAPI** - High-performance Python framework
- **Google Gemini 2.5 Flash** - Latest AI model for analysis
- **PyPDF2 & python-docx** - Document processing
- **Scikit-learn** - TF-IDF similarity analysis
- **Tesseract OCR** - Scanned document support
- **Render** - Reliable backend hosting

### AI & ML
- **Google Gemini 2.5 Flash** - State-of-the-art language model
- **TF-IDF Vectorization** - Keyword matching algorithm
- **Cosine Similarity** - Resume-job description comparison
- **Natural Language Processing** - Content analysis

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 14+** - [Download](https://nodejs.org/)
- **Google Gemini API Key** - [Get it FREE](https://aistudio.google.com/apikey)
- **Git** - [Download](https://git-scm.com/)

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sunny1312/DocuSense.git
cd DocuSense
```

#### 2️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the server
uvicorn main:app --reload
```

Backend will run on `http://127.0.0.1:8000`

#### 3️⃣ Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at `http://localhost:3000`

---

## 📁 Project Structure

```
DocuSense/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (not in git)
│   └── Dockerfile          # Docker configuration
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── index.js        # React entry point
│   │   └── ...
│   ├── package.json        # Node dependencies
│   └── tailwind.config.js  # Tailwind configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🔌 API Endpoints

### Resume Analysis
```http
POST /api/analyze-resume
Content-Type: multipart/form-data

Parameters:
- file: Resume file (PDF/DOCX)
- job_role: Target job role
- job_description: Job description (optional)

Returns: ATS score, keyword matches, AI insights, skill analysis
```

### Document Analysis
```http
POST /api/analyze-document
Content-Type: multipart/form-data

Parameters:
- file: Document file (PDF/DOCX/TXT)

Returns: Document type, summary, key points, sentiment, suggestions
```

### Interview Questions
```http
POST /api/generate-interview-questions
Content-Type: application/json

Body:
{
  "job_role": "Software Engineer",
  "skills": ["Python", "React"],
  "experience_level": "Mid-level"
}

Returns: Array of personalized interview questions
```

### Salary Analysis
```http
POST /api/analyze-salary
Content-Type: application/json

Body:
{
  "job_role": "Data Scientist",
  "experience_level": "Senior",
  "skills": ["Python", "ML"],
  "location": "San Francisco"
}

Returns: Salary estimates and market insights
```

### Cover Letter Generation
```http
POST /api/generate-cover-letter
Content-Type: application/json

Body:
{
  "resume_summary": "Your resume summary",
  "job_description": "Job description",
  "role": "Product Manager"
}

Returns: AI-generated cover letter
```

---

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Deploy!

### Backend (Render)

1. Push code to GitHub
2. Create Web Service on [Render](https://render.com)
3. Set root directory to `backend`
4. Add environment variable: `GEMINI_API_KEY`
5. Deploy!

**Live URLs:**
- Frontend: https://docu-sense-two.vercel.app/
- Backend API: https://docusense-backend-ej7w.onrender.com

---

## 🎯 Supported Job Roles

- ✅ Software Engineer
- ✅ Data Scientist
- ✅ DevOps Engineer
- ✅ Product Manager
- ✅ Full Stack Developer
- ✅ Machine Learning Engineer
- ✅ UI/UX Designer
- ✅ Cybersecurity Analyst
- ✅ Mobile Developer
- ✅ Game Developer

*More roles coming soon!*

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Ideas for Contributions

- 🌍 Add more job roles
- 📊 Enhance analytics visualizations
- 🌐 Add internationalization (i18n)
- 🎨 Improve UI/UX
- 🧪 Add unit tests
- 📱 Create mobile app version
- 🔒 Add user authentication
- 💾 Add database for saving analyses

---

## 🐛 Known Issues & Limitations

- ⏱️ **Cold Start Delay**: First request takes 30-60 seconds (free tier Render backend)
- 📄 **File Size**: Limited to 10MB per upload
- 🔑 **API Rate Limits**: Gemini API has usage limits (free tier)
- 🌐 **OCR**: Scanned PDFs may have accuracy issues

---

## 📝 Roadmap

- [ ] User authentication and saved profiles
- [ ] Resume version comparison
- [ ] LinkedIn profile integration
- [ ] Job board integration
- [ ] Resume templates
- [ ] Video interview practice with AI
- [ ] Skill gap analysis
- [ ] Career path recommendations
- [ ] Resume A/B testing
- [ ] Chrome extension

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For powerful language models
- **FastAPI** - For excellent Python web framework
- **React & Tailwind** - For modern frontend development
- **Vercel & Render** - For free hosting solutions
- **Open Source Community** - For amazing tools and libraries

---

## 📧 Contact & Support

**Developer**: Surya Sunanda Meesala  
**GitHub**: [@Sunny1312](https://github.com/Sunny1312)  
**Project Link**: [https://github.com/Sunny1312/DocuSense](https://github.com/Sunny1312/DocuSense)  
**Live Demo**: [https://docu-sense-two.vercel.app/](https://docu-sense-two.vercel.app/)

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

### 🚀 **[TRY DOCUSENSE NOW](https://docu-sense-two.vercel.app/)** 🚀

Made with ❤️ and ☕ by Surya Sunanda Meesala

[![GitHub stars](https://img.shields.io/github/stars/Sunny1312/DocuSense?style=social)](https://github.com/Sunny1312/DocuSense/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Sunny1312/DocuSense?style=social)](https://github.com/Sunny1312/DocuSense/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/Sunny1312/DocuSense?style=social)](https://github.com/Sunny1312/DocuSense/watchers)

</div>
