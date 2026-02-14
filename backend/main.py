import os
import json
import re
import httpx
from groq import Groq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- FastAPI App Initialization ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class FamilyMember(BaseModel):
    name: str
    age: int
    dietary_preference: str
    health_goals: Optional[str] = ""
    dislikes: Optional[str] = ""
    special_notes: Optional[str] = ""
    religious_rules: Optional[str] = ""

class MealRequest(BaseModel):
    family_members: List[FamilyMember]
    ingredients: List[str]
    mealType: str
    dayOfWeek: str

# --- Groq API Integration ---
try:
    client = Groq(
        api_key=os.environ.get('MealFlowAPI'),
        http_client=httpx.Client(verify=False)
    )
except Exception as e:
    client = None
    print(f"Could not initialize Groq client: {e}")


def get_recipe_from_groq(preprompt: str):
    if not client:
        raise HTTPException(status_code=500, detail="Groq client is not initialized. Check API key.")
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": preprompt}],
            model="llama3-70b-8192",  # More powerful model for complex instructions
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred with the Groq API: {str(e)}")


def build_preprompt(data: MealRequest) -> str:
    family_details = "\n".join([
        f"- Name: {m.name}, Diet: {m.dietary_preference}, Dislikes: {m.dislikes}, Rules: {m.religious_rules}"
        for m in data.family_members
    ])
    ingredient_list = ", ".join(data.ingredients) if data.ingredients else "None available"

    preprompt = f"""
You are MealFlow AI, an expert recipe decision engine for Indian households. Your task is to generate a single, suitable Indian meal recipe based on a complex set of constraints.

**CONTEXT:**
- Meal Type: {data.mealType}
- Day of the Week: {data.dayOfWeek}

**INPUT CONSTRAINTS:**
1.  **Family Members & Rules:**
{family_details}

2.  **Available Ingredients:**
{ingredient_list}

**CORE DIRECTIVES & RULES:**
1.  **VEGETARIAN RULE (CRITICAL):** If ANY family member has a diet of 'veg', the main dish for the entire meal MUST be vegetarian. You can ONLY suggest an optional, simple, separate non-veg side dish if it complements the meal and uses available ingredients. Do not make the primary meal non-vegetarian if a vegetarian is present.
2.  **DAY-SPECIFIC RULE (CRITICAL):** You must strictly obey all day-specific and religious rules. Analyze the "Day of the Week" context provided. For example, if today is '{data.dayOfWeek}' and a member's rule is 'No non-veg on Tuesdays', you MUST treat that member as 'veg' for this request, even if their default preference is non-veg.
3.  **INGREDIENT USAGE:** You must ONLY use the ingredients from the "Available Ingredients" list. You are permitted to assume a standard set of basic Indian household spices are available (e.g., turmeric, chili powder, cumin, coriander powder, salt, pepper, garam masala) if they are not listed. Do not use any other unlisted ingredients.
4.  **MEAL TYPE ADHERENCE:** The generated recipe must be appropriate for the specified "Meal Type" ({data.mealType}).

**OUTPUT FORMAT (MANDATORY):**
- You MUST return ONLY a raw JSON object, without any markdown formatting (e.g., ```json), comments, or other text.
- The JSON structure MUST be exactly as follows:
{{
  "meal": {{
    "name": "Generated Meal Name",
    "type": "veg | non-veg",
    "cuisine": "Indian",
    "why_this_meal": "A brief, warm explanation of why this meal was chosen based on the constraints."
  }},
  "ingredients_used": [
    {{"ingredient": "Name", "category": "vegetable|protein|grain|dairy|spice|other"}}
  ],
  "recipe": {{
    "total_time_minutes": 30,
    "steps": [
      "A single, concise instruction for one action.",
      "Another single action step.",
      "And so on. Do NOT number steps inside this string. Each array element is one step."
    ]
  }},
  "member_specific_recommendations": [
    {{"name": "Member Name", "recommendation": "A specific serving suggestion for this person."}}
  ],
  "serving_notes": "General notes on how to best serve this meal.",
  "tips": [
      "A useful tip related to the recipe."
  ]
}}

**RECIPE STEP FORMATTING (CRITICAL):**
- Each string in the "steps" array must represent a SINGLE, distinct action.
- BAD: ["1. Chop onions. 2. Sauté them."]
- GOOD: ["Chop the onions finely.", "In a hot pan with oil, sauté the chopped onions until golden brown."]

Begin generation now.
"""
    return preprompt

# --- API Endpoint ---
@app.post("/generate_meal")
async def generate_meal(request_data: MealRequest):
    if not request_data.family_members and not request_data.ingredients:
        raise HTTPException(status_code=400, detail="Please provide family member details or select ingredients.")

    preprompt = build_preprompt(request_data)
    
    try:
        groq_response_str = get_recipe_from_groq(preprompt)
        
        # Clean the response to find the JSON object
        json_match = re.search(r'\{.*\}', groq_response_str, re.DOTALL)
        if not json_match:
            raise json.JSONDecodeError("No JSON object found in the AI response.", groq_response_str, 0)
        
        clean_response = json_match.group(0)
        recipe_json = json.loads(clean_response)
        return recipe_json

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to decode the recipe from the AI. Raw response: {e.doc}"
        )
    except HTTPException as e:
        raise e # Re-raise exceptions from the Groq call
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# --- Root Endpoint (for testing) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the MealFlow API!"}

