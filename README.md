# QUIZZEZ

🎯 **QUIZZEZ** is a browser-based quiz application built using **HTML, CSS, and JavaScript**.  
It allows users to take interactive quizzes, check their progress, and review their answers.  
The project is fully static and deployed with **GitHub Pages**.

---

## 🌍 Live Demo

🔗 [View 🔥](https://mvelo-081.github.io/quizzez/)

---

## ✨ Features

- **Multiple Quizzes** – Supports different subjects/topics.
- **Question Navigation** – Answer questions one by one.
- **Answer Checking** – Immediate feedback on answers.
- **Progress Tracking** – Shows how far along you are in a quiz.
- **Retry Options** – Restart completed quizzes anytime.
- **Review Mode** – See correct answers after finishing.
- **Offline Support** – Works locally without a server (but must clone the repo).

---

## 📂 Project Structure

```text
quizzez/
│
├── index.html
├── style.css
├── script.js
│
├── assets/
│   └── logo.png
│
├── Quiz/
│   └── quiz1.json   # store quiz jsons
│
└── README.md
```

---

## ⚙️ How It Works

1. **Homepage (`index.html`)**  
   - Displays the landing page with options like **Start Quiz**, **Continue Quiz**, and **Review Answers**.

2. **Quiz Data (`Quiz/`)**  
   - Quizzes are stored as JSON files.  
   - Each quiz has:
     ```json
     {
       "question": "What is JVM in Java?",
       "options": ["Java Virtual Machine", "Java Vendor Model", "Joint Variable Method", "None of the above"],
       "answer": 3
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
- Go to the `Quiz/` folder.
- Create a new JSON file, e.g., python.json.
- Follow this structure:
```text
   "Python quiz 1" : [
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
```
- Update script.js or menu code to load your new quiz.

---

##  Installation (Local Setup)

To run the project locally:

1. Clone the repository:
    ```bash
    git clone https://github.com/mvelo-081/quizzez.git
    cd quizzez
    ```

2. Then run the index.html using Live server (if you are using VS code)

---

## EXCLAMER 
- Partially vibe coded `50%`🕺
- Quiz are extracted using AI , so there might exist errors in questions and answers
