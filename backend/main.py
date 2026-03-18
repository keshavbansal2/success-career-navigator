import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import anthropic

load_dotenv()

app = FastAPI(title="Career Navigator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


class AnalyzeRequest(BaseModel):
    resume_text: str
    target_role: str
    github_url: Optional[str] = None
    name: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None


class InterviewRequest(BaseModel):
    resume_text: str
    target_role: str
    skill_gaps: Optional[list] = None


MOCK_ANALYSIS = {
    "readiness_score": 62,
    "current_skills": ["Python", "Linux", "Git", "SQL", "Bash scripting", "Docker basics"],
    "required_skills": {
        "critical": ["AWS/GCP/Azure", "Kubernetes", "Terraform", "CI/CD pipelines", "Infrastructure as Code"],
        "important": ["Monitoring & Observability", "Networking fundamentals", "Security best practices", "Helm charts"],
        "nice_to_have": ["ArgoCD", "Service Mesh (Istio)", "FinOps", "Multi-cloud architecture"]
    },
    "skill_gaps": {
        "critical": ["Kubernetes", "Terraform", "AWS certifications", "CI/CD (GitHub Actions/Jenkins)"],
        "important": ["Prometheus/Grafana", "VPC/Subnet design", "IAM & Security", "Helm"],
        "nice_to_have": ["ArgoCD", "Istio", "Cost optimization"]
    },
    "roadmap": [
        {
            "phase": "Phase 1: Foundation (Weeks 1-2)",
            "skills_to_learn": ["AWS Core Services", "Linux deep dive", "Networking basics"],
            "resources": [
                {"title": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/", "type": "free", "time": "6 hours", "platform": "AWS Training"},
                {"title": "Linux Command Line Crash Course", "url": "https://www.youtube.com/watch?v=ZtqBQ68cfJc", "type": "free", "time": "5 hours", "platform": "YouTube"},
                {"title": "Networking Fundamentals", "url": "https://www.coursera.org/learn/computer-networking", "type": "free", "time": "8 hours", "platform": "Coursera"}
            ]
        },
        {
            "phase": "Phase 2: Core Cloud Skills (Month 1)",
            "skills_to_learn": ["AWS EC2, S3, RDS, VPC", "Terraform basics", "Docker advanced"],
            "resources": [
                {"title": "HashiCorp Terraform Associate Course", "url": "https://www.youtube.com/watch?v=SLB_c_ayRMo", "type": "free", "time": "13 hours", "platform": "YouTube"},
                {"title": "AWS Solutions Architect - Associate (SAA-C03)", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", "type": "paid", "time": "27 hours", "platform": "Udemy"},
                {"title": "Docker & Kubernetes: The Practical Guide", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", "type": "paid", "time": "23 hours", "platform": "Udemy"}
            ]
        },
        {
            "phase": "Phase 3: Kubernetes & CI/CD (Month 2)",
            "skills_to_learn": ["Kubernetes deployments", "GitHub Actions", "Helm charts"],
            "resources": [
                {"title": "Kubernetes for Beginners", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "type": "free", "time": "7 hours", "platform": "YouTube"},
                {"title": "GitHub Actions - Complete Guide", "url": "https://www.youtube.com/watch?v=R8_veQiYBjI", "type": "free", "time": "4 hours", "platform": "YouTube"},
                {"title": "Helm - The Kubernetes Package Manager", "url": "https://helm.sh/docs/", "type": "free", "time": "5 hours", "platform": "Official Docs"}
            ]
        },
        {
            "phase": "Phase 4: Observability & Advanced (Month 3)",
            "skills_to_learn": ["Prometheus & Grafana", "Log management (ELK)", "Security & IAM"],
            "resources": [
                {"title": "Prometheus & Grafana Tutorial", "url": "https://www.youtube.com/watch?v=h4Sl21AKiDg", "type": "free", "time": "6 hours", "platform": "YouTube"},
                {"title": "AWS Security Specialty prep", "url": "https://www.coursera.org/learn/aws-fundamentals-going-cloud-native", "type": "free", "time": "8 hours", "platform": "Coursera"},
                {"title": "Build a complete DevOps project on GitHub", "url": "https://github.com/topics/devops-project", "type": "free", "time": "20 hours", "platform": "GitHub"}
            ]
        }
    ],
    "summary": "You have a solid programming foundation with Python and some DevOps exposure. The primary gaps are in cloud infrastructure (AWS/GCP), container orchestration (Kubernetes), and Infrastructure as Code (Terraform). Focus on getting AWS certified first, then build hands-on Kubernetes projects. Your Python skills will be a major asset for automation and scripting tasks in a Cloud Engineer role."
}

MOCK_INTERVIEW_QUESTIONS = {
    "questions": [
        {"category": "Cloud Infrastructure", "difficulty": "Medium", "question": "Explain the difference between vertical and horizontal scaling. When would you choose each approach?", "hint": "Think about stateful vs stateless applications, cost implications, and the CAP theorem."},
        {"category": "Kubernetes", "difficulty": "Hard", "question": "Walk me through how you would set up a highly available Kubernetes cluster and what happens when a node fails.", "hint": "Discuss control plane HA, etcd quorum, kubelet behavior, pod scheduling, and PodDisruptionBudgets."},
        {"category": "Terraform", "difficulty": "Medium", "question": "What is Terraform state, why is it important, and how do you manage it in a team environment?", "hint": "Remote state backends (S3 + DynamoDB), state locking, workspace strategies."},
        {"category": "CI/CD", "difficulty": "Easy", "question": "Describe a CI/CD pipeline you would design for a microservices application deploying to Kubernetes.", "hint": "Code push -> lint/test -> build Docker image -> push to registry -> update Helm chart -> deploy to staging -> prod."},
        {"category": "Networking", "difficulty": "Medium", "question": "Explain how you would design a VPC for a three-tier web application with proper security.", "hint": "Public/private subnets, NAT gateway, security groups vs NACLs, bastion hosts or SSM."},
        {"category": "Security", "difficulty": "Hard", "question": "How would you implement least-privilege access for a microservices architecture on AWS?", "hint": "IAM roles per service, IRSA for Kubernetes, Secrets Manager, VPC endpoints, service-to-service auth."},
        {"category": "Troubleshooting", "difficulty": "Medium", "question": "A pod is in CrashLoopBackOff state. Walk me through your debugging process.", "hint": "kubectl logs, describe pod, events, resource limits, liveness/readiness probes, image issues."},
        {"category": "Behavioral", "difficulty": "Easy", "question": "Describe a time you had to migrate a legacy system to cloud infrastructure. What challenges did you face?", "hint": "Focus on planning, risk mitigation, testing strategy, rollback plan, and stakeholder communication."}
    ]
}


def extract_json_from_text(text: str) -> dict:
    """Try to extract JSON from Claude's response, handling markdown code blocks."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding a JSON object in the text
    obj_match = re.search(r'\{[\s\S]*\}', text)
    if obj_match:
        try:
            return json.loads(obj_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from response")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Career Navigator API is running"}


@app.post("/api/analyze")
async def analyze_profile(request: AnalyzeRequest):
    if not ANTHROPIC_API_KEY:
        return MOCK_ANALYSIS

    profile_text = request.resume_text
    if request.name:
        profile_text = f"Name: {request.name}\n{profile_text}"
    if request.education:
        profile_text += f"\nEducation: {request.education}"
    if request.experience:
        profile_text += f"\nExperience: {request.experience}"
    if request.github_url:
        profile_text += f"\nGitHub: {request.github_url}"

    prompt = f"""You are an expert career advisor and technical recruiter. Analyze the following candidate profile and provide a detailed gap analysis for their target role.

CANDIDATE PROFILE:
{profile_text}

TARGET ROLE: {request.target_role}

Analyze the candidate's skills against what is typically required for a {request.target_role} position at a mid-level company.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{{
  "readiness_score": <integer 0-100 representing how ready the candidate is for the target role>,
  "current_skills": [<list of skills the candidate currently has, extracted from their profile>],
  "required_skills": {{
    "critical": [<skills that are absolutely essential for this role>],
    "important": [<skills that are highly valued but not blocking>],
    "nice_to_have": [<skills that would differentiate the candidate>]
  }},
  "skill_gaps": {{
    "critical": [<critical required skills the candidate is missing>],
    "important": [<important skills the candidate is missing>],
    "nice_to_have": [<nice-to-have skills the candidate is missing>]
  }},
  "roadmap": [
    {{
      "phase": "<Phase name with timeline, e.g. 'Phase 1: Foundation (Weeks 1-2)'>",
      "skills_to_learn": [<2-4 specific skills to focus on in this phase>],
      "resources": [
        {{
          "title": "<specific course/resource name>",
          "url": "<real, working URL>",
          "type": "free or paid",
          "time": "<estimated time like '6 hours' or '2 weeks'>",
          "platform": "<platform name like Coursera, YouTube, Udemy, Official Docs>"
        }}
      ]
    }}
  ],
  "summary": "<2-3 sentence personalized summary of the candidate's situation and top priorities>"
}}

Provide 3-4 roadmap phases covering a 3-month learning plan. Each phase should have 2-4 resources with real URLs. Be specific and practical. Return only the JSON object."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text
        return extract_json_from_text(response_text)
    except Exception as e:
        print(f"Claude API error: {e}")
        return MOCK_ANALYSIS


@app.post("/api/interview-questions")
async def get_interview_questions(request: InterviewRequest):
    if not ANTHROPIC_API_KEY:
        return MOCK_INTERVIEW_QUESTIONS

    gaps_text = ""
    if request.skill_gaps:
        gaps_text = f"\nKey skill gaps to focus on: {', '.join(request.skill_gaps)}"

    prompt = f"""You are an expert technical interviewer. Generate realistic mock interview questions for a candidate preparing for a {request.target_role} role.

CANDIDATE PROFILE:
{request.resume_text}
{gaps_text}

Generate 8-10 interview questions that are highly relevant to the {request.target_role} role. Include a mix of:
- Technical deep-dive questions specific to the role
- System design questions
- Troubleshooting/debugging scenarios
- Behavioral questions (1-2 max)

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{{
  "questions": [
    {{
      "category": "<category like 'System Design', 'Technical', 'Troubleshooting', 'Behavioral', or specific technology>",
      "difficulty": "Easy, Medium, or Hard",
      "question": "<the full interview question>",
      "hint": "<a helpful hint or key concepts to cover in the answer, 1-2 sentences>"
    }}
  ]
}}

Make the questions realistic, specific to {request.target_role}, and progressively challenging. Return only the JSON object."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text
        return extract_json_from_text(response_text)
    except Exception as e:
        print(f"Claude API error: {e}")
        return MOCK_INTERVIEW_QUESTIONS
