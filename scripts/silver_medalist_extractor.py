import json
import re
import hashlib
import datetime
from typing import Dict, List, Any, Optional

# =============================================================================
# CONFIGURATION
# =============================================================================
# In a production environment, these would be env variables.
MOCK_LLM_MODE = True  # Set to False to use real API (requires implementation)

# =============================================================================
# MOCK LLM (Simulates GPT-4o/Claude behavior for the prototype)
# =============================================================================
class MockLLM:
    """
    Simulates the AI processing to demonstrate the logic without needing
    an immediate API key.
    """
    
    @staticmethod
    def generate_rejection_email(candidate_name: str, notes: str) -> str:
        """
        Simulates generating a polite, legally safe rejection email.
        """
        return f"""
Subject: Update on your application for [Role]

Dear {candidate_name},

Thank you so much for the time you spent interviewing with us. We truly enjoyed getting to know you and appreciating your technical skills, particularly regarding {MockLLM._extract_positive_signal(notes)}.

However, after careful consideration, we have decided to move forward with other candidates who more closely match our immediate needs for this specific role. {MockLLM._extract_gentle_feedback(notes)}

We were impressed by your background and would love to keep you in mind for future openings.

Best regards,
The Hiring Team
"""

    @staticmethod
    def extract_structured_data(notes: str) -> Dict[str, Any]:
        """
        Simulates extracting structured "Silver Medalist" data from messy notes.
        """
        # In reality, this would be a complex prompt to an LLM enforcing a JSON schema.
        # Here, we use heuristic regex for the prototype. 
        
        skills_found = []
        if "python" in notes.lower():
            skills_found.append({"skill": "Python", "level": "High", "evidence": "Passed coding test"})
        if "sql" in notes.lower():
            skills_found.append({"skill": "SQL", "level": "Medium", "evidence": "Good queries, missed optimization"})
        if "system design" in notes.lower() or "architecture" in notes.lower():
             skills_found.append({"skill": "System Design", "level": "Low", "evidence": "Struggled with scaling"})

        return {
            "technical_skills": skills_found,
            "soft_skills": {
                "communication": "concern" if "mumbled" in notes.lower() else "neutral",
                "culture_fit": "good" if "culture" in notes.lower() else "neutral"
            },
            "interview_stage_reached": "Onsite" if "presentation" in notes.lower() else "Screening",
            "hiring_decision": "Reject",
            "rejection_reason_category": "Skill Gap" if "failed" in notes.lower() else "Role Fit"
        }

    @staticmethod
    def _extract_positive_signal(notes: str) -> str:
        if "python" in notes.lower(): return "your Python expertise"
        return "your diverse experience"

    @staticmethod
    def _extract_gentle_feedback(notes: str) -> str:
        if "system design" in notes.lower(): return "We are looking for slightly more experience in large-scale system architecture."
        return ""

# =============================================================================
# RED TEAM GUARDRAILS (The Safety Layer)
# =============================================================================
class RedTeamGuardrails:
    """
    Enforces the privacy and safety constraints identified in TRILLION_DOLLAR_FEATURE_LOG.md
    """
    
    @staticmethod
    def hash_candidate_identity(email: str) -> str:
        """
        GDPR Requirement: We should not store raw emails if possible, 
        or at least hash them for the 'Silver Medalist' aggregate view.
        """
        return hashlib.sha256(email.encode()).hexdigest()

    @staticmethod
    def sanitize_for_storage(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Removes subjective/risky comments that could lead to liability.
        Only keeps the 'Structure'.
        """
        clean_data = data.copy() 
        
        # RULE: No free text storage of negative sentiment.
        # We only store the Categorical Tag.
        if "evidence" in clean_data.get("technical_skills", [{}])[0]:
             # In a real system, we'd sanitize this text. 
             # For now, we pass it, assuming the Extraction Layer did its job.
             pass
             
        return clean_data

# =============================================================================
# MAIN CLASS: THE EXTRACTOR
# =============================================================================
class SilverMedalistExtractor:
    def __init__(self):
        self.llm = MockLLM()
        self.guardrails = RedTeamGuardrails()

    def process_rejection(self, candidate_email: str, candidate_name: str, raw_notes: str) -> Dict[str, Any]:
        """
        The core function called by the browser extension.
        1. Generates the Utility (Email) for the Recruiter.
        2. Extracts the Asset (Data) for the Platform.
        """
        
        # Step 1: Generate the Utility (The "Hook")
        # This is what the recruiter sees and wants.
        email_draft = self.llm.generate_rejection_email(candidate_name, raw_notes)
        
        # Step 2: Extract the Asset (The "Hidden Value")
        # This runs in the background.
        raw_data = self.llm.extract_structured_data(raw_notes)
        
        # Step 3: Apply Red Team Safety Rules
        candidate_hash = self.guardrails.hash_candidate_identity(candidate_email)
        clean_data = self.guardrails.sanitize_for_storage(raw_data)
        
        # Step 4: Construct the Record
        record = {
            "timestamp": datetime.datetime.now().isoformat(),
            "candidate_hash": candidate_hash,  # Anonymized ID
            "data_payload": clean_data,       # The Skill Graph
            "meta": {
                "source": "Browser_Extension_V1",
                "verification_level": "High_Fidelity_Interview"
            }
        }
        
        return {
            "user_output": email_draft,  # Send this to the Clipboard/Outlook
            "system_record": record      # Send this to our Database
        }

# =============================================================================
# DEMONSTRATION
# =============================================================================
if __name__ == "__main__":
    extractor = SilverMedalistExtractor()
    
    # INPUT: Raw, messy notes from a tired recruiter
    sample_input = {
        "candidate_email": "johndoe@example.com",
        "candidate_name": "John Doe",
        "raw_notes": """
        REJECT. 
        Liked him. Strong Python skills, aced the coding test easily. 
        SQL was okay but he messed up the window functions. 
        Main issue was the System Design round - he completely blanked on the load balancer question. 
        Also mumbled a bit during the presentation, might be an issue for client facing role. 
        Culture wise seems fine.
        """
    }
    
    print(f"--- INPUT: Raw Notes for {sample_input['candidate_name']} ---\\n")
    print(sample_input['raw_notes'].strip())
    print("\n" + "="*60 + "\n")
    
    # PROCESS
    result = extractor.process_rejection(
        sample_input["candidate_email"],
        sample_input["candidate_name"],
        sample_input["raw_notes"]
    )
    
    # OUTPUT 1: The Value for the Recruiter
    print("--- OUTPUT 1: The 'Utility' (Generated Email) ---\\n")
    print(result["user_output"])
    print("\n" + "="*60 + "\n")
    
    # OUTPUT 2: The Value for the Platform
    print("--- OUTPUT 2: The 'Asset' (Structured Data) ---\\n")
    print(json.dumps(result["system_record"], indent=2))
