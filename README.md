🧠 MedVision AI
AI-Powered Medical Image Analysis using Roboflow

📌 Overview
MedVision AI is a lightweight medical imaging analysis system that uses computer vision models deployed via Roboflow to detect abnormalities in medical scans.
The platform enables real-time inference, visual detection outputs, and AI-assisted diagnostic summaries through a simple and interactive web interface built with Streamlit.

⚙️ Key Features


🖼️ Upload and analyze medical images (X-ray, CT, MRI)


🎯 Detection using Roboflow-hosted models (YOLO-based)


📦 Bounding box predictions with confidence scores


⚡ Real-time API inference


📊 Clean UI with image preview and results


📄 Optional AI-generated medical summary



🏗️ System Architecture
[ Streamlit Frontend ]          │          ▼[ Python Backend ]          │          ▼[ Roboflow Inference API ]          │          ▼[ Detection Results (JSON) ]          │          ▼[ Visualization + Report ]

🔌 Roboflow Integration
The project uses Roboflow Hosted Inference API for model predictions.
🔹 Inference Flow


Image uploaded via UI


Converted to required format (JPEG/PNG/Base64)


Sent to Roboflow API


Receives predictions (labels, confidence, bounding boxes)


Results rendered on UI



📡 API Usage
Example inference request:
from roboflow import Roboflowrf = Roboflow(api_key="YOUR_API_KEY")project = rf.workspace().project("your-project-name")model = project.version(1).modelprediction = model.predict("image.jpg").json()print(prediction)

📊 Sample Response
{  "predictions": [    {      "class": "Tumor",      "confidence": 0.92,      "x": 210,      "y": 180,      "width": 120,      "height": 95    }  ]}

🛠️ Tech Stack


Frontend: Streamlit


Backend: Python


AI Model Hosting: Roboflow


Libraries: OpenCV, NumPy, PIL


Optional AI: OpenAI / Gemini (for report generation)



🚀 Installation
git clone https://github.com/your-username/medvision-ai.git
cd medvision-ai pip install -r requirements.txt

▶️ Run Application
streamlit run app.py

🔐 Environment Variables
Create a .env file:
ROBOFLOW_API_KEY=your_api_key_here

📦 Deployment


Deploy easily on Streamlit Cloud


No local model hosting required (handled by Roboflow)


Lightweight and scalable



📈 Use Cases


🏥 Clinical decision support


🌍 Rural healthcare diagnostics


🎓 Medical learning tools


🚑 Rapid screening systems



⚠️ Disclaimer
This project is intended for educational and research purposes only and should not be used as a substitute for professional medical diagnosis.

📜 License
MIT License

Thankyou ❤️