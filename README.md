# 🧠 MedVision AI  
### AI-Powered Medical Image Analysis using Roboflow  

---

## 📌 Overview  
MedVision AI is a lightweight medical imaging analysis system that uses computer vision models hosted on Roboflow to detect abnormalities in medical scans such as X-rays, CT scans, and MRIs.

The system provides real-time predictions, bounding box detection, and a simple interactive interface built using Streamlit.

---

## ⚙️ Features  

- Upload and analyze medical images  
- Roboflow-hosted object detection (YOLO-based)  
- Bounding box predictions with confidence scores  
- Real-time API inference  
- Clean Streamlit UI  
- Optional AI-generated medical summaries  

---

## 🏗️ System Architecture  


[ Streamlit Frontend ]
│
▼
[ Python Backend ]
│
▼
[ Roboflow Inference API ]
│
▼
[ Detection Results (JSON) ]
│
▼
[ Visualization + Output ]


---

## 🔌 Roboflow Integration  

The project uses Roboflow Hosted API for inference.

### Example Code  

```python
from roboflow import Roboflow

rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace().project("your-project-name")
model = project.version(1).model

prediction = model.predict("image.jpg").json()
print(prediction)
```
---
📊 Sample Output
```
{
  "predictions": [
    {
      "class": "Tumor",
      "confidence": 0.92,
      "x": 210,
      "y": 180,
      "width": 120,
      "height": 95
    }
  ]
}
```
---
🛠️ Tech Stack

Frontend: Streamlit

Backend: Python

Model Hosting: Roboflow

Libraries: OpenCV, NumPy, PIL

Optional: OpenAI / Gemini API
---

```
🚀 Installation
git clone https://github.com/your-username/medvision-ai.git
cd medvision-ai
pip install -r requirements.txt
```
---
▶️ Run the App
```
streamlit run app.py
```
---
🔐 Environment Variables
```
Create a .env file and add:
ROBOFLOW_API_KEY=your_api_key_here
```
---
📦 Deployment
```
Deploy on Streamlit Cloud
No local model hosting required
Fast and scalable
```
---
<img width="1359" height="721" alt="Image" src="https://github.com/user-attachments/assets/6114d2d6-b52d-4c06-ad35-65daf9e669af" />
<img width="1355" height="723" alt="Image" src="https://github.com/user-attachments/assets/3da15067-bc82-4a02-bb53-cbf96d8cd520" />
<img width="1362" height="721" alt="Image" src="https://github.com/user-attachments/assets/1ac51f2a-8a97-4d50-a5fb-d52cc80326c5" />

---

📈 Use Cases

Clinical decision support

Rural healthcare diagnostics

Medical education

Rapid disease screening

---

Contributors✨: Lohunn Lazaro W, C Monish Nandha Balan, Parameshwaran S, Gururajan Ganeshbabu

---

⚠️ Disclaimer

This project is for educational and research purposes only. It is not a substitute for professional medical diagnosis.

---

📜 License

MIT License

---

⭐ Thankyou!
