# -*- coding: utf-8 -*-
"""EquiGig LangGraph Agent

Autonomous gig worker protection and contract negotiation agent powered by LangGraph.
"""

import os
from typing import TypedDict, List, Dict, Annotated, Any, Optional
import operator
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END

from endee_service import query_endee_contract_rag, index_contract_vector

# --- Environment & API Configuration ---
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Active key resolution
API_KEY = GEMINI_API_KEY or OPENAI_API_KEY or "mock_demo_key_12345"
IS_MOCK_KEY = API_KEY.startswith("mock_demo") or API_KEY == "your_gemini_api_key_here" or not API_KEY

class EquiGigState(TypedDict):
    user_profile: Dict[str, Any]
    matched_job: Dict[str, Any]
    contract_clauses: List[str]
    identified_issues: List[str]
    negotiation_status: str
    drafted_email: str
    endee_rag_insights: Dict[str, Any]
    log: Annotated[List[str], operator.add]

def analyze_profile_node(state: EquiGigState) -> Dict[str, Any]:
    """
    Node 1: Analyzes the user's profile and preferences.
    """
    profile = state.get("user_profile", {})
    name = profile.get("name", "Gig Worker")
    skills = ", ".join(profile.get("skills", ["General"]))
    min_rate = profile.get("min_hourly_rate", 30)

    key_status = "Production API Key" if not IS_MOCK_KEY else "Loaded Environment Key (Mock/Default)"
    log_msg = f"Agent [{key_status}]: Analyzed profile for {name}. Skills: [{skills}], Minimum Target Rate: ${min_rate}/hr."

    return {
        "log": [log_msg]
    }

def search_jobs_node(state: EquiGigState) -> Dict[str, Any]:
    """
    Node 2: Searches for or loads the targeted gig job opportunity.
    """
    profile = state.get("user_profile", {})
    matched = state.get("matched_job", {})

    # If matched_job was already provided in state, preserve/augment it
    if not matched or not matched.get("title"):
        matched = {
            "title": "Junior Data Scientist & AI Developer",
            "company": "TechCorp Solutions",
            "proposed_rate": 25,
            "contract_snippet": [
                "Employee agrees to a 2-year non-compete clause post-engagement.",
                "Payment is net-90 days upon invoice receipt.",
                "All intellectual property developed during off-hours remains company property."
            ]
        }

    clauses = matched.get("contract_snippet", [])
    if isinstance(clauses, str):
        clauses = [c.strip() for c in clauses.split("\n") if c.strip()]

    log_msg = f"Agent: Matched job '{matched.get('title')}' at {matched.get('company')} @ ${matched.get('proposed_rate')}/hr."

    return {
        "matched_job": matched,
        "contract_clauses": clauses,
        "log": [log_msg]
    }

def review_contract_node(state: EquiGigState) -> Dict[str, Any]:
    """
    Node 3: Scans contract clauses for exploitative or underpaid terms.
    """
    job = state.get("matched_job", {})
    clauses = state.get("contract_clauses", [])
    profile = state.get("user_profile", {})
    min_rate = profile.get("min_hourly_rate", 30)

    issues = []
    proposed_rate = job.get("proposed_rate", 0)

    if proposed_rate < min_rate:
        issues.append(f"Underpaid: Proposed ${proposed_rate}/hr is below worker minimum of ${min_rate}/hr.")

    for clause in clauses:
        clause_lower = clause.lower()
        if "non-compete" in clause_lower:
            issues.append("Exploitative Clause: Restrictive non-compete detected.")
        if "net-90" in clause_lower or "90 days" in clause_lower:
            issues.append("Unfair Payment Terms: Delayed Net-90 payment schedule.")
        if "off-hours" in clause_lower or "all intellectual property" in clause_lower:
            issues.append("Overreaching IP Rights: Broad off-hours IP assignment clause.")

    status_msg = f"Agent: Contract review complete. {len(issues)} issue(s) identified."

    # Query Endee.io Vector DB for RAG insights & rate benchmarks
    skills = profile.get("skills", [])
    title = job.get("title", "Developer")
    endee_rag = query_endee_contract_rag(title, skills, proposed_rate)
    
    endee_log = f"Endee.io Vector RAG: Matched '{endee_rag.get('role_category')}' (Similarity: {int(endee_rag.get('similarity_score', 0.9)*100)}%). Market Avg: ${endee_rag.get('market_avg_rate')}/hr."

    return {
        "identified_issues": issues,
        "endee_rag_insights": endee_rag,
        "log": [status_msg, endee_log]
    }

def negotiate_terms_node(state: EquiGigState) -> Dict[str, Any]:
    """
    Node 4: Automated negotiation engine to counter exploitative terms.
    """
    job = state.get("matched_job", {}).copy()
    profile = state.get("user_profile", {})
    issues = state.get("identified_issues", [])
    min_rate = profile.get("min_hourly_rate", 30)

    target_rate = max(min_rate + 5, int(job.get("proposed_rate", 25) * 1.35))
    original_rate = job.get("proposed_rate", 25)

    job["proposed_rate"] = target_rate
    
    # Revised clauses after negotiation
    revised_snippets = []
    for clause in job.get("contract_snippet", []):
        if "non-compete" in clause.lower():
            revised_snippets.append("STRIKEN: Non-compete clause removed.")
        elif "net-90" in clause.lower():
            revised_snippets.append("REVISED: Payment schedule updated to Net-15 days.")
        elif "off-hours" in clause.lower():
            revised_snippets.append("REVISED: IP assignment restricted exclusively to project work hours.")
        else:
            revised_snippets.append(clause)
    
    job["contract_snippet"] = revised_snippets

    neg_log = (
        f"Agent: Autonomous negotiation successful! Adjusted rate from ${original_rate}/hr to ${target_rate}/hr. "
        f"Resolved {len(issues)} issue(s) in contract clauses."
    )

    return {
        "matched_job": job,
        "identified_issues": [],
        "negotiation_status": "Successful Negotiation",
        "log": [neg_log]
    }

def draft_email_reply_node(state: EquiGigState) -> Dict[str, Any]:
    """
    Node 5: Drafts a professional email reply to the client based on negotiation outcome.
    """
    job = state.get("matched_job", {})
    profile = state.get("user_profile", {})
    status = state.get("negotiation_status", "")
    
    worker_name = profile.get("name", "Gig Worker")
    company = job.get("company", "the company")
    job_title = job.get("title", "the role")
    rate = job.get("proposed_rate", "TBD")
    
    if status == "Successful Negotiation":
        subject = f"Counter-Proposal: {job_title} Engagement"
        body = (
            f"Dear Hiring Team at {company},\n\n"
            f"Thank you for offering me the {job_title} position. I am very excited about the opportunity to work with you.\n\n"
            f"After reviewing the contract terms, I would like to propose a few adjustments to better align with my standard rates and working conditions:\n"
            f"- Hourly Rate: I propose a revised rate of ${rate}/hr.\n"
            f"- Contract Clauses: I request that we remove any non-compete restrictions and adjust the payment schedule to Net-15 days for a smoother workflow.\n\n"
            f"I am confident that my skills will bring great value to {company}, and I look forward to reaching an agreement.\n\n"
            f"Best regards,\n"
            f"{worker_name}"
        )
    else:
        subject = f"Acceptance of Offer: {job_title}"
        body = (
            f"Dear Hiring Team at {company},\n\n"
            f"Thank you for the offer for the {job_title} position. The terms and the rate of ${rate}/hr look great.\n\n"
            f"I am excited to accept the offer and look forward to starting our collaboration!\n\n"
            f"Best regards,\n"
            f"{worker_name}"
        )

    log_msg = "Agent: Drafted auto-reply email to client."
    
    # Store contract in Endee.io Vector DB
    index_contract_vector(job, status)
    
    return {
        "drafted_email": f"Subject: {subject}\n\n{body}",
        "log": [log_msg, "Agent: Contract vector indexed into Endee.io Vector DB."]
    }

def should_negotiate(state: EquiGigState) -> str:
    return "negotiate" if state.get("identified_issues") else "finalize"

# --- Build LangGraph Workflow ---
workflow = StateGraph(EquiGigState)
workflow.add_node("analyze", analyze_profile_node)
workflow.add_node("search", search_jobs_node)
workflow.add_node("review", review_contract_node)
workflow.add_node("negotiate", negotiate_terms_node)
workflow.add_node("draft_email", draft_email_reply_node)

workflow.add_edge(START, "analyze")
workflow.add_edge("analyze", "search")
workflow.add_edge("search", "review")
workflow.add_conditional_edges("review", should_negotiate, {"negotiate": "negotiate", "finalize": "draft_email"})
workflow.add_edge("negotiate", "draft_email")
workflow.add_edge("draft_email", END)

app = workflow.compile()

def run_agent(user_profile: Optional[Dict[str, Any]] = None, custom_job: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Executes the EquiGig LangGraph workflow with given inputs.
    """
    default_profile = {"name": "Jane Doe", "skills": ["Python", "Machine Learning"], "min_hourly_rate": 30}
    profile = user_profile or default_profile
    
    initial_state: EquiGigState = {
        "user_profile": profile,
        "matched_job": custom_job or {},
        "contract_clauses": [],
        "identified_issues": [],
        "negotiation_status": "Pending Analysis",
        "drafted_email": "",
        "endee_rag_insights": {},
        "log": []
    }
    
    return app.invoke(initial_state)

if __name__ == "__main__":
    result = run_agent()
    print("\n--- EquiGig Agent Execution Trace ---")
    for entry in result["log"]:
        print(entry)
    print(f"\nFinal Negotiated Rate: ${result['matched_job']['proposed_rate']}/hr")
    print(f"Status: {result['negotiation_status']}")
    print(f"\n--- Auto-Drafted Email ---\n{result['drafted_email']}")