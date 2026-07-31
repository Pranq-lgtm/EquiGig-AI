# **EquiGig AI ⚖️🤖**

## **📖 About EquiGig AI**

**EquiGig AI** is an Agentic AI system built to champion **UN Sustainable Development Goal 8: Decent Work and Economic Growth**.

For freelancers, gig workers, and entry-level professionals, the modern job market is often fraught with exploitative contracts, underpaid labor, and wage theft. EquiGig acts as an autonomous digital union representative and career advocate. Powered by LangGraph, it proactively discovers high-quality work, leverages Natural Language Processing (NLP) to detect exploitative clauses in employment contracts, and autonomously negotiates fair compensation and terms on the user's behalf.

### **🌟 Core Features**

* **Semantic Job Matching:** Uses vector databases to align highly specific candidate skills with nuanced, high-value job requirements.  
* **Automated Contract Vetting:** Scans proposed employment contracts to flag exploitative terms (e.g., restrictive non-competes, delayed net-90 payments).  
* **Autonomous Negotiation:** Drafts counter-offers and negotiates directly via employer APIs or email drafts to secure a living wage and fair labor conditions.  
* **Stateful Memory:** Built on LangGraph to maintain context across the entire job search, review, and negotiation lifecycle.

## **🗂️ Repository Structure**

equigig-ai/  
│  
├── src/                        \# Main source code directory  
│   ├── backend/                \# Backend services and agent definitions
│   │   ├── endee\_service.py
│   │   ├── equigig\_langgraph\_agent.py
│   │   ├── requirements.txt    \# Python dependencies for backend
│   │   └── server.py           \# Entry point for the backend server
│   │  
│   └── frontend/               \# Frontend user interface
│       ├── .env.example        \# Example environment variables
│       ├── app.js
│       ├── index.html
│       └── styles.css
│  
├── .gitignore  
├── Dockerfile                  \# Docker configuration
├── LICENSE
└── README.md                   \# Project documentation

## **🚀 Getting Started**

### **Prerequisites**

* Python 3.10 or higher  
* API keys for your chosen LLM provider (e.g., OpenAI, Anthropic, Gemini)

### **Installation**

1. **Clone the repository:**  
   git clone https://github.com/yourusername/equigig-ai.git  
   cd equigig-ai

2. **Create and activate a virtual environment:**  
   python \-m venv venv  
   source venv/bin/activate  \# On Windows use \`venv\\Scripts\\activate\`

3. **Install dependencies:**  
   pip install \-r requirements.txt

4. **Environment Setup:**  
   Copy the example environment file and add your API keys:  
   cp .env.example .env

### **Usage**

To run a simulation of the EquiGig Agent locally:

python src/main.py

The console will output the agent's step-by-step reasoning logs, starting from profile analysis, moving to contract review, and finalizing with negotiation outcomes.

## **🤝 Contributing**

We welcome contributions from developers, labor rights advocates, and AI ethics researchers\! Please see our [CONTRIBUTING.md](http://docs.google.com/CONTRIBUTING.md) for guidelines on how to submit pull requests, report bugs, and suggest new features to help protect gig workers globally.

## **📄 License**

This project is licensed under the MIT License \- see the [LICENSE](http://docs.google.com/LICENSE) file for details.