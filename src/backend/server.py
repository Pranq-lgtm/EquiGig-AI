# -*- coding: utf-8 -*-
"""EquiGig Backend API Server

FastAPI application providing endpoints for EquiGig LangGraph Agent execution,
health status check, `.env` verification, and static frontend hosting.
"""

import os
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from equigig_langgraph_agent import run_agent, API_KEY, IS_MOCK_KEY
from endee_service import get_endee_status
from job_extractor import extract_job_from_url_or_text, SAMPLE_URL_MOCKS

load_dotenv()

app = FastAPI(
    title="EquiGig AI Agent API",
    description="Backend API for EquiGig LangGraph autonomous negotiation agent",
    version="1.0.0"
)

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class UserProfileSchema(BaseModel):
    name: str = Field(default="Jane Doe", description="Worker's name")
    skills: List[str] = Field(default_factory=lambda: ["Python", "LangGraph"], description="Worker skills")
    min_hourly_rate: int = Field(default=30, description="Minimum acceptable rate in USD/hr")

class JobDataSchema(BaseModel):
    title: str = Field(default="Junior Data Scientist", description="Job title")
    company: str = Field(default="TechCorp Solutions", description="Hiring company")
    proposed_rate: int = Field(default=25, description="Offered hourly rate in USD")
    contract_snippet: List[str] = Field(
        default_factory=lambda: [
            "Employee agrees to a 2-year non-compete clause.",
            "Payment is net-90 days upon invoice receipt."
        ],
        description="Contract clauses"
    )

class ExtractJobRequest(BaseModel):
    url: Optional[str] = Field(default=None, description="Job listing URL")
    raw_text: Optional[str] = Field(default=None, description="Pasted job description text if URL is behind a login wall")

class AgentRequestSchema(BaseModel):
    user_profile: UserProfileSchema
    custom_job: Optional[JobDataSchema] = None

@app.get("/api/health")
def get_health_status():
    """
    Returns server health and environment API key configuration state.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    active_provider = "Gemini API" if gemini_key else ("OpenAI API" if openai_key else "Default Environment Key")
    key_masked = (API_KEY[:6] + "..." + API_KEY[-4:]) if len(API_KEY) > 10 else "Not set"
    vector_status = get_endee_status()

    return {
        "status": "online",
        "agent": "EquiGig LangGraph Engine v1.0",
        "api_provider": active_provider,
        "is_mock_key": IS_MOCK_KEY,
        "masked_key": key_masked,
        "env_file_loaded": os.path.exists(".env"),
        "vector_db": vector_status,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/api/presets")
def get_presets():
    """
    Returns preset test contracts and scenarios for frontend testing.
    """
    return {
        "presets": [
            {
                "id": "techcorp-exploitative",
                "name": "TechCorp Solutions (Underpaid + Non-Compete + Net-90)",
                "profile": {"name": "Alex Mercer", "skills": ["Python", "FastAPI", "AI"], "min_hourly_rate": 35},
                "job": {
                    "title": "Backend AI Developer",
                    "company": "TechCorp Solutions",
                    "proposed_rate": 25,
                    "contract_snippet": [
                        "Employee agrees to a strict 2-year non-compete clause post-engagement.",
                        "Payment is net-90 days upon invoice receipt.",
                        "All IP created off-hours belongs exclusively to TechCorp."
                    ]
                }
            },
            {
                "id": "fair-offer",
                "name": "Standard Fair Contract (Competitive Rate)",
                "profile": {"name": "Sarah Connor", "skills": ["React", "UI/UX", "TypeScript"], "min_hourly_rate": 40},
                "job": {
                    "title": "Frontend Engineer",
                    "company": "OpenScale Inc.",
                    "proposed_rate": 45,
                    "contract_snippet": [
                        "Payment is processed bi-weekly upon invoice.",
                        "Client owns IP related strictly to project deliverables."
                    ]
                }
            },
            {
                "id": "freelance-design",
                "name": "Design Gig (Net-60 + Low Rate)",
                "profile": {"name": "Jordan Lee", "skills": ["Figma", "Branding"], "min_hourly_rate": 50},
                "job": {
                    "title": "Lead UI Designer",
                    "company": "GlobalMedia LLC",
                    "proposed_rate": 35,
                    "contract_snippet": [
                        "Contractor agrees to unlimited revisions without extra compensation.",
                        "Payment terms: Net-60 days."
                    ]
                }
            }
        ]
    }

@app.post("/api/extract-job")
def extract_job_endpoint(payload: ExtractJobRequest):
    """
    Extracts job title, company, salary/rate, required skills, and contract terms
    from a job listing URL or pasted job text using Gemini AI & heuristic fallback.
    """
    try:
        result = extract_job_from_url_or_text(url=payload.url, raw_text=payload.raw_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/sample-jobs")
def get_sample_jobs():
    """
    Returns curated sample job URLs for instant demonstration and testing.
    """
    samples = []
    labels = {
        "https://boards.greenhouse.io/anthropic/jobs/senior-ai-engineer": "Anthropic AI Workflow Engineer ($70/hr)",
        "https://jobs.lever.co/stripe/staff-backend-developer": "Stripe Staff Backend Engineer ($60/hr)",
        "https://remoteok.com/remote-jobs/senior-react-developer": "RemoteOk React Contractor ($45/hr)"
    }
    for url, data in SAMPLE_URL_MOCKS.items():
        samples.append({
            "url": url,
            "label": labels.get(url, data.get("title", "Job Posting")),
            "title": data.get("title"),
            "company": data.get("company"),
            "rate": data.get("proposed_rate"),
            "skills": data.get("required_skills", [])
        })
    return {"samples": samples}

@app.post("/api/run-agent")
def run_agent_endpoint(payload: AgentRequestSchema):
    """
    Runs the EquiGig LangGraph workflow with user inputs and returns step-by-step state.
    """
    try:
        profile_dict = payload.user_profile.model_dump()
        job_dict = payload.custom_job.model_dump() if payload.custom_job else None

        result = run_agent(user_profile=profile_dict, custom_job=job_dict)
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")

# Serve Static Frontend Files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Since server.py is in src/backend, frontend is in src/frontend
frontend_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def read_root():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "EquiGig AI Backend API is running. Access /api/health for status."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Starting EquiGig FastAPI Server on http://{host}:{port}")
    uvicorn.run("server:app", host=host, port=port, reload=True)
