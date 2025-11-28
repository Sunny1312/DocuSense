import os
import json
import re
from datetime import datetime
from typing import Optional, Dict, List
import tempfile
import shutil
import logging

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
from docx import Document
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

app = FastAPI(title="DocuSense API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://docu-sense-two.vercel.app",
        "https://docu-sense-two.vercel.app/",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logging.info("Gemini API configured successfully.")
else:
    logging.warning("GEMINI_API_KEY not found. AI analysis will use fallback responses.")

# Pydantic models for request bodies
class InterviewRequest(BaseModel):
    job_role: str
    skills: List[str]
    experience_level: Optional[str] = "Mid-level"

class SalaryRequest(BaseModel):
    job_role: str
    experience_level: str
    skills: List[str]
    location: Optional[str] = "United States"

class CoverLetterRequest(BaseModel):
    resume_summary: str
    job_description: str
    role: str

# Job roles database with salary information
JOB_ROLES_DATA = {
    "Software Engineer": {
        "base_salary": 95000,
        "skills": ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker"],
        "interview_topics": ["algorithms", "system design", "coding practices", "debugging"]
    },
    "Data Scientist": {
        "base_salary": 110000,
        "skills": ["Python", "R", "Machine Learning", "SQL", "Pandas", "TensorFlow", "Statistics", "Jupyter"],
        "interview_topics": ["machine learning", "statistics", "data analysis", "model evaluation"]
    },
    "DevOps Engineer": {
        "base_salary": 105000,
        "skills": ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform", "Linux", "CI/CD", "Monitoring"],
        "interview_topics": ["infrastructure", "automation", "monitoring", "cloud platforms"]
    },
    "Product Manager": {
        "base_salary": 120000,
        "skills": ["Product Strategy", "Agile", "Analytics", "Roadmapping", "Stakeholder Management", "User Research"],
        "interview_topics": ["product strategy", "user research", "analytics", "prioritization"]
    },
    "Full Stack Developer": {
        "base_salary": 90000,
        "skills": ["JavaScript", "React", "Node.js", "MongoDB", "Express", "HTML", "CSS", "REST APIs"],
        "interview_topics": ["frontend", "backend", "databases", "API design"]
    },
    "Machine Learning Engineer": {
        "base_salary": 125000,
        "skills": ["Python", "TensorFlow", "PyTorch", "MLOps", "Kubernetes", "Docker", "Scikit-learn", "Deep Learning"],
        "interview_topics": ["ML algorithms", "model deployment", "MLOps", "deep learning"]
    },
    "UI/UX Designer": {
        "base_salary": 85000,
        "skills": ["Figma", "Sketch", "Adobe Creative Suite", "Prototyping", "User Research", "Design Systems"],
        "interview_topics": ["design process", "user research", "prototyping", "design systems"]
    },
    "Cybersecurity Analyst": {
        "base_salary": 100000,
        "skills": ["Network Security", "Penetration Testing", "SIEM", "Incident Response", "Risk Assessment", "Compliance"],
        "interview_topics": ["security frameworks", "threat analysis", "incident response", "compliance"]
    },
    "Mobile Developer": {
        "base_salary": 95000,
        "skills": ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android", "Mobile UI/UX", "App Store"],
        "interview_topics": ["mobile development", "app architecture", "platform differences", "performance"]
    },
    "Game Developer": {
        "base_salary": 80000,
        "skills": ["Unity", "Unreal Engine", "C#", "C++", "Game Design", "3D Modeling", "Animation", "Physics"],
        "interview_topics": ["game engines", "game design", "optimization", "graphics programming"]
    }
}

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyPDF2, fallback to OCR"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        # If no text extracted, use OCR
        if not text.strip():
            logging.info("Falling back to OCR for PDF text extraction.")
            try:
                images = convert_from_path(file_path)
                for image in images:
                    text += pytesseract.image_to_string(image) + "\n"
            except Exception as ocr_error:
                logging.error(f"OCR fallback failed: {ocr_error}")
        
        return text.strip()
    except Exception as e:
        logging.error(f"PDF extraction error: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        logging.error(f"DOCX extraction error: {e}")
        return ""

def calculate_ats_score(resume_text: str, job_role: str, job_description: str = None) -> Dict:
    """Calculate ATS and related metrics using TF-IDF similarity"""
    
    # Get role-specific skills
    role_data = JOB_ROLES_DATA.get(job_role, JOB_ROLES_DATA["Software Engineer"])
    role_skills = role_data["skills"]
    
    resume_lower = resume_text.lower()
    
    if job_description:
        # Use TF-IDF similarity between resume and job description
        documents = [resume_text.lower(), job_description.lower()]
        try:
            vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(documents)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            keyword_match_pct = similarity * 100
        except:
            keyword_match_pct = 65.0  # Fallback
    else:
        keyword_match_pct = 65.0  # Default baseline
    
    # Calculate skill coverage
    matched_skills = [skill for skill in role_skills if skill.lower() in resume_lower]
    skill_coverage_pct = (len(matched_skills) / max(len(role_skills), 1)) * 100
    
    # Simple readability score (based on sentence length and complexity)
    sentences = re.split(r'[.!?]+', resume_text)
    avg_sentence_length = np.mean([len(sentence.split()) for sentence in sentences if sentence.strip()]) if sentences else 15
    readability_score = max(0, min(100, 100 - (avg_sentence_length - 15) * 2))
    
    # Calculate final ATS score
    ats_score = int((keyword_match_pct * 0.4 + skill_coverage_pct * 0.3 + readability_score * 0.3))
    
    # Determine experience level based on resume content
    experience_indicators = {
        "senior": ["senior", "lead", "manager", "architect", "principal", "director"],
        "mid": ["mid", "intermediate", "experienced", "specialist"],
        "junior": ["junior", "entry", "associate", "intern", "trainee"]
    }
    
    experience_level = "Mid-level"  # default
    for level, indicators in experience_indicators.items():
        if any(indicator in resume_lower for indicator in indicators):
            experience_level = level.capitalize() + ("-level" if level != "senior" else "")
            break
    
    # Industry fit based on skill coverage
    industry_fit = "Excellent" if skill_coverage_pct > 70 else "Good" if skill_coverage_pct > 50 else "Needs Improvement"
    
    # Technical depth based on matched skills
    technical_depth = "Strong" if len(matched_skills) > 5 else "Moderate" if len(matched_skills) > 3 else "Basic"
    
    return {
        "ats_score": ats_score,
        "keyword_match_pct": round(keyword_match_pct, 1),
        "skill_coverage_pct": round(skill_coverage_pct, 1),
        "readability_score": round(readability_score, 1),
        "estimated_improvement_points": max(0, 85 - ats_score),
        "keywords_matched": matched_skills,
        "role_specific_analysis": {
            "experience_level": experience_level,
            "industry_fit": industry_fit,
            "technical_depth": technical_depth
        }
    }

def analyze_with_ai(resume_text: str, role: str, job_description: str = None) -> Dict:
    """Analyze resume using AI (Gemini or fallback)"""
    prompt = f"""
Analyze this resume for a {role} position and return ONLY a valid JSON object with this exact structure:

{{
  "summary": "2-line professional summary based on the resume content",
  "strengths": ["specific strength from resume", "another strength", "third strength"],
  "weaknesses": ["area needing improvement", "another weakness"],
  "missing_skills": ["skill1 from job requirements", "skill2", "skill3"],
  "suggestions": [
    {{"type": "quick", "text": "specific actionable suggestion"}},
    {{"type": "quantify", "text": "add specific metrics suggestion"}},
    {{"type": "structure", "text": "formatting or structure improvement"}}
  ],
  "skill_distribution": {{"skill1": 30, "skill2": 25, "skill3": 25, "skill4": 20}}
}}

Resume text:
{resume_text[:4000]}

Job requirements (if provided):
{job_description[:1000] if job_description else f"General {role} role requirements"}

Return ONLY the JSON object, no other text or markdown formatting.
"""
    
    try:
        if GEMINI_API_KEY:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            ai_text = response.text.strip()
            
            # Clean up potential markdown formatting
            ai_text = re.sub(r'^```json\s*', '', ai_text)
            ai_text = re.sub(r'\s*```$', '', ai_text)
            
        else:
            # Fallback response
            role_data = JOB_ROLES_DATA.get(role, JOB_ROLES_DATA["Software Engineer"])
            ai_text = json.dumps({
                "summary": f"Experienced {role} with technical background and relevant skills for the position.",
                "strengths": ["Technical experience", "Relevant background", "Professional presentation"],
                "weaknesses": ["Limited quantified achievements", "Could benefit from more specific examples"],
                "missing_skills": role_data["skills"][-3:],
                "suggestions": [
                    {"type": "quick", "text": f"Add more {role}-specific keywords"},
                    {"type": "quantify", "text": "Include metrics and measurable achievements"},
                    {"type": "structure", "text": "Optimize resume format for ATS systems"}
                ],
                "skill_distribution": {
                    role_data["skills"][0]: 30,
                    role_data["skills"][1]: 25,
                    role_data["skills"][2]: 25,
                    role_data["skills"][3]: 20
                }
            })
    except Exception as e:
        logging.error(f"AI analysis error: {e}")
        # Error fallback
        ai_text = json.dumps({
            "summary": f"Resume analysis for {role} position completed with basic evaluation.",
            "strengths": ["Resume submitted successfully"],
            "weaknesses": ["Advanced analysis unavailable"],
            "missing_skills": ["API configuration needed"],
            "suggestions": [{"type": "quick", "text": "Verify API configuration for detailed analysis"}],
            "skill_distribution": {"frontend": 25, "backend": 25, "tools": 25, "soft skills": 25}
        })
    
    try:
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return json.loads(ai_text)
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse AI response as JSON: {e}")
        return {
            "summary": f"Unable to generate detailed AI analysis for {role} position.",
            "strengths": ["Resume content processed"],
            "weaknesses": ["Detailed analysis unavailable"],
            "missing_skills": ["Check API configuration"],
            "suggestions": [{"type": "quick", "text": "Verify system configuration"}],
            "skill_distribution": {"technical": 40, "experience": 30, "soft skills": 30}
        }

def analyze_general_document(text: str) -> Dict:
    """Analyze a general document using AI with type recognition"""
    prompt = f"""
Analyze the following document and return ONLY a valid JSON object with this exact structure:

{{
  "document_type": "Document Type (e.g., Business Report, Legal Contract, Academic Paper, etc.)",
  "summary": "A comprehensive 2-3 sentence summary of the document content and purpose.",
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "sentiment": "positive/negative/neutral",
  "readability_score": 75,
  "word_count": {len(text.split())},
  "improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]
}}

Document text (first 4000 characters):
{text[:4000]}

Analyze the content type, extract key insights, determine sentiment, and provide improvement suggestions.
Return ONLY the JSON object with no additional text or formatting.
"""
    
    try:
        if GEMINI_API_KEY:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            ai_text = response.text.strip()
            
            # Clean up potential markdown formatting
            ai_text = re.sub(r'^```json\s*', '', ai_text)
            ai_text = re.sub(r'\s*```$', '', ai_text)
        else:
            # Fallback analysis
            word_count = len(text.split())
            ai_text = json.dumps({
                "document_type": "General Document",
                "summary": "This document contains textual content that has been processed for analysis. The content appears to be informational in nature.",
                "key_points": [
                    "Document contains structured text content",
                    "Content is readable and well-formatted",
                    "Information appears to be organized logically",
                    "Document serves its intended purpose",
                    "Content is appropriate for its target audience"
                ],
                "sentiment": "neutral",
                "readability_score": 75,
                "word_count": word_count,
                "improvement_suggestions": [
                    "Consider adding more visual elements to enhance readability",
                    "Include executive summary for better accessibility", 
                    "Add more specific examples to support key points",
                    "Consider breaking up long paragraphs for better flow"
                ]
            })
    except Exception as e:
        logging.error(f"General document AI analysis error: {e}")
        word_count = len(text.split())
        ai_text = json.dumps({
            "document_type": "Unknown",
            "summary": "Document analysis completed with basic text processing.",
            "key_points": ["Document processed successfully"],
            "sentiment": "neutral",
            "readability_score": 70,
            "word_count": word_count,
            "improvement_suggestions": ["Advanced analysis requires API configuration"]
        })

    try:
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return json.loads(ai_text)
    except json.JSONDecodeError:
        logging.error("Failed to parse AI response as JSON for general document.")
        return {
            "document_type": "Processing Error",
            "summary": "Document analysis encountered a processing error.",
            "key_points": ["Error in processing"],
            "sentiment": "neutral",
            "readability_score": 50,
            "word_count": len(text.split()),
            "improvement_suggestions": ["Check system configuration"]
        }

def generate_cover_letter_with_ai(resume_summary: str, job_description: str, role: str) -> str:
    """Generate a cover letter using AI."""
    prompt = f"""
Write a professional cover letter for a {role} position. The cover letter should be:
- 3-4 paragraphs long
- Professional but engaging tone
- Highlight relevant skills and experience
- Show enthusiasm for the role
- Include a call to action

Resume Summary: {resume_summary}
Job Description: {job_description}
Target Role: {role}

Start with "Dear Hiring Manager," and provide only the cover letter text, no additional formatting.
"""
    
    try:
        if GEMINI_API_KEY:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            return response.text.strip()
        else:
            return f"""Dear Hiring Manager,

I am writing to express my strong interest in the {role} position at your company. Based on my background and experience outlined in my resume, I believe I would be a valuable addition to your team.

My experience aligns well with the requirements you've outlined. I bring a combination of technical skills and practical experience that would enable me to contribute effectively to your projects and objectives.

I am particularly excited about the opportunity to work in an environment that values innovation and professional growth. I would welcome the chance to discuss how my skills and enthusiasm can benefit your organization.

Thank you for considering my application. I look forward to hearing from you soon.

Sincerely,
[Your Name]"""
    except Exception as e:
        logging.error(f"Cover letter generation error: {e}")
        return "Failed to generate cover letter. Please try again or check API configuration."

def generate_interview_questions(role: str, skills: List[str], experience_level: str) -> List[str]:
    """Generate role-specific interview questions"""
    role_data = JOB_ROLES_DATA.get(role, JOB_ROLES_DATA["Software Engineer"])
    topics = role_data.get("interview_topics", ["general skills", "experience", "problem solving"])
    
    questions = [
        f"Tell me about your experience with {skills[0] if skills else 'the technologies'} mentioned in your resume.",
        f"How would you approach a challenging {role.lower()} project with tight deadlines?",
        f"Describe a time when you had to learn {skills[1] if len(skills) > 1 else 'a new technology'} quickly for a project.",
        f"What interests you most about working as a {role.lower()} at our company?",
        f"How do you stay updated with the latest {topics[0] if topics else 'industry'} trends and technologies?",
        f"Can you walk me through your experience with {topics[1] if len(topics) > 1 else 'project management'}?",
        f"Describe a situation where you had to {topics[2] if len(topics) > 2 else 'solve a complex problem'} in your previous role.",
        f"What do you consider your greatest strength as a {role.lower()}?",
        f"How do you handle working in a team environment, especially when there are conflicting opinions about {topics[0] if topics else 'technical approaches'}?",
        f"Where do you see yourself in your {role.lower()} career in the next 3-5 years?"
    ]
    
    # Filter questions based on experience level
    if experience_level.lower().startswith('senior'):
        questions.extend([
            f"How do you mentor junior {role.lower()}s and help them grow?",
            f"Describe your experience leading {topics[0] if topics else 'technical'} initiatives.",
        ])
    elif experience_level.lower().startswith('junior') or experience_level.lower().startswith('entry'):
        questions.extend([
            f"What attracts you to starting your career as a {role.lower()}?",
            f"How do you plan to continue learning and developing your {topics[0] if topics else 'technical'} skills?",
        ])
    
    return questions[:8]  # Return top 8 questions

def calculate_salary_estimate(role: str, experience_level: str, skills: List[str], location: str) -> Dict:
    """Calculate salary estimate based on role, experience, and location"""
    role_data = JOB_ROLES_DATA.get(role, JOB_ROLES_DATA["Software Engineer"])
    base_salary = role_data["base_salary"]
    
    # Experience multipliers
    experience_multipliers = {
        "Junior": 0.8,
        "Entry": 0.8,
        "Mid-level": 1.2,
        "Intermediate": 1.2,
        "Senior": 1.4,
        "Lead": 1.6,
        "Principal": 1.8
    }
    
    multiplier = experience_multipliers.get(experience_level, 1.0)
    estimated_salary = int(base_salary * multiplier)
    
    # Location adjustments (simplified)
    location_multipliers = {
        "San Francisco": 1.6,
        "New York": 1.4,
        "Seattle": 1.3,
        "Los Angeles": 1.2,
        "United States": 1.0,
        "Remote": 1.1
    }
    
    location_multiplier = location_multipliers.get(location, 1.0)
    estimated_salary = int(estimated_salary * location_multiplier)
    
    return {
        "estimated_salary": estimated_salary,
        "salary_range": {
            "min": int(estimated_salary * 0.8),
            "max": int(estimated_salary * 1.3)
        },
        "factors": [
            "Experience level",
            "Technical skills",
            "Industry demand", 
            "Geographic location",
            "Company size and type"
        ],
        "comparison": [
            {"level": "Entry", "salary": int(base_salary * 0.8 * location_multiplier)},
            {"level": "Mid", "salary": int(base_salary * 1.2 * location_multiplier)},
            {"level": "Senior", "salary": int(base_salary * 1.4 * location_multiplier)}
        ]
    }

# =========================================================================
# API Endpoints
# =========================================================================

@app.get("/")
async def root():
    return {"message": "DocuSense API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat() + "Z"}

@app.post("/api/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: str = Form(...),
    job_description: Optional[str] = Form(None)
):
    """Analyze an uploaded resume for ATS optimization and AI insights."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    allowed_types = ['.pdf', '.docx', '.doc']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported for resume analysis.")
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
        temp_path = temp_file.name
        await file.seek(0)
        contents = await file.read()
        temp_file.write(contents)
    
    try:
        # Extract text based on file type
        if file_ext == '.pdf':
            text = extract_text_from_pdf(temp_path)
        else:
            text = extract_text_from_docx(temp_path)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the file. Please ensure the file contains readable text.")
        
        # Perform analysis
        metrics = calculate_ats_score(text, job_role, job_description)
        ai_analysis = analyze_with_ai(text, job_role, job_description)
        
        return {
            "status": "ok",
            "metrics": metrics,
            **ai_analysis,
            "keywords_matched": metrics["keywords_matched"],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Resume analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except:
            pass

@app.post("/api/analyze-document")
async def analyze_document(file: UploadFile = File(...)):
    """Analyze any general document for insights and improvements."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
        temp_path = temp_file.name
        await file.seek(0)
        contents = await file.read()
        temp_file.write(contents)
    
    try:
        text = ""
        
        # Extract text based on file type
        if file_ext == '.pdf':
            text = extract_text_from_pdf(temp_path)
        elif file_ext in ['.docx', '.doc']:
            text = extract_text_from_docx(temp_path)
        elif file_ext in ['.txt', '.md']:
            try:
                text = contents.decode('utf-8', errors='ignore')
            except Exception:
                text = contents.decode('latin-1', errors='ignore')
        else:
            # Try to decode as plain text
            try:
                text = contents.decode('utf-8', errors='ignore')
            except Exception:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from the file.")
        
        # Perform AI analysis
        ai_analysis = analyze_general_document(text)
        
        return {
            "status": "ok",
            "filename": file.filename,
            **ai_analysis,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Document analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except:
            pass

@app.post("/api/generate-interview-questions")
async def generate_interview_questions_endpoint(request: InterviewRequest):
    """Generate personalized interview questions based on job role and skills."""
    try:
        questions = generate_interview_questions(
            role=request.job_role,
            skills=request.skills,
            experience_level=request.experience_level
        )
        
        return {
            "status": "ok",
            "questions": questions,
            "role": request.job_role,
            "experience_level": request.experience_level,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    except Exception as e:
        logging.error(f"Interview questions generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate interview questions: {str(e)}")

@app.post("/api/analyze-salary")
async def analyze_salary_endpoint(request: SalaryRequest):
    """Generate salary analysis and market insights."""
    try:
        salary_data = calculate_salary_estimate(
            role=request.job_role,
            experience_level=request.experience_level,
            skills=request.skills,
            location=request.location
        )
        
        return {
            "status": "ok",
            **salary_data,
            "role": request.job_role,
            "experience_level": request.experience_level,
            "location": request.location,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    except Exception as e:
        logging.error(f"Salary analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate salary analysis: {str(e)}")

@app.post("/api/generate-cover-letter")
async def generate_cover_letter_endpoint(request: CoverLetterRequest):
    """Generate a personalized cover letter based on resume and job description."""
    try:
        cover_letter = generate_cover_letter_with_ai(
            resume_summary=request.resume_summary,
            job_description=request.job_description,
            role=request.role
        )
        
        return {
            "status": "ok",
            "cover_letter": cover_letter,
            "role": request.role,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    except Exception as e:
        logging.error(f"Cover letter generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate cover letter: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return {
        "status": "error",
        "detail": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {exc}")
    return {
        "status": "error", 
        "detail": "An unexpected error occurred. Please try again later.",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }