import io
import time
import re
import tempfile
import os
import requests
import json
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel



from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from google import genai

from dotenv import load_dotenv
import os

load_dotenv()

print("API Key:", os.getenv("GEMINI_API_KEY"))
print("Google Key:", os.getenv("GOOGLE_API_KEY"))


# ─────────────────────────────────────────────
#  PYDANTIC SCHEMAS
# ─────────────────────────────────────────────
class QuizRequest(BaseModel):
    summary_text: str
    language: str = "en"

class AnswerOption(BaseModel):
    text: str
    rationale: str
    isCorrect: bool

class QuizQuestion(BaseModel):
    questionNumber: int
    question: str
    answerOptions: List[AnswerOption]
    hint: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    summary: str
    messages: List[ChatMessage]

# ── Scenario / Descriptive schemas ──────
class ScenarioQuestionsRequest(BaseModel):
    summary_text: str

class ScenarioQuestion(BaseModel):
    questionNumber: int
    type: str          # "scenario" | "descriptive"
    question: str
    context: str
    sampleAnswer: str
    evaluationCriteria: List[str]
    
    
class ScenarioQuestionsResponse(BaseModel):
    questions: List[ScenarioQuestion]

class EvaluateAnswerRequest(BaseModel):
    question: str
    context: str
    sampleAnswer: str
    evaluationCriteria: List[str]
    userAnswer: str

class EvaluateFeedback(BaseModel):
    score: int
    grade: str
    strengths: List[str]
    improvements: List[str]
    detailedFeedback: str

class EvaluateAnswerResponse(BaseModel):
    feedback: EvaluateFeedback

# ─────────────────────────────────────────────
#  APP INITIALIZATION
# ─────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    client = genai.Client()
    print("Gemini client initialized successfully.")
except Exception as e:
    print(f"API Client Init Error: {e}")

# ─────────────────────────────────────────────
#  FALLBACK MODEL HELPER
# ─────────────────────────────────────────────
def generate_with_fallback(contents, config=None):
    models = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
    ]
    last_err = None
    for model in models:
        for attempt in range(2):
            try:
                print(f"Trying model: {model} (attempt {attempt + 1})")
                kwargs = {"model": model, "contents": contents}
                if config:
                    kwargs["config"] = config
                return client.models.generate_content(**kwargs)
            except Exception as e:
                err_str = str(e)
                if any(code in err_str for code in ["503", "429", "UNAVAILABLE", "EXHAUSTED"]):
                    wait = 40 if "429" in err_str else 5
                    print(f"{model} rate limited / unavailable, waiting {wait}s before retry...")
                    time.sleep(wait)
                    last_err = e
                    continue
                raise
        print(f"{model} exhausted all attempts, moving to next model...")
    raise last_err

# ─────────────────────────────────────────────
#  PLATFORM DETECTION
# ─────────────────────────────────────────────
YOUTUBE_PATTERNS = [
    "youtube.com/watch",
    "youtu.be/",
    "youtube.com/shorts",
    "youtube.com/live",
    "youtube.com/embed",
]
YTDLP_PLATFORMS = [
    "instagram.com", "instagr.am",
    "tiktok.com", "vm.tiktok.com",
    "twitter.com", "x.com", "t.co",
    "facebook.com", "fb.watch", "fb.com",
    "reddit.com", "v.redd.it",
    "vimeo.com",
    "dailymotion.com",
    "twitch.tv",
    "streamable.com",
    "rumble.com",
    "odysee.com", "lbry.tv",
    "bilibili.com",
    "linkedin.com",
    "pinterest.com",
    "snapchat.com",
    "triller.co",
    "likee.video",
    "kwai.com",
    "dubsmash.com",
    "ok.ru",
    "vk.com",
]
DIRECT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".flv", ".wmv", ".3gp"]

MIME_MAP = {
    ".mp4": "video/mp4", ".mov": "video/quicktime", ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska", ".webm": "video/webm", ".m4v": "video/mp4",
    ".flv": "video/x-flv", ".wmv": "video/x-ms-wmv", ".3gp": "video/3gpp",
}

def detect_link_type(url: str) -> str:
    url_lower = url.lower().split("?")[0]
    if any(p in url.lower() for p in YOUTUBE_PATTERNS):
        return "youtube"
    if any(url_lower.endswith(ext) or f"{ext}?" in url.lower() for ext in DIRECT_VIDEO_EXTENSIONS):
        return "direct_video"
    if any(p in url.lower() for p in YTDLP_PLATFORMS):
        return "ytdlp_platform"
    return "try_ytdlp"

# ─────────────────────────────────────────────
#  HELPER: Extract YouTube video ID
# ─────────────────────────────────────────────
def extract_video_id(url: str) -> str:
    patterns = [
        r"youtu\.be/([^?&/]+)",
        r"youtube\.com/watch\?.*v=([^&]+)",
        r"youtube\.com/embed/([^?/]+)",
        r"youtube\.com/shorts/([^?/]+)",
        r"youtube\.com/live/([^?/]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract YouTube video ID from URL: {url}")

# ─────────────────────────────────────────────
#  HELPER: Download with yt-dlp → bytes
# ─────────────────────────────────────────────
def download_with_ytdlp(url: str, max_bytes: int = 200 * 1024 * 1024) -> bytes:
    try:
        import yt_dlp
    except ImportError:
        raise Exception("yt-dlp is not installed. Install it with: pip install yt-dlp")

    with tempfile.TemporaryDirectory() as tmpdir:
        output_template = os.path.join(tmpdir, "video.%(ext)s")
        ydl_opts = {
            "format": (
                "best[ext=mp4][height<=720]/"
                "best[ext=mp4]/"
                "bestvideo[height<=720]+bestaudio/best"
            ),
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "merge_output_format": "mp4",
            "ignoreerrors": False,
            "socket_timeout": 60,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        files = [f for f in os.listdir(tmpdir) if not f.endswith(".part")]
        if not files:
            raise Exception(
                "yt-dlp finished but no output file was found. "
                "The platform may require authentication or the content is private/geo-restricted."
            )
        video_path = os.path.join(tmpdir, files[0])
        file_size = os.path.getsize(video_path)
        if file_size > max_bytes:
            raise Exception(
                f"Downloaded video is too large ({file_size / (1024*1024):.0f} MB). "
                f"Maximum allowed size is {max_bytes // (1024*1024)} MB."
            )
        with open(video_path, "rb") as f:
            return f.read()

# ─────────────────────────────────────────────
#  HELPER: Upload bytes to Gemini Files API → summary
# ─────────────────────────────────────────────
def upload_to_gemini_and_summarize(video_bytes: bytes, mime_type: str = "video/mp4", language: str = "en") -> str:
    print(f"Uploading {len(video_bytes) / (1024*1024):.2f} MB to Gemini Files API...")
    video_file = client.files.upload(
        file=io.BytesIO(video_bytes),
        config={"mime_type": mime_type}
    )
    print(f"Upload complete. Waiting for Gemini to process: {video_file.name}")
    while video_file.state.name == "PROCESSING":
        time.sleep(4)
        video_file = client.files.get(name=video_file.name)
    if video_file.state.name == "FAILED":
        raise Exception("Gemini failed to process the video file.")

    language_instruction = (
    f"CRITICAL INSTRUCTION: You MUST write the entire response in {language} language only. "
    f"Do not use English at all except for untranslatable technical terms."
    if language != "en" else ""
)

    print("File ready. Generating summary...")
    response = generate_with_fallback(
        contents=[
            video_file,
            f"Analyze and summarize this video. Provide a beautifully formatted Markdown summary including: "
            f"**Overview** (2-3 sentences), **Key Topics** (bullet points), **Main Takeaways** (bullet points), "
            f"and a **Conclusion** paragraph. {language_instruction}"
        ]
    )
    client.files.delete(name=video_file.name)
    return response.text

# ─────────────────────────────────────────────
#  ENDPOINT 1: Local file upload
# ─────────────────────────────────────────────
@app.post("/api/summarize")
async def summarize_video_file(
    file: UploadFile = File(...),
    language: str = Form(default="en")
):
    try:
        file_bytes = await file.read()
        summary = upload_to_gemini_and_summarize(
            file_bytes,
            mime_type=file.content_type or "video/mp4",
            language=language
        )
        return {"summary": summary}
    except Exception as e:
        print(f"Error in /api/summarize: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────
#  ENDPOINT 2: Universal link summarization
# ─────────────────────────────────────────────
@app.post("/api/summarize-link")
async def summarize_video_link(
    url: str = Form(...),
    language: str = Form(default="en")
):
    url = url.strip()
    link_type = detect_link_type(url)
    print(f"Link type detected: '{link_type}' for URL: {url}")

    # Build the language instruction once — reused in all branches
    language_instruction = f"Generate the entire summary in {language} language." if language != "en" else ""

    summary_suffix = (
        f"Provide a beautifully formatted Markdown summary including: "
        f"**Overview** (2-3 sentences), **Key Topics** (bullet points), "
        f"**Main Takeaways** (bullet points), and a **Conclusion** paragraph. "
        f"{language_instruction}"
    )

    # ── YouTube ────────────────────────────────────────────────────────────
    if link_type == "youtube":
        try:
            video_id = extract_video_id(url)
            print(f"YouTube video ID: {video_id}")

            try:
                transcript_obj = YouTubeTranscriptApi.list_transcripts(video_id)
                try:
                    transcript = transcript_obj.find_manually_created_transcript(
                        ["en", "en-US", "en-GB", "hi", "te"]
                    )
                except NoTranscriptFound:
                    transcript = transcript_obj.find_generated_transcript(
                        ["en", "en-US", "en-GB", "hi", "te"]
                    )
                transcript_list = transcript.fetch()
                full_text = " ".join([item["text"] for item in transcript_list])
                print(f"Transcript fetched: {len(full_text)} characters")

                response = generate_with_fallback(
    contents=[
        f"IMPORTANT: You must respond ONLY in {language} language. Do not use English unless the user selected English.\n\n"
        f"Analyze and summarize this YouTube video transcript:\n\n{full_text}\n\n{summary_suffix}"
    ]
)
                return {"summary": response.text}

            except Exception as transcript_err:
                print(f"Transcript unavailable ({transcript_err}). Falling back to yt-dlp download...")
                video_bytes = download_with_ytdlp(url)
                summary = upload_to_gemini_and_summarize(
                    video_bytes,
                    mime_type="video/mp4",
                    language=language
                )
                return {"summary": summary}

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # ── Direct video file URL ───────────────────────────────────────────────
    elif link_type == "direct_video":
        try:
            print(f"Downloading direct video from: {url}")
            headers = {"User-Agent": "Mozilla/5.0 (compatible; VideoSummarizer/1.0)"}
            response = requests.get(url, headers=headers, timeout=120, stream=True)
            response.raise_for_status()
            MAX_BYTES = 200 * 1024 * 1024
            chunks, total = [], 0
            for chunk in response.iter_content(chunk_size=8192):
                chunks.append(chunk)
                total += len(chunk)
                if total > MAX_BYTES:
                    raise Exception("Video file too large (>200 MB). Please upload it directly instead.")
            video_bytes = b"".join(chunks)
            url_lower = url.lower()
            mime_type = "video/mp4"
            for ext, mt in MIME_MAP.items():
                if ext in url_lower:
                    mime_type = mt
                    break
            summary = upload_to_gemini_and_summarize(
                video_bytes,
                mime_type=mime_type,
                language=language
            )
            return {"summary": summary}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # ── Known social platform OR unknown URL → yt-dlp ──────────────────────
    else:
        try:
            print(f"Downloading via yt-dlp from: {url}")
            video_bytes = download_with_ytdlp(url)
            summary = upload_to_gemini_and_summarize(
                video_bytes,
                mime_type="video/mp4",
                language=language
            )
            return {"summary": summary}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Could not download video from this URL.\n\n"
                    f"Error: {str(e)}\n\n"
                    "Tips:\n"
                    "• Private / login-required content cannot be downloaded automatically.\n"
                    "• Some platforms require you to be logged in – download the video manually "
                    "and use the 'Upload Local File' tab instead.\n"
                    "• Make sure yt-dlp is up to date: pip install -U yt-dlp"
                )
            )

# ─────────────────────────────────────────────
#  ENDPOINT 3: Generate Quiz
# ─────────────────────────────────────────────
@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
    if not request.summary_text.strip():
        raise HTTPException(status_code=400, detail="Summary text is required to generate a quiz.")

    try:
        print("Generating structured quiz from summary text...")
        prompt = (
            f"Based on the following video summary text, generate a 5-question multiple-choice quiz "
            f"to test the user's understanding of the topic. Each question must have exactly 4 dynamic option "
            f"objects including a structural rationale text and a correct boolean selector.\n\n"
            f"Video Summary Content:\n{request.summary_text}"
        )
        lang_instruction = (
    f"IMPORTANT: Generate ALL question text, answer options, and explanations in {request.language} language only."
    if request.language != "en" else ""
)

        prompt = (
    f"{lang_instruction}\n\n"
    f"Based on the following video summary text, generate a 5-question multiple-choice quiz "
    f"to test the user's understanding of the topic. Each question must have exactly 4 dynamic option "
    f"objects including a structural rationale text and a correct boolean selector.\n\n"
    f"Video Summary Content:\n{request.summary_text}"
)
        response = generate_with_fallback(
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": QuizResponse,
            }
        )

        return json.loads(response.text)

    except Exception as e:
        print(f"Error in /api/generate-quiz: {e}")
        
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")
     
# ─────────────────────────────────────────────
#  ENDPOINT 4: Generate PPT Slides
# ─────────────────────────────────────────────
class SlideItem(BaseModel):
    title: str
    content: str
    type: str

class PptResponse(BaseModel):
    slides: List[SlideItem]

@app.post("/api/generate-ppt")
async def generate_ppt(summary_text: str = Form(...), slide_count: int = Form(6)):
    if not summary_text.strip():
        raise HTTPException(status_code=400, detail="Summary text is required.")
    if not (2 <= slide_count <= 20):
        raise HTTPException(status_code=400, detail="Slide count must be between 2 and 20.")
    try:
        slide_types = ["title", "overview", "content", "highlight", "conclusion"]
        prompt = (
            f"Create a {slide_count}-slide presentation from the following content. "
            f"Return a JSON object with a 'slides' array. Each slide must have:\n"
            f"- 'title': short slide heading\n"
            f"- 'content': bullet points separated by newlines (3-5 points)\n"
            f"- 'type': one of {slide_types} — first slide must be 'title', last must be 'conclusion', "
            f"  'highlight' for the most important insight, 'overview' for second slide, rest are 'content'\n\n"
            f"Content to convert:\n{summary_text}"
        )
        response = generate_with_fallback(
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": PptResponse,
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in /api/generate-ppt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate slides: {str(e)}")

# ─────────────────────────────────────────────
#  ENDPOINT 5: Chat with AI Tutor
# ─────────────────────────────────────────────
@app.post("/api/chat")
async def chat_with_tutor(request: ChatRequest):
    if not request.summary.strip():
        raise HTTPException(status_code=400, detail="Summary is required.")
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty.")
    try:
        print(f"Chat request: {len(request.messages)} messages in history")
        system_prompt = (
            f"You are an expert tutor helping a student understand content they have just studied. "
            f"Here is the content they analyzed:\n\n---\n{request.summary}\n---\n\n"
            "Your role:\n"
            "- Answer questions in flowing, descriptive paragraphs — like a knowledgeable teacher speaking naturally\n"
            "- Use real-world analogies and examples to make abstract concepts concrete\n"
            "- When relevant, mention connections to other topics or real applications\n"
            "- Be thorough but conversational — avoid dry bullet-point lists\n"
            "- If the question goes beyond the notes, draw on your broader knowledge while making that clear\n"
            "- Keep answers focused and under 300 words unless a deeper explanation is truly needed"
        )
        contents = []
        for msg in request.messages:
            gemini_role = "model" if msg.role == "assistant" else "user"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": msg.content}]
            })
        response = generate_with_fallback(
            contents=contents,
            config={"system_instruction": system_prompt}
        )
        return {"reply": response.text}
    except Exception as e:
        print(f"Error in /api/chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# ─────────────────────────────────────────────
#  ENDPOINT 6: Generate Scenario + Descriptive Questions
# ─────────────────────────────────────────────
@app.post("/api/generate-scenario-questions")
async def generate_scenario_questions(request: ScenarioQuestionsRequest):
    if not request.summary_text.strip():
        raise HTTPException(status_code=400, detail="Summary text is required.")
    try:
        print("Generating scenario and descriptive questions...")
        prompt = (
            "Based on the following content summary, generate exactly 6 thought-provoking questions "
            "to deeply test understanding and critical thinking. Mix 3 scenario-based questions and "
            "3 descriptive/analytical questions.\n\n"
            "For SCENARIO questions:\n"
            "- Set a realistic real-world situation/context related to the topic\n"
            "- Ask the student what they would do, how they would apply the concept, or what outcome to expect\n"
            "- type must be exactly: 'scenario'\n\n"
            "For DESCRIPTIVE questions:\n"
            "- Ask the student to explain, analyze, compare, evaluate, or justify a concept from the content\n"
            "- These should require multi-sentence paragraph answers showing deep understanding\n"
            "- type must be exactly: 'descriptive'\n\n"
            "For every question provide:\n"
            "- questionNumber: 1-6\n"
            "- type: 'scenario' or 'descriptive'\n"
            "- question: the question text\n"
            "- context: for scenario questions, a 2-3 sentence setup/background; for descriptive leave empty string\n"
            "- sampleAnswer: a thorough model answer covering all key points expected (4-6 sentences)\n"
            "- evaluationCriteria: a list of 3-4 specific rubric items the answer should cover\n\n"
            f"Content Summary:\n{request.summary_text}"
        )
        response = generate_with_fallback(
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": ScenarioQuestionsResponse,
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in /api/generate-scenario-questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# ─────────────────────────────────────────────
#  ENDPOINT 7: Evaluate a Descriptive / Scenario Answer
# ─────────────────────────────────────────────
@app.post("/api/evaluate-answer")
async def evaluate_answer(request: EvaluateAnswerRequest):
    if not request.userAnswer.strip():
        raise HTTPException(status_code=400, detail="User answer cannot be empty.")
    try:
        print("Evaluating descriptive/scenario answer...")
        criteria_str = "\n".join(f"- {c}" for c in request.evaluationCriteria)
        prompt = (
            "You are an expert evaluator. Assess the following student answer against the question, "
            "sample answer, and evaluation criteria. Be constructive and encouraging.\n\n"
            f"Question: {request.question}\n\n"
            f"{'Scenario Context: ' + request.context + chr(10) + chr(10) if request.context else ''}"
            f"Sample Answer: {request.sampleAnswer}\n\n"
            f"Evaluation Criteria:\n{criteria_str}\n\n"
            f"Student Answer: {request.userAnswer}\n\n"
            "Return a JSON feedback object with:\n"
            "- score: integer 0-10\n"
            "- grade: one of 'Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Incomplete'\n"
            "- strengths: list of 2-3 things the student did well\n"
            "- improvements: list of 2-3 specific things to improve or add\n"
            "- detailedFeedback: a 3-4 sentence paragraph with overall feedback and encouragement"
        )
        response = generate_with_fallback(
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": EvaluateAnswerResponse,
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in /api/evaluate-answer: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
