# QUIZZEZ

🎯 **QUIZZEZ** is a browser based quiz application built using **HTML, CSS, and JavaScript**.  
It allows users to take interactive quizzes, check their progress, and review their answers.  
The project is fully static and deployed with **GitHub Pages**.

---
## 🕺 Inspiration

I thought of this application when I was busy revising for a test using question paper
which were multiple choice.This gave me a hard time to try and answer this questions with answers
visible to my site. So I thought fo an application like this which I will be able to upload this 
question, and make then quizzes , which are retakeable as many time as you like.
Then this was whenthis application idea was born.
This is not the final product, as time goes by, I will be adding new features that will be
solving the problem I incounter in my everyday life.

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
- **Offline Support** – Works locally without a server
- **Use of localStorage and sessionStorage** - Saves your progress without the use of a database

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
         "Title": "General question quiz 1"
         "Questions" : [
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
      follow the structure that is specified (above)[## ⚙️ How It Works]
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

## ⏳ incoming development

- Enable to solve coding problems in the web-appliction, and get feadback about your solution.
- Enable to answer long question, and have a model which will able to grade you with out being bias of the users solution,
  and guide them further into understanding the tested concept.
- I am busy with a research of implementing my own model which will be able to extract quiz question in any type of file format.
  
---

## EXCLAMER 

- Quiz are extracted using AI , so there might exist errors in questions and answers
- On mobile devices, I recommend that you use desktop mode on your browser (It is not fully optimised for mobile devices)
