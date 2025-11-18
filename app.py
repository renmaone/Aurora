from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os, base64, re
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

def format_response(text):
    # Kod bloklarini formatlash va latex ishlatish
    text = text.strip()
    code_pattern = re.compile(r"```(\w+)?\n?([\s\S]*?)```", re.MULTILINE)
    text = code_pattern.sub(lambda m: f"```{m.group(1) or 'plaintext'}\n{m.group(2).strip()}\n```", text)
    # Inline math va block math uchun MathJax
    text = re.sub(r"\$\$(.*?)\$\$", r"\\[\1\\]", text)  # block
    text = re.sub(r"\$(.*?)\$", r"\\(\1\\)", text)      # inline
    return text

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    image = data.get("image", None)

    if not message and not image:
        return jsonify({"reply": "❌ So'rov bo'sh."})

    try:
        if image:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a vision model."},
                    {"role": "user", "content":[
                        {"type":"text","text":"Analyze this image."},
                        {"type":"image_url","image_url":f"data:image/jpeg;base64,{image}"}
                    ]}
                ]
            )
        else:
            lang = "uzbek" if any("а" <= c <= "я" for c in message.lower()) else "english"
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"You are a helpful {lang} assistant."},
                    {"role": "user", "content": message}
                ]
            )

        reply = response.choices[0].message.content
        reply = format_response(reply)
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"reply": f"❌ Server bilan aloqa xatosi: {e}"})

if __name__ == "__main__":
    app.run(debug=True)