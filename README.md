# 📌 Django + React.js Project Setup Guide  

## 🔹 Prerequisites  
Make sure you have the following installed:  
- **Python** (= 3.13.2)  
- **Node.js** (= v22.14.0)  
---

# Project Name

KUTOM CRM

## Features
- currently working on it...

## Technologies Used
- **Backend:** Django, Django REST Framework
- **Frontend:** React.js & Tailwind & DaisyUi
- **Database:** By default Sqlite later used (MYSQL)

## Setup Instructions

### Prerequisites
Ensure you have the following installed:
- Python (>= 3.8)
- Node.js (>= 17.x)

### Backend Setup
1. Clone the repository:
   ```bash

   git clone https://github.com/sumitnn/KUTOM-CRM.git
   
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Apply migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   The backend will be running at `http://127.0.0.1:8000/`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:5173/`




## Troubleshooting
- If the frontend does not fetch data, ensure the backend is running..


