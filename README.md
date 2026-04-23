# DocLocate 🩺

**Find trusted doctors near your new home.**

DocLocate is a full-stack healthcare discovery platform that helps newcomers find verified doctors filtered by specialty, insurance, and language. Built with React (no build step) and a Python Flask backend.

🌐 **Live Demo:** [https://lohit7dev.github.io/DocLocate](https://lohit7dev.github.io/DocLocate)

---

## ✨ Features

- **Login / Register** — Email or Phone Number tabs, with full validation
- **Browse Clinics** — 8 partner clinics with specialty tabs and named clinic pills  
- **Find Doctors** — Filter by specialty, insurance, language; sort by rating / distance / fee
- **Book Appointments** — Interactive calendar with time slot selection
- **Live Chat** — Pre-appointment messaging with the care team
- **Demo Mode** — Works fully on GitHub Pages without a backend (localStorage auth)
- **Responsive** — Mobile-friendly layout

---

## 🏗 Project Structure

```
DocLocate/
├── index.html          ← GitHub Pages entry point
├── app.jsx             ← Main React app (no build step required)
├── .gitignore
├── README.md
├── docLocate/          ← Local dev copy (same files)
│   ├── index.html
│   ├── app.jsx
│   └── index.jsx
└── backend/            ← Python Flask REST API
    ├── app.py
    └── requirements.txt
```

---

## 🚀 Running Locally

### Frontend (GitHub Pages / static)
```bash
cd DocLocate
python3 -m http.server 8000
# Open http://localhost:8000
```

### Backend (optional — enhances auth & data persistence)
```bash
cd backend
pip install -r requirements.txt
python3 app.py
# API runs on http://localhost:5001
```

The frontend auto-detects if it's running on `localhost` and tries the backend first. If the backend is unreachable, it falls back to demo mode seamlessly.

---

## 🔑 Demo Credentials

On GitHub Pages (demo mode):
1. Click **"Create one →"** to register with any email + password
2. Your account is saved locally in your browser
3. Log back in anytime with the same credentials

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (via ESM, no build step) |
| Styling | Vanilla CSS-in-JS |
| Icons | Lucide React |
| Backend | Python Flask + SQLite |
| Hosting | GitHub Pages (frontend) |

---

## 📋 Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (email or phone) |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/clinics` | List all clinics |
| GET | `/api/doctors` | List doctors (filterable) |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | Get user appointments |

---

*Built with ❤️ by lohit7dev*
