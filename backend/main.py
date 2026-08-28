"""
BidFlo - AI-Powered Integrated Bid Compliance Verification Platform for GeM
FastAPI Backend Microservice
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import verify, collusion, audit, tenders, registries

app = FastAPI(
    title="BidFlo — GeM Compliance Verification Microservice",
    description=(
        "Automated statutory eligibility checks, explainable compliance scoring, "
        "cross-bidder collusion detection, and SHA-256 hash-chained audit logging "
        "for Government e-Marketplace (GeM) procurement officers."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all route groups
app.include_router(verify.router,     prefix="/api/verify",     tags=["Compliance Verification"])
app.include_router(collusion.router,  prefix="/api/collusion",  tags=["Collusion Detection"])
app.include_router(audit.router,      prefix="/api/audit",      tags=["Audit Trail"])
app.include_router(tenders.router,    prefix="/api/tenders",    tags=["Tenders"])
app.include_router(registries.router, prefix="/api/registries", tags=["Registry Connectors"])


@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "BidFlo GeM Compliance Microservice",
        "version": "1.0.0",
        "trust_boundary": "GeM Private Network / MeitY GCC",
    }
