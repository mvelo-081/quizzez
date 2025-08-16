import os
import json
import pdfplumber
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

# ----------------------------- CONFIG -----------------------------
FOLDER_PATH = "C:\\Users\\mvelo\\OneDrive\\Desktop\\QUIZZEZ\\DataExtractionModel\\pdf_files"  # Folder containing PDFs
OUTPUT_FOLDER = "C:\\Users\\mvelo\\OneDrive\\Desktop\\QUIZZEZ\\Quiz"                # Where JSON files will be saved
MODEL_NAME = "google/flan-t5-small"    # Hugging Face model
# ------------------------------------------------------------------

# Load Hugging Face model pipeline
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
qa_pipeline = pipeline("text2text-generation", model=model, tokenizer=tokenizer)

def list_pdfs(folder_path):
    """Return list of PDFs in folder (recursive)"""
    pdf_files = []
    for root, dirs, filenames in os.walk(folder_path):
        for filename in filenames:
            if filename.lower().endswith(".pdf"):
                pdf_files.append(os.path.join(root, filename))
    return pdf_files

def extract_text(pdf_path):
    """Extract all text from PDF using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text.strip()

def generate_mcq_options(question_text):
    """
    Use Hugging Face model to generate options for MCQ.
    Returns a list of 4 options.
    """
    prompt = f"Generate 4 multiple-choice options for the question:\n{question_text}"
    result = qa_pipeline(prompt, max_length=200)
    options_text = result[0]['generated_text']
    # Split by newlines or commas
    options = [opt.strip("- ").strip() for opt in options_text.replace("\n", ",").split(",") if opt.strip()]
    return options[:4] if options else ["Option1", "Option2", "Option3", "Option4"]

def parse_questions(text):
    """
    Detect questions using a simple heuristic:
    - Questions usually end with '?'
    - True/False questions contain 'True' or 'False'
    - Open-ended if no options detected
    """
    questions = []
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    for line in lines:
        if "?" in line:
            q_text = line
            # Detect True/False
            if "true" in line.lower() or "false" in line.lower():
                options = ["True", "False"]
                correct_index = -1  # Can be updated if PDF has answers
            else:
                # MCQ / open-ended
                options = generate_mcq_options(q_text)
                correct_index = -1  # Unknown
            questions.append({
                "question": q_text,
                "options": options,
                "correctAnswer": correct_index
            })
    return questions

def process_pdf(pdf_path, output_folder):
    text = extract_text(pdf_path)
    questions = parse_questions(text)
    title = os.path.splitext(os.path.basename(pdf_path))[0]

    quiz_data = {
        "title": title,
        "questions": questions
    }

    os.makedirs(output_folder, exist_ok=True)
    json_path = os.path.join(output_folder, f"{title}.json")
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(quiz_data, jf, ensure_ascii=False, indent=4)
    print(f"Saved quiz JSON: {json_path}")

def main():
    pdf_files = list_pdfs(FOLDER_PATH)
    print(f"Found {len(pdf_files)} PDF files.")

    for pdf in pdf_files:
        process_pdf(pdf, OUTPUT_FOLDER)

if __name__ == "__main__":
    main()
