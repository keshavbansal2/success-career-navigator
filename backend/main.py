import os
import json
import re
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from dotenv import load_dotenv
import anthropic

from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt

load_dotenv()

app = FastAPI(title="Career Navigator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5176"],
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

    @field_validator("target_role")
    @classmethod
    def target_role_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Target role cannot be empty.")
        if len(v) < 2:
            raise ValueError("Target role must be at least 2 characters.")
        if len(v) > 100:
            raise ValueError("Target role must be 100 characters or fewer.")
        return v

    @field_validator("resume_text")
    @classmethod
    def resume_text_min_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError(
                "Profile text is too short (minimum 10 characters). "
                "Please describe your skills, experience, or education."
            )
        return v


class InterviewRequest(BaseModel):
    resume_text: str
    target_role: str
    skill_gaps: Optional[list] = None

    @field_validator("target_role")
    @classmethod
    def target_role_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Target role cannot be empty.")
        return v

    @field_validator("resume_text")
    @classmethod
    def resume_text_min_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Profile text must be at least 10 characters.")
        return v


# ---------------------------------------------------------------------------
# Role skill database for local scoring (used when no API key is available)
# ---------------------------------------------------------------------------

ROLE_SKILLS_DB = {
    "cloud engineer": {
        "critical": [
            {"name": "AWS/GCP/Azure", "keywords": ["aws", "gcp", "azure", "cloud", "ec2", "s3", "lambda", "cloudformation", "cloud computing"]},
            {"name": "Kubernetes", "keywords": ["kubernetes", "k8s", "kubectl", "eks", "aks", "gke", "container orchestration"]},
            {"name": "Terraform/IaC", "keywords": ["terraform", "infrastructure as code", "iac", "pulumi", "cloudformation", "ansible", "chef", "puppet"]},
            {"name": "CI/CD Pipelines", "keywords": ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "circleci", "travis", "pipeline", "continuous integration", "continuous delivery", "continuous deployment"]},
            {"name": "Docker/Containers", "keywords": ["docker", "container", "dockerfile", "docker-compose", "podman", "containerd"]},
        ],
        "important": [
            {"name": "Monitoring & Observability", "keywords": ["prometheus", "grafana", "datadog", "monitoring", "observability", "cloudwatch", "new relic", "splunk", "elk", "logging"]},
            {"name": "Networking", "keywords": ["networking", "vpc", "subnet", "dns", "load balancer", "tcp", "http", "ssl", "tls", "firewall", "cdn", "route53"]},
            {"name": "Security & IAM", "keywords": ["iam", "security", "rbac", "oauth", "ssl", "tls", "encryption", "vault", "secrets", "zero trust"]},
            {"name": "Linux Administration", "keywords": ["linux", "bash", "shell", "systemd", "ssh", "centos", "ubuntu", "redhat", "sysadmin"]},
        ],
        "nice_to_have": [
            {"name": "ArgoCD/GitOps", "keywords": ["argocd", "gitops", "flux"]},
            {"name": "Service Mesh", "keywords": ["istio", "service mesh", "envoy", "linkerd"]},
            {"name": "FinOps", "keywords": ["finops", "cost optimization", "cost management", "cloud cost"]},
            {"name": "Helm", "keywords": ["helm", "helm chart"]},
        ],
    },
    "frontend developer": {
        "critical": [
            {"name": "JavaScript/TypeScript", "keywords": ["javascript", "typescript", "js", "ts", "es6", "ecmascript"]},
            {"name": "React/Vue/Angular", "keywords": ["react", "reactjs", "vue", "vuejs", "angular", "next.js", "nextjs", "nuxt", "svelte"]},
            {"name": "HTML/CSS", "keywords": ["html", "css", "sass", "scss", "less", "tailwind", "bootstrap", "styled-components"]},
            {"name": "Responsive Design", "keywords": ["responsive", "mobile-first", "media queries", "flexbox", "grid", "responsive design"]},
            {"name": "Git/Version Control", "keywords": ["git", "github", "gitlab", "version control", "bitbucket"]},
        ],
        "important": [
            {"name": "Testing", "keywords": ["jest", "cypress", "testing", "unit test", "e2e", "playwright", "vitest", "react testing library", "enzyme"]},
            {"name": "State Management", "keywords": ["redux", "zustand", "mobx", "state management", "context api", "recoil", "pinia", "vuex"]},
            {"name": "REST/GraphQL APIs", "keywords": ["rest", "api", "graphql", "fetch", "axios", "apollo", "react query", "tanstack"]},
            {"name": "Build Tools", "keywords": ["webpack", "vite", "rollup", "esbuild", "babel", "bundler", "npm", "yarn", "pnpm"]},
        ],
        "nice_to_have": [
            {"name": "Performance Optimization", "keywords": ["performance", "lighthouse", "web vitals", "lazy loading", "code splitting", "caching"]},
            {"name": "Accessibility (a11y)", "keywords": ["accessibility", "a11y", "aria", "screen reader", "wcag"]},
            {"name": "Animation/Motion", "keywords": ["animation", "framer motion", "gsap", "css animation", "lottie"]},
            {"name": "SSR/SSG", "keywords": ["ssr", "ssg", "server side rendering", "static site", "next.js", "nuxt", "gatsby"]},
        ],
    },
    "backend developer": {
        "critical": [
            {"name": "Server-side Language", "keywords": ["python", "java", "go", "golang", "node.js", "nodejs", "c#", "csharp", "ruby", "rust", "php", "scala", "kotlin"]},
            {"name": "Databases", "keywords": ["sql", "postgresql", "postgres", "mysql", "mongodb", "database", "redis", "dynamodb", "cassandra", "sqlite", "oracle", "mariadb"]},
            {"name": "REST API Design", "keywords": ["rest", "api", "restful", "endpoint", "fastapi", "express", "flask", "django", "spring", "gin", "echo"]},
            {"name": "Authentication/Authorization", "keywords": ["auth", "jwt", "oauth", "session", "authentication", "authorization", "passport", "bcrypt"]},
            {"name": "Git/Version Control", "keywords": ["git", "github", "gitlab", "version control", "bitbucket"]},
        ],
        "important": [
            {"name": "Testing", "keywords": ["testing", "unit test", "pytest", "junit", "mocha", "integration test", "tdd", "bdd"]},
            {"name": "Docker/Containers", "keywords": ["docker", "container", "dockerfile", "docker-compose", "podman"]},
            {"name": "Message Queues", "keywords": ["kafka", "rabbitmq", "sqs", "message queue", "pub/sub", "redis", "celery", "bull"]},
            {"name": "Caching", "keywords": ["redis", "memcached", "caching", "cache", "cdn"]},
        ],
        "nice_to_have": [
            {"name": "GraphQL", "keywords": ["graphql", "apollo", "hasura"]},
            {"name": "Microservices", "keywords": ["microservice", "service mesh", "grpc", "protobuf"]},
            {"name": "Cloud Services", "keywords": ["aws", "gcp", "azure", "cloud", "lambda", "serverless"]},
            {"name": "CI/CD", "keywords": ["ci/cd", "jenkins", "github actions", "gitlab ci", "pipeline"]},
        ],
    },
    "data scientist": {
        "critical": [
            {"name": "Python", "keywords": ["python"]},
            {"name": "Machine Learning", "keywords": ["machine learning", "ml", "scikit-learn", "sklearn", "xgboost", "random forest", "classification", "regression", "clustering"]},
            {"name": "Statistics & Math", "keywords": ["statistics", "probability", "linear algebra", "calculus", "hypothesis testing", "regression", "statistical"]},
            {"name": "Data Analysis", "keywords": ["pandas", "numpy", "data analysis", "eda", "exploratory", "data wrangling", "data cleaning"]},
            {"name": "Data Visualization", "keywords": ["matplotlib", "seaborn", "plotly", "tableau", "power bi", "visualization", "dashboard"]},
        ],
        "important": [
            {"name": "Deep Learning", "keywords": ["deep learning", "neural network", "tensorflow", "pytorch", "keras", "cnn", "rnn", "transformer", "nlp"]},
            {"name": "SQL", "keywords": ["sql", "postgresql", "mysql", "query", "database"]},
            {"name": "Big Data Tools", "keywords": ["spark", "hadoop", "hive", "airflow", "dbt", "big data", "data pipeline", "etl"]},
            {"name": "Feature Engineering", "keywords": ["feature engineering", "feature selection", "dimensionality reduction", "pca"]},
        ],
        "nice_to_have": [
            {"name": "MLOps", "keywords": ["mlops", "mlflow", "kubeflow", "model deployment", "model serving", "sagemaker"]},
            {"name": "Cloud Platforms", "keywords": ["aws", "gcp", "azure", "cloud", "sagemaker", "vertex ai"]},
            {"name": "A/B Testing", "keywords": ["a/b testing", "experimentation", "causal inference"]},
            {"name": "LLMs/GenAI", "keywords": ["llm", "gpt", "langchain", "generative ai", "prompt engineering", "rag", "fine-tuning"]},
        ],
    },
    "devops engineer": {
        "critical": [
            {"name": "CI/CD Pipelines", "keywords": ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "circleci", "pipeline", "continuous integration", "continuous delivery"]},
            {"name": "Docker/Containers", "keywords": ["docker", "container", "dockerfile", "docker-compose", "podman", "containerd"]},
            {"name": "Cloud Platforms", "keywords": ["aws", "gcp", "azure", "cloud", "ec2", "s3", "lambda"]},
            {"name": "Infrastructure as Code", "keywords": ["terraform", "iac", "ansible", "puppet", "chef", "cloudformation", "pulumi"]},
            {"name": "Linux/Shell Scripting", "keywords": ["linux", "bash", "shell", "scripting", "systemd", "ssh"]},
        ],
        "important": [
            {"name": "Kubernetes", "keywords": ["kubernetes", "k8s", "kubectl", "eks", "aks", "gke", "helm"]},
            {"name": "Monitoring/Logging", "keywords": ["prometheus", "grafana", "elk", "datadog", "monitoring", "logging", "alerting", "cloudwatch"]},
            {"name": "Networking", "keywords": ["networking", "dns", "load balancer", "vpc", "proxy", "nginx", "haproxy"]},
            {"name": "Security", "keywords": ["security", "iam", "vault", "secrets", "ssl", "tls", "scanning"]},
        ],
        "nice_to_have": [
            {"name": "GitOps", "keywords": ["argocd", "gitops", "flux"]},
            {"name": "Service Mesh", "keywords": ["istio", "linkerd", "envoy", "service mesh"]},
            {"name": "Python/Go Scripting", "keywords": ["python", "go", "golang", "automation"]},
            {"name": "Chaos Engineering", "keywords": ["chaos", "chaos engineering", "litmus", "gremlin"]},
        ],
    },
    "full stack developer": {
        "critical": [
            {"name": "Frontend Framework", "keywords": ["react", "vue", "angular", "next.js", "nextjs", "svelte", "nuxt"]},
            {"name": "JavaScript/TypeScript", "keywords": ["javascript", "typescript", "js", "ts", "es6"]},
            {"name": "Backend Language/Framework", "keywords": ["node.js", "nodejs", "express", "python", "django", "flask", "fastapi", "java", "spring", "ruby", "rails", "go", "php", "laravel"]},
            {"name": "Databases", "keywords": ["sql", "postgresql", "mysql", "mongodb", "database", "redis", "orm", "prisma", "sequelize"]},
            {"name": "Git/Version Control", "keywords": ["git", "github", "gitlab", "version control"]},
        ],
        "important": [
            {"name": "REST/GraphQL APIs", "keywords": ["rest", "api", "graphql", "fetch", "axios"]},
            {"name": "HTML/CSS", "keywords": ["html", "css", "sass", "tailwind", "bootstrap", "responsive"]},
            {"name": "Authentication", "keywords": ["auth", "jwt", "oauth", "session", "passport"]},
            {"name": "Testing", "keywords": ["testing", "jest", "pytest", "cypress", "unit test", "e2e"]},
        ],
        "nice_to_have": [
            {"name": "Docker", "keywords": ["docker", "container", "docker-compose"]},
            {"name": "Cloud/Deployment", "keywords": ["aws", "vercel", "netlify", "heroku", "cloud", "deployment"]},
            {"name": "CI/CD", "keywords": ["ci/cd", "github actions", "pipeline"]},
            {"name": "WebSockets/Real-time", "keywords": ["websocket", "socket.io", "real-time", "sse"]},
        ],
    },
    "mobile developer": {
        "critical": [
            {"name": "Mobile Framework", "keywords": ["react native", "flutter", "swift", "kotlin", "swiftui", "jetpack compose", "ios", "android"]},
            {"name": "UI/UX Implementation", "keywords": ["ui", "ux", "layout", "animation", "navigation", "responsive", "material design", "human interface"]},
            {"name": "State Management", "keywords": ["redux", "provider", "bloc", "riverpod", "mobx", "state management", "getx"]},
            {"name": "API Integration", "keywords": ["rest", "api", "graphql", "http", "networking", "json", "retrofit", "alamofire"]},
            {"name": "Git/Version Control", "keywords": ["git", "github", "gitlab", "version control"]},
        ],
        "important": [
            {"name": "Testing", "keywords": ["testing", "unit test", "widget test", "xctest", "espresso", "detox"]},
            {"name": "Local Storage", "keywords": ["sqlite", "realm", "core data", "room", "async storage", "hive", "shared preferences"]},
            {"name": "Push Notifications", "keywords": ["push notification", "firebase", "fcm", "apns"]},
            {"name": "App Store Deployment", "keywords": ["app store", "play store", "testflight", "fastlane", "code signing"]},
        ],
        "nice_to_have": [
            {"name": "CI/CD for Mobile", "keywords": ["fastlane", "bitrise", "codemagic", "github actions", "ci/cd"]},
            {"name": "Performance Profiling", "keywords": ["performance", "profiling", "memory leak", "instruments", "android profiler"]},
            {"name": "Offline Support", "keywords": ["offline", "sync", "cache", "background"]},
            {"name": "Analytics", "keywords": ["analytics", "firebase analytics", "mixpanel", "amplitude"]},
        ],
    },
    "data engineer": {
        "critical": [
            {"name": "SQL", "keywords": ["sql", "postgresql", "mysql", "query", "database", "data modeling"]},
            {"name": "Python", "keywords": ["python", "pyspark"]},
            {"name": "ETL/Data Pipelines", "keywords": ["etl", "elt", "pipeline", "data pipeline", "airflow", "luigi", "prefect", "dagster"]},
            {"name": "Big Data Technologies", "keywords": ["spark", "hadoop", "hive", "kafka", "flink", "big data", "distributed"]},
            {"name": "Cloud Data Services", "keywords": ["aws", "gcp", "azure", "redshift", "bigquery", "snowflake", "databricks", "s3", "glue"]},
        ],
        "important": [
            {"name": "Data Warehousing", "keywords": ["data warehouse", "dimensional modeling", "star schema", "snowflake schema", "redshift", "bigquery", "snowflake"]},
            {"name": "Streaming Data", "keywords": ["kafka", "kinesis", "streaming", "real-time", "flink", "spark streaming"]},
            {"name": "Docker/Containers", "keywords": ["docker", "container", "kubernetes"]},
            {"name": "dbt", "keywords": ["dbt", "data build tool", "data transformation"]},
        ],
        "nice_to_have": [
            {"name": "Data Governance", "keywords": ["data governance", "data quality", "data catalog", "lineage", "metadata"]},
            {"name": "CI/CD", "keywords": ["ci/cd", "github actions", "jenkins", "pipeline"]},
            {"name": "Terraform/IaC", "keywords": ["terraform", "iac", "infrastructure"]},
            {"name": "Machine Learning Pipelines", "keywords": ["mlops", "feature store", "ml pipeline", "sagemaker", "vertex"]},
        ],
    },
    "cybersecurity analyst": {
        "critical": [
            {"name": "Network Security", "keywords": ["network security", "firewall", "ids", "ips", "vpn", "networking", "tcp/ip", "wireshark", "packet analysis"]},
            {"name": "Security Operations", "keywords": ["soc", "siem", "security operations", "incident response", "threat detection", "splunk", "qradar"]},
            {"name": "Vulnerability Management", "keywords": ["vulnerability", "penetration testing", "pentest", "nessus", "qualys", "burp suite", "scanning", "owasp"]},
            {"name": "OS Security", "keywords": ["linux", "windows", "hardening", "active directory", "group policy", "endpoint"]},
            {"name": "Security Fundamentals", "keywords": ["cia triad", "encryption", "cryptography", "authentication", "authorization", "risk", "compliance"]},
        ],
        "important": [
            {"name": "Cloud Security", "keywords": ["cloud security", "aws security", "azure security", "iam", "security groups", "cloud"]},
            {"name": "Scripting", "keywords": ["python", "bash", "powershell", "scripting", "automation"]},
            {"name": "Forensics", "keywords": ["forensics", "digital forensics", "malware analysis", "reverse engineering", "memory analysis"]},
            {"name": "Compliance & Frameworks", "keywords": ["nist", "iso 27001", "soc 2", "gdpr", "hipaa", "pci", "compliance", "framework"]},
        ],
        "nice_to_have": [
            {"name": "Threat Intelligence", "keywords": ["threat intelligence", "threat hunting", "ioc", "mitre att&ck", "ttps"]},
            {"name": "DevSecOps", "keywords": ["devsecops", "sast", "dast", "security pipeline", "shift left"]},
            {"name": "Certifications", "keywords": ["cissp", "ceh", "comptia security+", "oscp", "certified"]},
            {"name": "Zero Trust", "keywords": ["zero trust", "microsegmentation", "identity-based"]},
        ],
    },
    "machine learning engineer": {
        "critical": [
            {"name": "Python", "keywords": ["python"]},
            {"name": "ML Frameworks", "keywords": ["tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "jax"]},
            {"name": "Machine Learning", "keywords": ["machine learning", "ml", "classification", "regression", "clustering", "deep learning", "neural network"]},
            {"name": "Data Processing", "keywords": ["pandas", "numpy", "data processing", "feature engineering", "data pipeline"]},
            {"name": "Model Training & Evaluation", "keywords": ["training", "evaluation", "hyperparameter", "cross-validation", "overfitting", "model selection", "metrics"]},
        ],
        "important": [
            {"name": "MLOps/Deployment", "keywords": ["mlops", "mlflow", "model deployment", "serving", "docker", "kubernetes", "sagemaker", "vertex ai"]},
            {"name": "Cloud Platforms", "keywords": ["aws", "gcp", "azure", "cloud", "sagemaker", "vertex ai"]},
            {"name": "SQL & Databases", "keywords": ["sql", "database", "postgresql", "data warehouse"]},
            {"name": "Distributed Computing", "keywords": ["spark", "distributed", "ray", "dask", "gpu", "cuda"]},
        ],
        "nice_to_have": [
            {"name": "LLMs/GenAI", "keywords": ["llm", "gpt", "transformer", "langchain", "generative ai", "prompt engineering", "rag", "fine-tuning"]},
            {"name": "Computer Vision", "keywords": ["computer vision", "cv", "cnn", "object detection", "image", "yolo", "opencv"]},
            {"name": "NLP", "keywords": ["nlp", "natural language", "bert", "tokenization", "text classification", "sentiment"]},
            {"name": "A/B Testing", "keywords": ["a/b testing", "experimentation", "statistical testing"]},
        ],
    },
    "product manager": {
        "critical": [
            {"name": "Product Strategy", "keywords": ["product strategy", "roadmap", "vision", "product management", "product manager", "pm"]},
            {"name": "User Research", "keywords": ["user research", "user interview", "persona", "customer discovery", "usability", "user testing"]},
            {"name": "Data-Driven Decisions", "keywords": ["analytics", "data-driven", "metrics", "kpi", "okr", "a/b testing", "experiment"]},
            {"name": "Agile/Scrum", "keywords": ["agile", "scrum", "sprint", "backlog", "jira", "kanban", "product owner"]},
            {"name": "Stakeholder Management", "keywords": ["stakeholder", "cross-functional", "communication", "leadership", "presentation"]},
        ],
        "important": [
            {"name": "UX/Design Sense", "keywords": ["ux", "design", "wireframe", "prototype", "figma", "user experience"]},
            {"name": "Technical Literacy", "keywords": ["technical", "api", "sql", "engineering", "architecture", "system design"]},
            {"name": "Market Analysis", "keywords": ["market", "competitive analysis", "market research", "positioning", "go-to-market"]},
            {"name": "Prioritization Frameworks", "keywords": ["prioritization", "rice", "moscow", "impact", "effort", "trade-off"]},
        ],
        "nice_to_have": [
            {"name": "SQL/Data Skills", "keywords": ["sql", "python", "data analysis", "tableau", "looker"]},
            {"name": "Growth/Monetization", "keywords": ["growth", "monetization", "conversion", "funnel", "retention", "churn"]},
            {"name": "API/Platform Knowledge", "keywords": ["api", "platform", "integration", "developer experience"]},
            {"name": "AI/ML Understanding", "keywords": ["ai", "machine learning", "llm", "generative ai"]},
        ],
    },
    "ui/ux designer": {
        "critical": [
            {"name": "Design Tools", "keywords": ["figma", "sketch", "adobe xd", "invision", "design tool"]},
            {"name": "User Research", "keywords": ["user research", "usability testing", "interview", "persona", "journey map", "user testing"]},
            {"name": "Wireframing & Prototyping", "keywords": ["wireframe", "prototype", "mockup", "low-fidelity", "high-fidelity"]},
            {"name": "Visual Design", "keywords": ["visual design", "typography", "color theory", "layout", "design system", "ui design"]},
            {"name": "UX Principles", "keywords": ["ux", "user experience", "usability", "heuristic", "information architecture", "interaction design"]},
        ],
        "important": [
            {"name": "Design Systems", "keywords": ["design system", "component library", "style guide", "tokens", "atomic design"]},
            {"name": "Responsive Design", "keywords": ["responsive", "mobile", "adaptive", "breakpoint"]},
            {"name": "Accessibility", "keywords": ["accessibility", "a11y", "wcag", "aria", "inclusive design"]},
            {"name": "Collaboration", "keywords": ["agile", "scrum", "cross-functional", "handoff", "developer collaboration"]},
        ],
        "nice_to_have": [
            {"name": "HTML/CSS", "keywords": ["html", "css", "frontend", "code"]},
            {"name": "Motion Design", "keywords": ["animation", "motion", "micro-interaction", "lottie", "after effects"]},
            {"name": "Data Visualization", "keywords": ["data visualization", "chart", "dashboard", "infographic"]},
            {"name": "Analytics", "keywords": ["analytics", "hotjar", "fullstory", "heatmap", "a/b testing"]},
        ],
    },
}

# Resources database keyed by skill name (used for roadmap generation)
RESOURCES_DB = {
    "AWS/GCP/Azure": [
        {"title": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/", "type": "free", "time": "6 hours", "platform": "AWS Training"},
        {"title": "AWS Solutions Architect Associate", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", "type": "paid", "time": "27 hours", "platform": "Udemy"},
    ],
    "Kubernetes": [
        {"title": "Kubernetes for Beginners (TechWorld with Nana)", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "type": "free", "time": "7 hours", "platform": "YouTube"},
        {"title": "Kubernetes Docs - Tutorials", "url": "https://kubernetes.io/docs/tutorials/", "type": "free", "time": "10 hours", "platform": "Official Docs"},
    ],
    "Terraform/IaC": [
        {"title": "HashiCorp Terraform Associate Course", "url": "https://www.youtube.com/watch?v=SLB_c_ayRMo", "type": "free", "time": "13 hours", "platform": "YouTube"},
        {"title": "Terraform Up & Running (Book)", "url": "https://www.terraformupandrunning.com/", "type": "paid", "time": "20 hours", "platform": "Book"},
    ],
    "CI/CD Pipelines": [
        {"title": "GitHub Actions - Complete Guide", "url": "https://www.youtube.com/watch?v=R8_veQiYBjI", "type": "free", "time": "4 hours", "platform": "YouTube"},
        {"title": "GitHub Actions Docs", "url": "https://docs.github.com/en/actions", "type": "free", "time": "5 hours", "platform": "Official Docs"},
    ],
    "Docker/Containers": [
        {"title": "Docker & Kubernetes: The Practical Guide", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", "type": "paid", "time": "23 hours", "platform": "Udemy"},
        {"title": "Docker Official Getting Started", "url": "https://docs.docker.com/get-started/", "type": "free", "time": "3 hours", "platform": "Official Docs"},
    ],
    "Monitoring & Observability": [
        {"title": "Prometheus & Grafana Tutorial", "url": "https://www.youtube.com/watch?v=h4Sl21AKiDg", "type": "free", "time": "6 hours", "platform": "YouTube"},
    ],
    "Networking": [
        {"title": "Networking Fundamentals", "url": "https://www.coursera.org/learn/computer-networking", "type": "free", "time": "8 hours", "platform": "Coursera"},
    ],
    "Security & IAM": [
        {"title": "AWS Security Fundamentals", "url": "https://www.coursera.org/learn/aws-fundamentals-going-cloud-native", "type": "free", "time": "8 hours", "platform": "Coursera"},
    ],
    "Linux Administration": [
        {"title": "Linux Command Line Crash Course", "url": "https://www.youtube.com/watch?v=ZtqBQ68cfJc", "type": "free", "time": "5 hours", "platform": "YouTube"},
    ],
    "JavaScript/TypeScript": [
        {"title": "The Modern JavaScript Tutorial", "url": "https://javascript.info/", "type": "free", "time": "40 hours", "platform": "javascript.info"},
        {"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/", "type": "free", "time": "10 hours", "platform": "Official Docs"},
    ],
    "React/Vue/Angular": [
        {"title": "React Official Tutorial", "url": "https://react.dev/learn", "type": "free", "time": "8 hours", "platform": "Official Docs"},
        {"title": "Full React Course (freeCodeCamp)", "url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "type": "free", "time": "12 hours", "platform": "YouTube"},
    ],
    "HTML/CSS": [
        {"title": "Responsive Web Design (freeCodeCamp)", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "type": "free", "time": "15 hours", "platform": "freeCodeCamp"},
    ],
    "Testing": [
        {"title": "Testing JavaScript (Kent C. Dodds)", "url": "https://testingjavascript.com/", "type": "paid", "time": "10 hours", "platform": "TestingJavaScript"},
    ],
    "Server-side Language": [
        {"title": "Python for Everybody", "url": "https://www.py4e.com/", "type": "free", "time": "20 hours", "platform": "py4e.com"},
    ],
    "Databases": [
        {"title": "SQL Tutorial (Mode Analytics)", "url": "https://mode.com/sql-tutorial/", "type": "free", "time": "10 hours", "platform": "Mode"},
        {"title": "MongoDB University", "url": "https://university.mongodb.com/", "type": "free", "time": "15 hours", "platform": "MongoDB University"},
    ],
    "REST API Design": [
        {"title": "RESTful API Design Guide", "url": "https://restfulapi.net/", "type": "free", "time": "3 hours", "platform": "restfulapi.net"},
    ],
    "Python": [
        {"title": "Python for Everybody", "url": "https://www.py4e.com/", "type": "free", "time": "20 hours", "platform": "py4e.com"},
        {"title": "Automate the Boring Stuff", "url": "https://automatetheboringstuff.com/", "type": "free", "time": "15 hours", "platform": "Book (Online)"},
    ],
    "Machine Learning": [
        {"title": "Machine Learning by Andrew Ng", "url": "https://www.coursera.org/learn/machine-learning", "type": "free", "time": "60 hours", "platform": "Coursera"},
        {"title": "Fast.ai Practical Deep Learning", "url": "https://course.fast.ai/", "type": "free", "time": "30 hours", "platform": "fast.ai"},
    ],
    "Statistics & Math": [
        {"title": "Khan Academy Statistics", "url": "https://www.khanacademy.org/math/statistics-probability", "type": "free", "time": "20 hours", "platform": "Khan Academy"},
    ],
    "Data Analysis": [
        {"title": "Pandas Documentation & Tutorials", "url": "https://pandas.pydata.org/docs/getting_started/tutorials.html", "type": "free", "time": "10 hours", "platform": "Official Docs"},
    ],
    "Data Visualization": [
        {"title": "Data Visualization with Python (Coursera)", "url": "https://www.coursera.org/learn/python-for-data-visualization", "type": "free", "time": "15 hours", "platform": "Coursera"},
    ],
    "Deep Learning": [
        {"title": "Deep Learning Specialization (Andrew Ng)", "url": "https://www.coursera.org/specializations/deep-learning", "type": "free", "time": "80 hours", "platform": "Coursera"},
    ],
    "SQL": [
        {"title": "SQL Tutorial (Mode Analytics)", "url": "https://mode.com/sql-tutorial/", "type": "free", "time": "10 hours", "platform": "Mode"},
    ],
    "ML Frameworks": [
        {"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "type": "free", "time": "15 hours", "platform": "Official Docs"},
    ],
    "Infrastructure as Code": [
        {"title": "HashiCorp Terraform Associate Course", "url": "https://www.youtube.com/watch?v=SLB_c_ayRMo", "type": "free", "time": "13 hours", "platform": "YouTube"},
    ],
    "Linux/Shell Scripting": [
        {"title": "Linux Command Line Crash Course", "url": "https://www.youtube.com/watch?v=ZtqBQ68cfJc", "type": "free", "time": "5 hours", "platform": "YouTube"},
        {"title": "Bash Scripting Tutorial", "url": "https://linuxconfig.org/bash-scripting-tutorial", "type": "free", "time": "5 hours", "platform": "LinuxConfig"},
    ],
    "Cloud Platforms": [
        {"title": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/", "type": "free", "time": "6 hours", "platform": "AWS Training"},
    ],
    "ETL/Data Pipelines": [
        {"title": "Apache Airflow Tutorial", "url": "https://airflow.apache.org/docs/apache-airflow/stable/tutorial/index.html", "type": "free", "time": "8 hours", "platform": "Official Docs"},
    ],
    "Big Data Technologies": [
        {"title": "PySpark Tutorial", "url": "https://spark.apache.org/docs/latest/api/python/getting_started/index.html", "type": "free", "time": "15 hours", "platform": "Official Docs"},
    ],
    "Cloud Data Services": [
        {"title": "Snowflake Hands-On Essentials", "url": "https://learn.snowflake.com/", "type": "free", "time": "8 hours", "platform": "Snowflake"},
    ],
    "Network Security": [
        {"title": "CompTIA Network+ Full Course", "url": "https://www.youtube.com/watch?v=qiQR5rTSshw", "type": "free", "time": "14 hours", "platform": "YouTube"},
    ],
    "Security Operations": [
        {"title": "SOC Analyst Training (TryHackMe)", "url": "https://tryhackme.com/path/outline/soclevel1", "type": "free", "time": "40 hours", "platform": "TryHackMe"},
    ],
    "Vulnerability Management": [
        {"title": "OWASP Top 10", "url": "https://owasp.org/www-project-top-ten/", "type": "free", "time": "5 hours", "platform": "OWASP"},
    ],
    "Security Fundamentals": [
        {"title": "CompTIA Security+ Full Course", "url": "https://www.youtube.com/watch?v=9Hd8QJmZQUc", "type": "free", "time": "12 hours", "platform": "YouTube"},
    ],
    "Frontend Framework": [
        {"title": "React Official Tutorial", "url": "https://react.dev/learn", "type": "free", "time": "8 hours", "platform": "Official Docs"},
    ],
    "Backend Language/Framework": [
        {"title": "Node.js Tutorial (freeCodeCamp)", "url": "https://www.youtube.com/watch?v=Oe421EPjeBE", "type": "free", "time": "8 hours", "platform": "YouTube"},
    ],
    "Authentication/Authorization": [
        {"title": "OAuth 2.0 Simplified", "url": "https://www.oauth.com/", "type": "free", "time": "4 hours", "platform": "oauth.com"},
    ],
    "State Management": [
        {"title": "Redux Toolkit Tutorial", "url": "https://redux-toolkit.js.org/tutorials/overview", "type": "free", "time": "5 hours", "platform": "Official Docs"},
    ],
    "REST/GraphQL APIs": [
        {"title": "GraphQL Official Tutorial", "url": "https://graphql.org/learn/", "type": "free", "time": "5 hours", "platform": "Official Docs"},
    ],
    "Mobile Framework": [
        {"title": "React Native Official Tutorial", "url": "https://reactnative.dev/docs/tutorial", "type": "free", "time": "10 hours", "platform": "Official Docs"},
        {"title": "Flutter Official Codelabs", "url": "https://docs.flutter.dev/get-started/codelab", "type": "free", "time": "8 hours", "platform": "Official Docs"},
    ],
    "Design Tools": [
        {"title": "Figma Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=FTFaQWZBqQ8", "type": "free", "time": "4 hours", "platform": "YouTube"},
    ],
    "User Research": [
        {"title": "UX Research Methods (NNGroup)", "url": "https://www.nngroup.com/articles/which-ux-research-methods/", "type": "free", "time": "3 hours", "platform": "NNGroup"},
    ],
    "Product Strategy": [
        {"title": "Product Management Course (Coursera)", "url": "https://www.coursera.org/learn/uva-darden-digital-product-management", "type": "free", "time": "12 hours", "platform": "Coursera"},
    ],
    "Agile/Scrum": [
        {"title": "Agile with Atlassian Jira", "url": "https://www.coursera.org/learn/agile-atlassian-jira", "type": "free", "time": "8 hours", "platform": "Coursera"},
    ],
    "Responsive Design": [
        {"title": "Responsive Web Design (freeCodeCamp)", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "type": "free", "time": "15 hours", "platform": "freeCodeCamp"},
    ],
    "Build Tools": [
        {"title": "Vite Documentation", "url": "https://vitejs.dev/guide/", "type": "free", "time": "3 hours", "platform": "Official Docs"},
    ],
    "Git/Version Control": [
        {"title": "Git & GitHub Crash Course", "url": "https://www.youtube.com/watch?v=RGOj5yH7evk", "type": "free", "time": "2 hours", "platform": "YouTube"},
    ],
    "Message Queues": [
        {"title": "RabbitMQ Tutorial", "url": "https://www.rabbitmq.com/tutorials", "type": "free", "time": "5 hours", "platform": "Official Docs"},
    ],
    "Caching": [
        {"title": "Redis University", "url": "https://university.redis.com/", "type": "free", "time": "8 hours", "platform": "Redis University"},
    ],
    "Monitoring/Logging": [
        {"title": "Prometheus & Grafana Tutorial", "url": "https://www.youtube.com/watch?v=h4Sl21AKiDg", "type": "free", "time": "6 hours", "platform": "YouTube"},
    ],
    "Helm": [
        {"title": "Helm - The Kubernetes Package Manager", "url": "https://helm.sh/docs/", "type": "free", "time": "5 hours", "platform": "Official Docs"},
    ],
    "ArgoCD/GitOps": [
        {"title": "ArgoCD Tutorial (TechWorld with Nana)", "url": "https://www.youtube.com/watch?v=MeU5_k9ssrs", "type": "free", "time": "3 hours", "platform": "YouTube"},
    ],
    "MLOps/Deployment": [
        {"title": "MLOps Zoomcamp", "url": "https://github.com/DataTalksClub/mlops-zoomcamp", "type": "free", "time": "30 hours", "platform": "DataTalksClub"},
    ],
    "Wireframing & Prototyping": [
        {"title": "Figma Prototyping Tutorial", "url": "https://help.figma.com/hc/en-us/articles/360040314193", "type": "free", "time": "3 hours", "platform": "Figma Docs"},
    ],
    "Visual Design": [
        {"title": "Design Principles (Coursera)", "url": "https://www.coursera.org/learn/fundamentals-of-graphic-design", "type": "free", "time": "10 hours", "platform": "Coursera"},
    ],
    "UX Principles": [
        {"title": "Don't Make Me Think (Book Summary)", "url": "https://www.nngroup.com/books/dont-make-me-think/", "type": "paid", "time": "4 hours", "platform": "Book"},
    ],
    "Data-Driven Decisions": [
        {"title": "Google Data Analytics Certificate", "url": "https://www.coursera.org/professional-certificates/google-data-analytics", "type": "free", "time": "20 hours", "platform": "Coursera"},
    ],
    "Stakeholder Management": [
        {"title": "Product Leadership (Mind the Product)", "url": "https://www.mindtheproduct.com/", "type": "free", "time": "5 hours", "platform": "Mind the Product"},
    ],
}


def _normalize(text: str) -> str:
    """Lowercase and strip text for matching."""
    return text.lower().strip()


def _find_best_role(target_role: str) -> dict | None:
    """Find the best matching role from our database using keyword matching."""
    target = _normalize(target_role)
    # Direct match
    for role_key, role_data in ROLE_SKILLS_DB.items():
        if role_key in target or target in role_key:
            return role_data
    # Keyword-based fallback
    role_keywords = {
        "cloud engineer": ["cloud", "aws", "azure", "gcp", "infrastructure"],
        "frontend developer": ["frontend", "front-end", "front end", "react", "vue", "angular", "ui developer"],
        "backend developer": ["backend", "back-end", "back end", "server", "api developer"],
        "data scientist": ["data scientist", "data science", "analytics"],
        "devops engineer": ["devops", "dev ops", "site reliability", "sre", "platform engineer"],
        "full stack developer": ["full stack", "fullstack", "full-stack"],
        "mobile developer": ["mobile", "ios", "android", "react native", "flutter"],
        "data engineer": ["data engineer", "data engineering", "etl", "data pipeline"],
        "cybersecurity analyst": ["cybersecurity", "cyber security", "security analyst", "infosec", "information security", "soc analyst"],
        "machine learning engineer": ["machine learning engineer", "ml engineer", "mle", "ai engineer"],
        "product manager": ["product manager", "product management", "pm"],
        "ui/ux designer": ["ui/ux", "ux designer", "ui designer", "ux/ui", "product designer", "interaction designer"],
    }
    for role_key, keywords in role_keywords.items():
        for kw in keywords:
            if kw in target:
                return ROLE_SKILLS_DB[role_key]
    return None


def _extract_skills_from_text(text: str) -> set[str]:
    """Extract individual skill keywords from resume/profile text."""
    return set(_normalize(text).split())


def _skill_matches(text_lower: str, keywords: list[str]) -> bool:
    """Check if any keyword appears in the text."""
    for kw in keywords:
        if kw in text_lower:
            return True
    return False


def _compute_analysis(profile_text: str, target_role: str) -> dict:
    """Compute a real gap analysis locally without an API key."""
    role_data = _find_best_role(target_role)

    # If we don't recognize the role, build a generic response
    if role_data is None:
        # Use a generic skill set based on common tech skills
        role_data = {
            "critical": [
                {"name": "Core Domain Knowledge", "keywords": [_normalize(target_role).split()[0] if target_role.strip() else "technical"]},
                {"name": "Communication Skills", "keywords": ["communication", "presentation", "leadership", "team"]},
                {"name": "Problem Solving", "keywords": ["problem solving", "analytical", "critical thinking", "debugging"]},
                {"name": "Industry Tools", "keywords": ["tools", "software", "platform"]},
            ],
            "important": [
                {"name": "Project Management", "keywords": ["project management", "agile", "scrum", "jira"]},
                {"name": "Collaboration", "keywords": ["team", "collaboration", "cross-functional"]},
            ],
            "nice_to_have": [
                {"name": "Certifications", "keywords": ["certified", "certification", "certificate"]},
                {"name": "Cloud Platforms", "keywords": ["aws", "gcp", "azure", "cloud"]},
            ],
        }

    text_lower = _normalize(profile_text)

    matched_role_skills = []
    required_skills = {"critical": [], "important": [], "nice_to_have": []}
    skill_gaps = {"critical": [], "important": [], "nice_to_have": []}

    # Weights: critical=3, important=2, nice_to_have=1
    weights = {"critical": 3, "important": 2, "nice_to_have": 1}
    total_weight = 0
    matched_weight = 0

    for category in ["critical", "important", "nice_to_have"]:
        for skill in role_data[category]:
            skill_name = skill["name"]
            required_skills[category].append(skill_name)
            total_weight += weights[category]

            if _skill_matches(text_lower, skill["keywords"]):
                matched_role_skills.append(skill_name)
                matched_weight += weights[category]
            else:
                skill_gaps[category].append(skill_name)

    # Also extract general skills the user has (beyond role requirements)
    general_skills_map = {
        "Python": ["python"], "JavaScript": ["javascript", "js"], "TypeScript": ["typescript", "ts"],
        "Java": ["java"], "Go": ["golang", " go "], "Rust": ["rust"], "C++": ["c++", "cpp"],
        "C#": ["c#", "csharp"], "Ruby": ["ruby"], "PHP": ["php"], "Swift": ["swift"], "Kotlin": ["kotlin"],
        "R": [" r ", "r programming"], "Scala": ["scala"],
        "Git": ["git", "github", "gitlab"], "SQL": ["sql", "mysql", "postgresql"],
        "Docker": ["docker"], "Linux": ["linux"], "Bash": ["bash", "shell scripting"],
        "HTML/CSS": ["html", "css"], "React": ["react"], "Node.js": ["node.js", "nodejs"],
        "MongoDB": ["mongodb", "mongo"], "Redis": ["redis"], "AWS": ["aws", "amazon web services"],
        "GCP": ["gcp", "google cloud"], "Azure": ["azure"],
        "Kubernetes": ["kubernetes", "k8s"], "Terraform": ["terraform"],
        "Jenkins": ["jenkins"], "Pandas": ["pandas"], "NumPy": ["numpy"],
        "TensorFlow": ["tensorflow"], "PyTorch": ["pytorch"],
        "Django": ["django"], "Flask": ["flask"], "FastAPI": ["fastapi"],
        "Spring": ["spring boot", "spring"], "Express": ["express"],
        "Vue": ["vue", "vuejs"], "Angular": ["angular"],
        "Figma": ["figma"], "Jira": ["jira"],
    }
    extra_skills = []
    matched_lower = {s.lower() for s in matched_role_skills}
    for skill_name, keywords in general_skills_map.items():
        # Skip if already covered by a role skill (check for substring overlap)
        already_covered = any(skill_name.lower() in m or m in skill_name.lower() for m in matched_lower)
        if not already_covered and _skill_matches(text_lower, keywords):
            extra_skills.append(skill_name)

    current_skills = matched_role_skills + extra_skills

    # Calculate score
    if total_weight > 0:
        readiness_score = round((matched_weight / total_weight) * 100)
    else:
        readiness_score = 0

    # Clamp between 5 and 95
    readiness_score = max(5, min(95, readiness_score))

    # Build roadmap from gaps
    roadmap = _build_roadmap(skill_gaps)

    # Build summary
    matched_count = len(current_skills)
    total_count = matched_count + len(skill_gaps["critical"]) + len(skill_gaps["important"]) + len(skill_gaps["nice_to_have"])
    critical_gaps = skill_gaps["critical"]

    if readiness_score >= 80:
        summary = f"You're well-prepared for a {target_role} role with {matched_count}/{total_count} skills matched. "
        if critical_gaps:
            summary += f"Focus on filling the remaining critical gaps: {', '.join(critical_gaps)}."
        else:
            summary += "Fine-tune your expertise in the important and nice-to-have areas to stand out from other candidates."
    elif readiness_score >= 50:
        summary = f"You have a solid foundation with {matched_count}/{total_count} skills for a {target_role} role. "
        if critical_gaps:
            summary += f"Priority gaps to address: {', '.join(critical_gaps[:3])}. "
        summary += "Follow the learning roadmap to systematically close your skill gaps over the next 2-3 months."
    else:
        summary = f"You're at the beginning of your journey toward a {target_role} role ({matched_count}/{total_count} skills matched). "
        if critical_gaps:
            summary += f"Start with the most critical skills: {', '.join(critical_gaps[:3])}. "
        summary += "The roadmap below will guide you step by step — consistency is key."

    return {
        "readiness_score": readiness_score,
        "current_skills": current_skills,
        "required_skills": required_skills,
        "skill_gaps": skill_gaps,
        "roadmap": roadmap,
        "summary": summary,
    }


def _build_roadmap(skill_gaps: dict) -> list:
    """Build a learning roadmap from skill gaps, organized in phases."""
    all_gaps = []
    # Critical gaps first, then important, then nice-to-have
    for gap in skill_gaps.get("critical", []):
        all_gaps.append(("critical", gap))
    for gap in skill_gaps.get("important", []):
        all_gaps.append(("important", gap))
    for gap in skill_gaps.get("nice_to_have", []):
        all_gaps.append(("nice_to_have", gap))

    if not all_gaps:
        return [{
            "phase": "Phase 1: Polish & Practice (Weeks 1-4)",
            "skills_to_learn": ["Build portfolio projects", "Practice interview questions"],
            "resources": [
                {"title": "Build projects on GitHub", "url": "https://github.com/topics/project-ideas", "type": "free", "time": "20 hours", "platform": "GitHub"},
            ],
        }]

    phases = []
    timelines = [
        "Phase 1: Foundation (Weeks 1-2)",
        "Phase 2: Core Skills (Weeks 3-4)",
        "Phase 3: Intermediate (Month 2)",
        "Phase 4: Advanced & Practice (Month 3)",
    ]

    # Distribute gaps across phases (roughly evenly, critical first)
    gaps_per_phase = max(2, len(all_gaps) // 4 + 1)

    for i, timeline in enumerate(timelines):
        start = i * gaps_per_phase
        end = start + gaps_per_phase
        phase_gaps = all_gaps[start:end]
        if not phase_gaps:
            break

        skills_to_learn = [g[1] for g in phase_gaps]
        resources = []
        for _, skill_name in phase_gaps:
            if skill_name in RESOURCES_DB:
                resources.extend(RESOURCES_DB[skill_name][:2])
            else:
                # Try partial matching
                for res_key, res_list in RESOURCES_DB.items():
                    if _normalize(skill_name) in _normalize(res_key) or _normalize(res_key) in _normalize(skill_name):
                        resources.extend(res_list[:1])
                        break

        # If no resources found, add a generic one
        if not resources:
            resources.append({
                "title": f"Search for {skills_to_learn[0]} tutorials",
                "url": f"https://www.youtube.com/results?search_query={'+'.join(skills_to_learn[0].split())}+tutorial",
                "type": "free",
                "time": "5-10 hours",
                "platform": "YouTube",
            })

        phases.append({
            "phase": timeline,
            "skills_to_learn": skills_to_learn,
            "resources": resources,
        })

    return phases


def _compute_interview_questions(resume_text: str, target_role: str, skill_gaps: list | None) -> dict:
    """Generate role-specific interview questions locally."""
    role_data = _find_best_role(target_role)
    role_name = target_role.strip() or "the target"

    questions = []

    if role_data:
        # Generate questions from critical/important skills
        all_skills = []
        for cat in ["critical", "important"]:
            for s in role_data[cat]:
                all_skills.append(s["name"])

        # Technical questions from required skills
        tech_q_templates = [
            ("Technical Deep Dive", "Hard", "Explain the architecture and key components of {skill}. How would you implement it in a production environment?", "Cover core concepts, best practices, trade-offs, and real-world considerations."),
            ("Technical", "Medium", "What are the main challenges when working with {skill}, and how do you overcome them?", "Think about scalability, debugging, monitoring, and common pitfalls."),
            ("Practical Scenario", "Medium", "Walk me through how you would set up {skill} for a new project from scratch.", "Cover tool selection, configuration, testing, and documentation."),
        ]

        for i, skill in enumerate(all_skills[:4]):
            template = tech_q_templates[i % len(tech_q_templates)]
            questions.append({
                "category": template[0],
                "difficulty": template[1],
                "question": template[2].format(skill=skill),
                "hint": template[3],
            })

        # Gap-specific questions
        if skill_gaps:
            for gap in skill_gaps[:2]:
                questions.append({
                    "category": "Skill Assessment",
                    "difficulty": "Medium",
                    "question": f"You mentioned you're still learning {gap}. How would you approach ramping up on this skill quickly for a {role_name} role?",
                    "hint": f"Show self-awareness, mention specific resources or projects, and demonstrate eagerness to learn {gap}.",
                })

    # System design question
    questions.append({
        "category": "System Design",
        "difficulty": "Hard",
        "question": f"Design a scalable, fault-tolerant system relevant to a {role_name} role. Walk me through your architecture decisions.",
        "hint": "Discuss components, data flow, scalability strategy, failure modes, monitoring, and trade-offs.",
    })

    # Troubleshooting question
    questions.append({
        "category": "Troubleshooting",
        "difficulty": "Medium",
        "question": f"A critical production issue occurs in your area of responsibility as a {role_name}. Walk me through your incident response process.",
        "hint": "Cover triage, communication, root cause analysis, mitigation, post-mortem, and prevention.",
    })

    # Behavioral questions
    questions.extend([
        {
            "category": "Behavioral",
            "difficulty": "Easy",
            "question": "Tell me about a challenging technical problem you solved. What was your approach?",
            "hint": "Use the STAR method: Situation, Task, Action, Result. Focus on your problem-solving process.",
        },
        {
            "category": "Behavioral",
            "difficulty": "Easy",
            "question": f"Why are you interested in transitioning to a {role_name} role, and what steps have you taken to prepare?",
            "hint": "Show genuine motivation, mention specific learning efforts, projects, or certifications.",
        },
    ])

    return {"questions": questions[:10]}


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
    profile_text = request.resume_text
    if request.name:
        profile_text = f"Name: {request.name}\n{profile_text}"
    if request.education:
        profile_text += f"\nEducation: {request.education}"
    if request.experience:
        profile_text += f"\nExperience: {request.experience}"
    if request.github_url:
        profile_text += f"\nGitHub: {request.github_url}"

    # Try Claude API if key is available
    if ANTHROPIC_API_KEY:
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
            print(f"Claude API error: {e}, falling back to local analysis")

    # Local scoring engine (no API key needed)
    return _compute_analysis(profile_text, request.target_role)


@app.post("/api/interview-questions")
async def get_interview_questions(request: InterviewRequest):
    # Try Claude API if key is available
    if ANTHROPIC_API_KEY:
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
            print(f"Claude API error: {e}, falling back to local questions")

    # Local interview question generation
    return _compute_interview_questions(request.resume_text, request.target_role, request.skill_gaps)


# ===========================================================================
# Authentication — SQLite + JWT
# ===========================================================================

# --- Database setup --------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./careernav.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# Create tables on startup
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Password hashing -------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# --- JWT --------------------------------------------------------------------

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-a-long-random-string")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

bearer_scheme = HTTPBearer()


def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserModel:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: int = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


# --- Auth request / response models -----------------------------------------

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty.")
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# --- Auth endpoints ---------------------------------------------------------

@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == request.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = UserModel(
        email=request.email,
        name=request.name,
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )


@app.get("/api/auth/me")
def me(current_user: UserModel = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "member_since": current_user.created_at.strftime("%B %Y"),
    }
