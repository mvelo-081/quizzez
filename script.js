class QuizApp {
    constructor() {
        this.quizData = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.showingAnswer = false;
        this.score = 0;
        this.availableQuizzes = [];
        this.quizStartTime = null;
        this.timeSpent = 0;
        
        this.initializeEventListeners();
        this.setupAutoSave();
        this.loadSavedState();
        this.discoverQuizFiles();
    }

    setupAutoSave() {
        // Save state every 10 seconds while quiz is active
        setInterval(() => {
            if (this.quizData && document.getElementById('quiz-section').style.display !== 'none') {
                this.saveQuizState();
            }
        }, 10000);

        // Save state when user leaves the page
        window.addEventListener('beforeunload', () => {
            if (this.quizData) {
                this.saveQuizState();
            }
        });

        // Save state when visibility changes (tab switch, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (this.quizData && document.visibilityState === 'hidden') {
                this.saveQuizState();
            }
        });
    }

    saveQuizState() {
        if (!this.quizData) return;

        const state = {
            quizData: this.quizData,
            currentQuestionIndex: this.currentQuestionIndex,
            userAnswers: this.userAnswers,
            quizStartTime: this.quizStartTime,
            timeSpent: this.calculateTimeSpent(),
            timestamp: Date.now(),
            quizInProgress: document.getElementById('quiz-section').style.display !== 'none',
            showingResults: document.getElementById('results-section').style.display !== 'none'
        };

        try {
            // Try to use localStorage (will work in regular browsers)
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem('quizAppState', JSON.stringify(state));
            } else {
                // Fallback: store in a global variable (limited persistence)
                window.quizAppSavedState = state;
            }
        } catch (error) {
            // Fallback for environments where localStorage is restricted
            window.quizAppSavedState = state;
        }
    }

    loadSavedState() {
        let savedState = null;

        try {
            // Try to load from localStorage first
            if (typeof(Storage) !== "undefined" && localStorage.getItem('quizAppState')) {
                savedState = JSON.parse(localStorage.getItem('quizAppState'));
            } else if (window.quizAppSavedState) {
                // Fallback: load from global variable
                savedState = window.quizAppSavedState;
            }
        } catch (error) {
            console.log('Could not load saved state:', error);
            return;
        }

        if (!savedState) return;

        // Check if saved state is recent (within last 24 hours)
        const timeSinceLastSave = Date.now() - savedState.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (timeSinceLastSave > maxAge) {
            this.clearSavedState();
            return;
        }

        // Show restore option to user
        if (savedState.quizData && (savedState.quizInProgress || savedState.showingResults)) {
            this.showRestoreOption(savedState);
        }
    }

    showRestoreOption(savedState) {
        const restoreDiv = document.createElement('div');
        restoreDiv.className = 'file-info';
        restoreDiv.style.background = '#fff3e0';
        restoreDiv.style.borderLeft = '5px solid #ff9800';
        restoreDiv.style.color = '#e65100';
        restoreDiv.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong>🔄 Previous Quiz Session Found!</strong>
                <p style="margin: 0.5rem 0;">Quiz: "${savedState.quizData.title}"</p>
                <p style="margin: 0.5rem 0;">Progress: Question ${savedState.currentQuestionIndex + 1} of ${savedState.quizData.questions.length}</p>
                <p style="margin: 0.5rem 0;">Time spent: ${this.formatTime(savedState.timeSpent)}</p>
            </div>
            <button id="restore-quiz-btn" class="btn btn-primary" style="margin-right: 1rem;">Continue Quiz</button>
            <button id="dismiss-restore-btn" class="btn btn-secondary">Start Fresh</button>
        `;

        const quizSelection = document.getElementById('quiz-selection');
        quizSelection.insertBefore(restoreDiv, quizSelection.firstChild);

        document.getElementById('restore-quiz-btn').addEventListener('click', () => {
            this.restoreQuizState(savedState);
            restoreDiv.remove();
        });

        document.getElementById('dismiss-restore-btn').addEventListener('click', () => {
            this.clearSavedState();
            restoreDiv.remove();
        });
    }

    restoreQuizState(savedState) {
        this.quizData = savedState.quizData;
        this.currentQuestionIndex = savedState.currentQuestionIndex;
        this.userAnswers = savedState.userAnswers;
        this.quizStartTime = savedState.quizStartTime;
        this.timeSpent = savedState.timeSpent;

        if (savedState.showingResults) {
            // Restore results view
            this.calculateScore();
            document.getElementById('quiz-selection').style.display = 'none';
            document.getElementById('quiz-section').style.display = 'none';
            document.getElementById('results-section').style.display = 'block';
            
            const totalQuestions = this.quizData.questions.length;
            const percentage = Math.round((this.score / totalQuestions) * 100);
            
            document.getElementById('score-text').textContent = 
                `You scored ${this.score} out of ${totalQuestions}`;
            document.getElementById('score-percentage').textContent = `${percentage}%`;
        } else if (savedState.quizInProgress) {
            // Restore quiz in progress
            document.getElementById('quiz-selection').style.display = 'none';
            document.getElementById('quiz-section').style.display = 'block';
            document.getElementById('quiz-title').textContent = this.quizData.title;
            this.displayQuestion();
        }

        // Show restoration message
        this.showTemporaryMessage('✅ Quiz restored successfully!', 'success');
    }

    clearSavedState() {
        try {
            if (typeof(Storage) !== "undefined") {
                localStorage.removeItem('quizAppState');
            }
            if (window.quizAppSavedState) {
                delete window.quizAppSavedState;
            }
        } catch (error) {
            console.log('Could not clear saved state:', error);
        }
    }

    calculateTimeSpent() {
        if (!this.quizStartTime) return this.timeSpent;
        return this.timeSpent + (Date.now() - this.quizStartTime);
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'file-info' : 'error-message';
        messageDiv.textContent = message;
        
        const container = document.querySelector('.container .header');
        container.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    initializeEventListeners() {
        document.getElementById('start-quiz-btn').addEventListener('click', () => this.startQuiz());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('finish-btn').addEventListener('click', () => this.finishQuiz());
        document.getElementById('show-answer-btn').addEventListener('click', () => this.toggleAnswer());
        document.getElementById('review-answers-btn').addEventListener('click', () => this.showReview());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    async discoverQuizFiles() {
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = '<div class="loading-spinner"></div><p>Discovering quiz files...</p>';

        // Common quiz filenames to try
        const possibleQuizFiles = [
            'Quiz/quiz1.json','Quiz/quiz2.json','Quiz/quiz3.json','Quiz/quiz4.json'
        ];

        this.availableQuizzes = [];

        // Try to load each possible quiz file
        for (const filename of possibleQuizFiles) {
            try {
                const response = await fetch(filename);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Validate quiz data structure
                    if (this.validateQuizData(data)) {
                        this.availableQuizzes.push({
                            file: filename,
                            title: data.title || this.formatFilename(filename),
                            description: data.description || `Quiz containing ${data.questions.length} questions`
                        });
                    }
                }
            } catch (error) {
                // Silently continue - file doesn't exist or isn't valid JSON
                console.log(`Could not load ${filename}:`, error.message);
            }
        }

        this.displayQuizList();
    }

    validateQuizData(data) {
        return data && 
               data.questions && 
               Array.isArray(data.questions) &&
               data.questions.length > 0 &&
               data.questions.every(q => 
                   q.question && 
                   q.options && 
                   Array.isArray(q.options) && 
                   q.options.length >= 2 &&
                   typeof q.correctAnswer === 'number' &&
                   q.correctAnswer >= 0 &&
                   q.correctAnswer < q.options.length
               );
    }

    formatFilename(filename) {
        // Convert filename to readable title
        return filename
            .replace('.json', '')
            .replace(/[_-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    displayQuizList() {
        const quizList = document.getElementById('quiz-list');
        
        if (this.availableQuizzes.length === 0) {
            quizList.innerHTML = `
                <div class="no-quizzes">
                    <p>No quiz files found!</p>
                    <p>Please add JSON quiz files to your project folder.</p>
                    <details style="margin-top: 1rem; text-align: left;">
                        <summary style="cursor: pointer; color: #1976D2;">Expected JSON format:</summary>
                        <pre style="background: #f5f5f5; padding: 1rem; margin-top: 0.5rem; border-radius: 5px; font-size: 0.9rem; overflow-x: auto;">
{
  "title": "My Quiz",
  "description": "Optional description",
  "questions": [
    {
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    }
  ]
}</pre>
                    </details>
                </div>
            `;
            return;
        }

        quizList.innerHTML = '';
        
        this.availableQuizzes.forEach(quiz => {
            const quizElement = document.createElement('div');
            quizElement.style.marginBottom = '15px';
            
            const button = document.createElement('button');
            button.className = 'quiz-item';
            button.innerHTML = `
                <div style="text-align: left;">
                    <div style="font-weight: bold; margin-bottom: 5px;">${quiz.title}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${quiz.description}</div>
                </div>
            `;
            button.addEventListener('click', () => this.loadQuiz(quiz.file));
            
            quizElement.appendChild(button);
            quizList.appendChild(quizElement);
        });

        // Add refresh button
        const refreshButton = document.createElement('button');
        refreshButton.className = 'btn btn-secondary';
        refreshButton.textContent = '🔄 Refresh Quiz List';
        refreshButton.style.marginTop = '1rem';
        refreshButton.addEventListener('click', () => {
            this.discoverQuizFiles();
        });
        quizList.appendChild(refreshButton);
    }

    async loadQuiz(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (!this.validateQuizData(data)) {
                throw new Error('Invalid quiz format');
            }

            this.quizData = data;
            this.userAnswers = new Array(this.quizData.questions.length).fill(null);
            
            document.getElementById('load-info').style.display = 'block';
        } catch (error) {
            this.showError(`Error loading quiz: ${filename}. ${error.message}`);
        }
    }

    showError(message) {
        const quizList = document.getElementById('quiz-list');
        const existingError = quizList.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        quizList.appendChild(errorDiv);

        // Auto remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    startQuiz() {
        if (!this.quizData) return;

        document.getElementById('quiz-selection').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        
        document.getElementById('quiz-title').textContent = this.quizData.title;
        this.currentQuestionIndex = 0;
        this.showingAnswer = false;
        this.quizStartTime = Date.now();
        this.timeSpent = 0;
        
        // Clear any existing saved state when starting fresh
        this.clearSavedState();
        
        this.displayQuestion();
        this.saveQuizState(); // Save initial state
    }

    displayQuestion() {
        const question = this.quizData.questions[this.currentQuestionIndex];
        const totalQuestions = this.quizData.questions.length;
        
        // Update progress
        document.getElementById('progress-info').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${totalQuestions}`;
        
        // Display question
        document.getElementById('question-text').textContent = question.question;
        
        // Display options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectOption(index));
            
            // Show previous selection
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
            optionsContainer.appendChild(optionElement);
        });
        
        // Update button states
        this.updateButtonStates();
        this.hideAnswer();
    }

    selectOption(optionIndex) {
        if (this.showingAnswer) return;
        
        // Remove previous selection
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection to clicked option
        document.querySelectorAll('.option')[optionIndex].classList.add('selected');
        
        // Store user answer
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        
        this.updateButtonStates();
        this.saveQuizState(); // Save state after each answer
    }

    toggleAnswer() {
        const question = this.quizData.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');
        
        if (this.showingAnswer) {
            this.hideAnswer();
        } else {
            // Show correct and incorrect answers
            options.forEach((option, index) => {
                option.classList.remove('correct', 'incorrect');
                if (index === question.correctAnswer) {
                    option.classList.add('correct');
                } else if (this.userAnswers[this.currentQuestionIndex] === index) {
                    option.classList.add('incorrect');
                }
            });
            
            document.getElementById('show-answer-btn').textContent = 'Hide Answer';
            this.showingAnswer = true;
        }
    }

    hideAnswer() {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect');
        });
        
        document.getElementById('show-answer-btn').textContent = 'Show Answer';
        this.showingAnswer = false;
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            this.saveQuizState(); // Save navigation state
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.saveQuizState(); // Save navigation state
        } else {
            this.finishQuiz();
        }
    }

    updateButtonStates() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.quizData.questions.length - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
    }

    calculateScore() {
        this.score = 0;
        this.quizData.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correctAnswer) {
                this.score++;
            }
        });
    }

    finishQuiz() {
        this.calculateScore();
        
        // Update time spent
        this.timeSpent = this.calculateTimeSpent();
        
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        const totalQuestions = this.quizData.questions.length;
        const percentage = Math.round((this.score / totalQuestions) * 100);
        
        document.getElementById('score-text').textContent = 
            `You scored ${this.score} out of ${totalQuestions}`;
        document.getElementById('score-percentage').innerHTML = 
            `${percentage}%<br><small style="color: #666;">Time taken: ${this.formatTime(this.timeSpent)}</small>`;
        
        this.saveQuizState(); // Save final results state
    }

    showReview() {
        const reviewSection = document.getElementById('review-section');
        const reviewContainer = document.getElementById('review-container');
        
        reviewContainer.innerHTML = '';
        
        this.quizData.questions.forEach((question, index) => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review-question';
            
            const userAnswer = this.userAnswers[index];
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer === correctAnswer;
            
            reviewElement.innerHTML = `
                <div class="review-title">
                    ${isCorrect ? '✅' : '❌'} Question ${index + 1}: ${question.question}
                </div>
                <div class="answer-comparison">
                    <div class="answer-item your-answer">
                        Your Answer: ${userAnswer !== null ? question.options[userAnswer] : 'Not answered'}
                    </div>
                    <div class="answer-item correct-answer">
                        Correct Answer: ${question.options[correctAnswer]}
                    </div>
                </div>
            `;
            
            reviewContainer.appendChild(reviewElement);
        });
        
        reviewSection.style.display = 'block';
        reviewSection.scrollIntoView({ behavior: 'smooth' });
    }

    restart() {
        this.quizData = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.showingAnswer = false;
        this.score = 0;
        this.quizStartTime = null;
        this.timeSpent = 0;
        
        // Clear saved state when restarting
        this.clearSavedState();
        
        document.getElementById('load-info').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('quiz-selection').style.display = 'block';
        document.getElementById('review-section').style.display = 'none';
        
        this.displayQuizList();
    }
}

// Initialize the quiz app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const quizApp = new QuizApp();

});
