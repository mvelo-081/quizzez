# QUIZZEZ

🎯 **QUIZZEZ** is a browser-based quiz application built using **HTML, CSS, and JavaScript**.  
It allows users to take interactive quizzes, check their progress, and review their answers.  
The project is fully static and deployed with **GitHub Pages**.

---

## 🌍 Live Demo

🔗 [QUIZZEZ on GitHub Pages](https://mvelo-081.github.io/quizzez/)

---

## ✨ Features

- 📚 **Multiple Quizzes** – Supports different subjects/topics.
- 🧠 **Question Navigation** – Answer questions one by one.
- ✅ **Answer Checking** – Immediate feedback on answers.
- 📊 **Progress Tracking** – Shows how far along you are in a quiz.
- 🔄 **Retry Options** – Restart completed quizzes anytime.
- 📝 **Review Mode** – See correct answers after finishing.
- 💻 **Offline Support** – Works locally without a server.

---

## 📂 Project Structure

quizzez/
│
├── index.html 
├── style.css 
├── script.js 
│
├── assets/
│ └── quiz1.json # store quiz jsons
│
├── Quiz/
│ └── quiz1.json # store quiz jsons
│
└── README.md

---

## ⚙️ How It Works

1. **Homepage (`index.html`)**  
   - Displays the landing page with options like **Start Quiz**, **Continue Quiz**, and **Review Answers**.

2. **Quiz Data (`/quizzes/`)**  
   - Quizzes are stored as JSON files (or embedded inside JS).  
   - Each quiz has:
     ```json
     {
       "question": "What is JVM in Java?",
       "options": ["Java Virtual Machine", "Java Vendor Model", "Joint Variable Method", "None of the above"],
       "answer": "Java Virtual Machine"
     }
     ```

3. **Quiz Engine (`script.js`)**  
   - Loads quiz data dynamically.  
   - Tracks:
     - Current question index  
     - User’s selected answers  
     - Correct vs incorrect answers  
   - Updates UI accordingly.

4. **Styles (`style.css`)**  
   - Provides a clean, responsive interface with readable typography and simple navigation buttons.

---

## 📖 Adding a New Quiz

- To create a new quiz:

- Go to the quizzes/ folder.

- Create a new JSON file, e.g., python.json.

- Follow this structure:

   [
     {
       "question": "What is Python?",
       "options": ["Snake", "Programming Language", "Food", "Car"],
       "answer": 1
     },
     {
       "question": "Who created Python?",
       "options": ["Guido van Rossum", "James Gosling", "Dennis Ritchie", "Linus Torvalds"],
       "answer": 3
     }
   ]


- Update script.js or menu code to load your new quiz.
