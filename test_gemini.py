import os
from dotenv import load_dotenv
from google import genai

# Load key from backend/.env or root .env
load_dotenv("backend/.env") or load_dotenv(".env")
api_key = os.getenv("GEMINI_API_KEY")

print(f"Loaded Key: {api_key[:8]}... (Total length: {len(api_key) if api_key else 0})")

client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents="Reply with: 'ComplianceX AI Gateway is live and functional.'"
    )
    print("\nSUCCESS!")
    print("Gemini Output:", response.text.strip())
except Exception as e:
    print("\nFAILED WITH ERROR:")
    print(e)
