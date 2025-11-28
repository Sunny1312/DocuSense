import React, { useState, useEffect } from "react";
import {
  Upload, FileText, BarChart3, TrendingUp, Download, Copy, Menu, X, RefreshCw, BookOpen,
  Maximize2, Minimize2, Lightbulb, Type, Brain, MessageSquare, Zap, PieChart,
  CheckCircle, AlertTriangle, Star, Award, Target, Users, Code, Database,
  Shield, Briefcase, Cpu, Palette, Globe
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         BarChart, Bar, PieChart as RechartsPie, Cell, Legend } from "recharts";

const API_URL = "http://127.0.0.1:8000"; // Base URL without /api prefix

// Job roles with their specific requirements
const JOB_ROLES = {
  "Software Engineer": {
    icon: Code,
    color: "text-blue-600"
  },
  "Data Scientist": {
    icon: Database,
    color: "text-purple-600"
  },
  "DevOps Engineer": {
    icon: Shield,
    color: "text-green-600"
  },
  "Product Manager": {
    icon: Briefcase,
    color: "text-orange-600"
  },
  "Full Stack Developer": {
    icon: Globe,
    color: "text-indigo-600"
  },
  "Machine Learning Engineer": {
    icon: Cpu,
    color: "text-red-600"
  },
  "UI/UX Designer": {
    icon: Palette,
    color: "text-pink-600"
  },
  "Frontend Developer": {
    icon: Code,
    color: "text-cyan-600"
  },
  "Backend Developer": {
    icon: Database,
    color: "text-teal-600"
  },
  "Mobile Developer": {
    icon: Code,
    color: "text-violet-600"
  }
};

function App() {
  // Global State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');

  // Resume Analysis State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeRole, setResumeRole] = useState("Software Engineer");
  const [resumeJobDescription, setResumeJobDescription] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [resumeDragActive, setResumeDragActive] = useState(false);

  // Document Analysis State
  const [documentFile, setDocumentFile] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentResult, setDocumentResult] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [documentDragActive, setDocumentDragActive] = useState(false);

  // Interview Prep State
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = "DocuSense: AI-Powered Career & Document Analysis";
  }, []);

  // Generic Drag/Drop Handlers
  const handleDrag = (e, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, setDragActive, setFile) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // ACTUAL Resume Analysis with Backend API
  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert("Please upload a resume file!");
      return;
    }

    setResumeLoading(true);
    setResumeError(null);
    setResumeResult(null);

    const formData = new FormData();
    formData.append("file", resumeFile);
    formData.append("job_role", resumeRole);  // Changed from "role" to "job_role"
    if (resumeJobDescription && resumeJobDescription.trim()) {
      formData.append("job_description", resumeJobDescription);
    }

    try {
      const res = await fetch(`${API_URL}/api/analyze-resume`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || `Server error: ${res.status}`);
      }

      if (data.status === "ok") {
        setResumeResult(data);
        const newHistory = [...resumeHistory, { 
          ...data, 
          filename: resumeFile.name, 
          role: resumeRole, 
          timestamp: new Date().toISOString() 
        }];
        setResumeHistory(newHistory);
      } else {
        throw new Error(data.detail || "Resume analysis failed");
      }
    } catch (err) {
      console.error("Error during resume analysis:", err);
      setResumeError(err.message || "Failed to analyze resume. Make sure the backend is running on port 8000.");
    } finally {
      setResumeLoading(false);
    }
  };

  // ACTUAL Document Analysis with Backend API
  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!documentFile) {
      alert("Please upload a document file!");
      return;
    }

    setDocumentLoading(true);
    setDocumentError(null);
    setDocumentResult(null);

    const formData = new FormData();
    formData.append("file", documentFile);  // Changed back to "file"

    try {
      const res = await fetch(`${API_URL}/api/analyze-document`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || `Server error: ${res.status}`);
      }

      if (data.status === "ok") {
        setDocumentResult(data);
        const newHistory = [...documentHistory, { 
          ...data, 
          timestamp: new Date().toISOString() 
        }];
        setDocumentHistory(newHistory);
      } else {
        throw new Error(data.detail || "Document analysis failed");
      }
    } catch (err) {
      console.error("Error during document analysis:", err);
      setDocumentError(err.message || "Failed to analyze document. Make sure the backend is running on port 8000.");
    } finally {
      setDocumentLoading(false);
    }
  };

  // Generate Interview Questions based on ACTUAL resume data
  const generateInterviewQuestions = async () => {
    if (!resumeResult) {
      alert("Please analyze a resume first!");
      return;
    }

    setInterviewLoading(true);

    try {
      // Use Gemini to generate questions based on actual resume data
      const questions = [
        `Based on your experience with ${resumeResult.keywords_matched.slice(0, 2).join(" and ")}, can you describe a challenging project you worked on?`,
        `How would you approach ${resumeResult.missing_skills[0] || "learning new technologies"} to enhance your skillset for this ${resumeRole} position?`,
        `Tell me about a time when you demonstrated leadership or took initiative in your previous role.`,
        `What interests you most about working as a ${resumeRole}, and how does your background align with this role?`,
        `Can you walk me through your problem-solving process when faced with a complex technical challenge?`
      ];

      setInterviewQuestions(questions);
    } catch (err) {
      console.error("Error generating interview questions:", err);
      alert("Failed to generate interview questions");
    } finally {
      setInterviewLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadText = (content, filename) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: "text/plain"});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#059669'];

  const skillData = resumeResult?.skill_distribution ? 
    Object.entries(resumeResult.skill_distribution).map(([key, value], idx) => ({ 
      name: key, 
      value: Math.round(value),
      fill: COLORS[idx % COLORS.length] 
    })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-white shadow-2xl border-r border-gray-200
          ${sidebarCollapsed ? 'w-20' : 'w-72'} 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-indigo-500">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-white" />
              <h1 className="text-xl font-bold text-white">DocuSense</h1>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block text-white hover:text-indigo-200 p-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-indigo-200 p-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 bg-white">
          <div className="p-4 space-y-2">
            {[
              { id: 'resume', label: 'Resume Analysis', icon: FileText },
              { id: 'document', label: 'Document Analysis', icon: BookOpen },
              { id: 'interview', label: 'Interview Prep', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl flex items-center group transition-all duration-200
                  ${activeTab === tab.id ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}
                  ${sidebarCollapsed ? 'justify-center px-2' : ''}
                `}
                title={sidebarCollapsed ? tab.label : ""}
              >
                <tab.icon className={`w-5 h-5 ${!sidebarCollapsed ? 'mr-3' : ''} group-hover:text-indigo-600 transition-colors`} />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            ))}
          </div>

          {/* Recent History */}
          <div className="p-4 border-t border-gray-200">
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ${sidebarCollapsed ? 'text-center' : ''}`}>
              {!sidebarCollapsed ? 'Recent Activity' : 'Recent'}
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(activeTab === 'resume' ? resumeHistory : documentHistory).slice(-5).reverse().map((item, index) => (
                <button
                  key={index}
                  onClick={() => { 
                    if (activeTab === 'resume') setResumeResult(item); 
                    else setDocumentResult(item);
                    setSidebarOpen(false); 
                  }}
                  className={`w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center group transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? item.filename : ""}
                >
                  <RefreshCw size={14} className={`text-gray-400 ${!sidebarCollapsed ? 'mr-2' : ''} group-hover:text-indigo-600 transition-colors`} />
                  {!sidebarCollapsed && <span className="truncate text-xs">{item.filename}</span>}
                </button>
              ))}
              {(activeTab === 'resume' ? resumeHistory : documentHistory).length === 0 && !sidebarCollapsed && (
                <p className="text-center text-xs text-gray-400 py-4">No recent activity</p>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Enhanced Top Bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                {activeTab === 'resume' && <FileText className="w-5 h-5 text-white" />}
                {activeTab === 'document' && <BookOpen className="w-5 h-5 text-white" />}
                {activeTab === 'interview' && <MessageSquare className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'resume' && 'Resume Analysis'}
                {activeTab === 'document' && 'Document Analysis'}
                {activeTab === 'interview' && 'Interview Preparation'}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Powered by Gemini AI
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            
            {/* Resume Analysis Tab */}
            {activeTab === 'resume' && (
              <>
                {/* Enhanced Resume Upload Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Resume Analysis</h3>
                      <p className="text-gray-600">Get AI-powered insights using Gemini</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleResumeSubmit} className="space-y-6">
                    {/* File Upload */}
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                        ${resumeDragActive ? 'border-indigo-400 bg-indigo-50 scale-105' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                      `}
                      onDragEnter={(e) => handleDrag(e, setResumeDragActive)}
                      onDragLeave={(e) => handleDrag(e, setResumeDragActive)}
                      onDragOver={(e) => handleDrag(e, setResumeDragActive)}
                      onDrop={(e) => handleDrop(e, setResumeDragActive, setResumeFile)}
                    >
                      <Upload className="mx-auto h-16 w-16 text-indigo-400 mb-4" />
                      <div className="space-y-2">
                        <label htmlFor="resume-file-upload" className="cursor-pointer">
                          <span className="block text-xl font-semibold text-gray-900">
                            {resumeFile ? resumeFile.name : "Upload Your Resume"}
                          </span>
                          <span className="text-sm text-gray-500 mt-2 block">
                            Supports PDF, DOCX formats • Max 10MB
                          </span>
                        </label>
                        <input
                          id="resume-file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.docx"
                          onChange={(e) => setResumeFile(e.target.files[0])}
                        />
                      </div>
                    </div>

                    {/* Enhanced Role Selection */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Target Role</label>
                        <div className="relative">
                          <select
                            value={resumeRole}
                            onChange={(e) => setResumeRole(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                          >
                            {Object.keys(JOB_ROLES).map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Job Description <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                          value={resumeJobDescription}
                          onChange={(e) => setResumeJobDescription(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                          placeholder="Paste the job requirements here for better matching..."
                        />
                      </div>
                    </div>

                    {/* Error Display */}
                    {resumeError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <p className="text-red-700 font-medium">Error: {resumeError}</p>
                        </div>
                        <p className="text-sm text-red-600 mt-2">
                          Make sure your backend is running on port 8000
                        </p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                      <button
                        type="submit"
                        disabled={!resumeFile || resumeLoading}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        {resumeLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing with Gemini AI...
                          </>
                        ) : (
                          <>
                            <Brain className="w-6 h-6 mr-3" />
                            Analyze My Resume
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Enhanced Resume Results */}
                {resumeResult && (
                  <div className="space-y-8">
                    {/* Performance Metrics Dashboard */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {[{
                        label: "ATS Score", 
                        value: `${resumeResult.metrics.ats_score}/100`, 
                        icon: Target, 
                        color: resumeResult.metrics.ats_score >= 80 ? "text-green-600" : resumeResult.metrics.ats_score >= 60 ? "text-yellow-600" : "text-red-600",
                        bg: resumeResult.metrics.ats_score >= 80 ? "bg-green-50" : resumeResult.metrics.ats_score >= 60 ? "bg-yellow-50" : "bg-red-50",
                        progress: resumeResult.metrics.ats_score
                      }, {
                        label: "Skill Match", 
                        value: `${resumeResult.metrics.skill_coverage_pct}%`, 
                        icon: CheckCircle, 
                        color: resumeResult.metrics.skill_coverage_pct >= 70 ? "text-blue-600" : "text-orange-600",
                        bg: resumeResult.metrics.skill_coverage_pct >= 70 ? "bg-blue-50" : "bg-orange-50",
                        progress: resumeResult.metrics.skill_coverage_pct
                      }, {
                        label: "Keywords", 
                        value: `${resumeResult.metrics.keyword_match_pct}%`, 
                        icon: Zap, 
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                        progress: resumeResult.metrics.keyword_match_pct
                      }, {
                        label: "Readability", 
                        value: `${resumeResult.metrics.readability_score}%`, 
                        icon: FileText, 
                        color: "text-indigo-600",
                        bg: "bg-indigo-50",
                        progress: resumeResult.metrics.readability_score
                      }].map((metric, index) => (
                        <div key={index} className={`${metric.bg} overflow-hidden rounded-2xl border border-opacity-20 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`w-12 h-12 rounded-xl ${metric.bg} flex items-center justify-center border`}>
                                <metric.icon className={`h-6 w-6 ${metric.color}`} />
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                                <div className="text-sm text-gray-600">{metric.label}</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                  metric.progress >= 80 ? 'bg-green-500' : 
                                  metric.progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${metric.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Skills Analysis */}
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-gray-900">Skills Distribution</h3>
                          <PieChart className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="h-80">
                          {skillData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPie data={skillData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                                {skillData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </RechartsPie>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <div className="text-center">
                                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No skill data available</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          {skillData.slice(0, 4).map((entry, index) => (
                            <div key={entry.name} className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.fill }}
                              />
                              <span className="text-sm text-gray-700 capitalize">{entry.name}</span>
                              <span className="text-sm font-semibold text-gray-900">{entry.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Keywords Matched */}
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <h3 className="text-xl font-bold text-gray-900">Matched Keywords</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                          {resumeResult.keywords_matched && resumeResult.keywords_matched.length > 0 ? (
                            resumeResult.keywords_matched.map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full border border-green-200"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center w-full py-4">No keywords matched</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Professional Summary */}
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <Lightbulb className="w-6 h-6 text-yellow-600" />
                            <h3 className="text-xl font-bold text-gray-900">AI-Generated Summary</h3>
                          </div>
                          <button
                            onClick={() => copyToClipboard(resumeResult.summary)}
                            className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                            title="Copy Summary"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                          <p className="text-gray-700 leading-relaxed italic">"{resumeResult.summary}"</p>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={() => downloadText(resumeResult.summary, 'resume-summary.txt')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Summary
                          </button>
                        </div>
                      </div>

                      {/* Improvement Suggestions */}
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                          <h3 className="text-xl font-bold text-gray-900">Improvement Plan</h3>
                        </div>
                        <div className="space-y-4">
                          {resumeResult.suggestions && resumeResult.suggestions.length > 0 ? (
                            resumeResult.suggestions.map((suggestion, index) => (
                              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  suggestion.type === 'quick' ? 'bg-green-500' : 
                                  suggestion.type === 'quantify' ? 'bg-blue-500' : 'bg-purple-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{suggestion.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">No suggestions available</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                          <Star className="w-6 h-6 text-green-600" />
                          <h3 className="text-xl font-bold text-gray-900">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                          {resumeResult.strengths && resumeResult.strengths.length > 0 ? (
                            resumeResult.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                <Lightbulb className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                                <span className="text-sm text-gray-700 leading-snug">{strength}</span>
                              </li>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">No strengths identified</p>
                          )}
                        </ul>
                      </div>

                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                          <AlertTriangle className="w-6 h-6 text-orange-600" />
                          <h3 className="text-xl font-bold text-gray-900">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-3 mb-4">
                          {resumeResult.weaknesses && resumeResult.weaknesses.length > 0 ? (
                            resumeResult.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                                <Type className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                                <span className="text-sm text-gray-700 leading-snug">{weakness}</span>
                              </li>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">No weaknesses identified</p>
                          )}
                        </ul>
                        
                        {resumeResult.missing_skills && resumeResult.missing_skills.length > 0 && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Missing Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {resumeResult.missing_skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full border border-red-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Document Analysis Tab */}
            {activeTab === 'document' && (
              <>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Document Analysis</h3>
                      <p className="text-gray-600">Analyze any document with Gemini AI</p>
                    </div>
                  </div>

                  <form onSubmit={handleDocumentSubmit} className="space-y-6">
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                        ${documentDragActive ? 'border-teal-400 bg-teal-50 scale-105' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                      `}
                      onDragEnter={(e) => handleDrag(e, setDocumentDragActive)}
                      onDragLeave={(e) => handleDrag(e, setDocumentDragActive)}
                      onDragOver={(e) => handleDrag(e, setDocumentDragActive)}
                      onDrop={(e) => handleDrop(e, setDocumentDragActive, setDocumentFile)}
                    >
                      <Upload className="mx-auto h-16 w-16 text-teal-400 mb-4" />
                      <div className="space-y-2">
                        <label htmlFor="document-file-upload" className="cursor-pointer">
                          <span className="block text-xl font-semibold text-gray-900">
                            {documentFile ? documentFile.name : "Upload Any Document"}
                          </span>
                          <span className="text-sm text-gray-500 mt-2 block">
                            PDF, DOCX, TXT, and more • Max 10MB
                          </span>
                        </label>
                        <input
                          id="document-file-upload"
                          type="file"
                          className="sr-only"
                          onChange={(e) => setDocumentFile(e.target.files[0])}
                        />
                      </div>
                    </div>

                    {/* Error Display */}
                    {documentError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <p className="text-red-700 font-medium">Error: {documentError}</p>
                        </div>
                        <p className="text-sm text-red-600 mt-2">
                          Make sure your backend is running on port 8000
                        </p>
                      </div>
                    )}

                    <div className="flex justify-center pt-4">
                      <button
                        type="submit"
                        disabled={!documentFile || documentLoading}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        {documentLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing with Gemini AI...
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-6 h-6 mr-3" />
                            Analyze Document
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Document Results */}
                {documentResult && (
                  <div className="space-y-8">
                    {/* Document Overview */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Document Overview: {documentResult.filename}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(documentResult.summary)}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => downloadText(
                              `Document Analysis Report\n\nFilename: ${documentResult.filename}\nType: ${documentResult.document_type}\n\nSummary:\n${documentResult.summary}\n\nKey Points:\n${documentResult.key_points?.map((p, i) => `${i+1}. ${p}`).join('\n') || 'N/A'}\n\nSentiment: ${documentResult.sentiment}`,
                              `analysis-${documentResult.filename}.txt`
                            )}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">Document Type</p>
                              <p className="text-lg font-bold text-blue-700">{documentResult.document_type}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                          <div className="flex items-center space-x-3">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Sentiment</p>
                              <p className={`text-lg font-bold capitalize ${
                                documentResult.sentiment === 'positive' ? 'text-green-700' :
                                documentResult.sentiment === 'negative' ? 'text-red-700' : 'text-gray-700'
                              }`}>{documentResult.sentiment}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Summary</h4>
                        <p className="text-gray-700 leading-relaxed">{documentResult.summary}</p>
                      </div>
                    </div>

                    {/* Key Points */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <Star className="w-6 h-6 text-yellow-600" />
                        <h3 className="text-xl font-bold text-gray-900">Key Points</h3>
                      </div>
                      <ul className="space-y-3">
                        {documentResult.key_points && documentResult.key_points.length > 0 ? (
                          documentResult.key_points.map((point, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-xs font-bold text-yellow-700">{index + 1}</span>
                              </div>
                              <p className="text-gray-700">{point}</p>
                            </li>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No key points extracted</p>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Interview Prep Tab */}
            {activeTab === 'interview' && (
              <>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Interview Preparation</h3>
                      <p className="text-gray-600">Get personalized interview questions based on your resume</p>
                    </div>
                  </div>

                  {!resumeResult ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Please analyze a resume first to generate interview questions</p>
                      <button
                        onClick={() => setActiveTab('resume')}
                        className="mt-4 inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Go to Resume Analysis
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        onClick={generateInterviewQuestions}
                        disabled={interviewLoading}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        {interviewLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <Brain className="w-6 h-6 mr-3" />
                            Generate Interview Questions
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Interview Questions Results */}
                {interviewQuestions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Personalized Interview Questions</h3>
                      <button
                        onClick={() => downloadText(
                          `Interview Questions for ${resumeRole}\n\n${interviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}`,
                          `interview-questions-${resumeRole.replace(/\s+/g, '-').toLowerCase()}.txt`
                        )}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {interviewQuestions.map((question, index) => (
                        <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">Q{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 text-lg leading-relaxed">{question}</p>
                              <button
                                onClick={() => copyToClipboard(question)}
                                className="mt-3 text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy Question</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;