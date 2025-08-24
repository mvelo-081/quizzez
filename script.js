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
        this.currentAttemptId = null;
        
        // Quiz folder structure (configure here for stable modification)
        this.quizFolders = {
            "QUIZZEZ intro quiz": [
                'Quiz/intro_quiz.json',
            ],
            "Comp201 material": [
                'Quiz/comp201/comp201_1.json',
                'Quiz/comp201/comp201_2.json',
                'Quiz/comp201/comp201_3.json',
                'Quiz/comp201/comp201_4.json'
            ],
            "istn212 material": [
                'Quiz/istn212/istn212_1.json',
                'Quiz/istn212/istn212_2.json',
                'Quiz/istn212/istn212_3.json',
                'Quiz/istn212/istn212_4.json',
                'Quiz/istn212/istn212_5.json',
                'Quiz/istn212/istn212_6.json'
            ],
            "Comp102 material": [
                'Quiz/comp102/comp102_1.json',
                'Quiz/comp102/comp102_2.json',
                'Quiz/comp102/comp102_3.json',
                'Quiz/comp102/comp102_4.json',
            ],
            "Comp204 material": [
                'Quiz/comp204/comp204_1.json',
                'Quiz/comp204/comp204_2.json',
                'Quiz/comp204/comp204_3.json',
                'Quiz/comp204/comp204_4.json',
                'Quiz/comp204/comp204_5.json',
            ],
        };
        
        this.initializeEventListeners();
        this.setupAutoSave();
        this.discoverQuizFiles();
        this.loadSavedAttempts();
        this.loadCompletedQuizzes();
        
        // Show storage status on load
        this.checkStorageStatus();
    }

    setupAutoSave() {
        // Save state every 10 seconds while quiz is active
        setInterval(() => {
            if (this.quizData && document.getElementById('quiz-section').style.display !== 'none') {
                this.saveAttemptState();
            }
        }, 10000);

        // Save state when user leaves the page
        window.addEventListener('beforeunload', () => {
            if (this.quizData && this.currentAttemptId) {
                this.saveAttemptState();
            }
        });

        // Save state when visibility changes
        document.addEventListener('visibilitychange', () => {
            if (this.quizData && document.visibilityState === 'hidden' && this.currentAttemptId) {
                this.saveAttemptState();
            }
        });
    }

    generateAttemptId() {
        return 'attempt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveAttemptState() {
        if (!this.quizData || !this.currentAttemptId) return;

        const attempts = this.getSavedAttempts();
        const attemptIndex = attempts.findIndex(a => a.id === this.currentAttemptId);
        
        const attemptData = {
            id: this.currentAttemptId,
            quizData: this.quizData,
            currentQuestionIndex: this.currentQuestionIndex,
            userAnswers: this.userAnswers,
            quizStartTime: this.quizStartTime,
            timeSpent: this.calculateTimeSpent(),
            lastSaved: Date.now(),
            progress: ((this.currentQuestionIndex + 1) / this.quizData.questions.length * 100).toFixed(1)
        };

        if (attemptIndex >= 0) {
            attempts[attemptIndex] = attemptData;
        } else {
            attempts.push(attemptData);
        }

        this.saveToStorage('quizAttempts', attempts);
    }

    getSavedAttempts() {
        return this.getFromStorage('quizAttempts') || [];
    }

    saveCompletedQuiz() {
        const completedQuizzes = this.getCompletedQuizzes();
        const completedQuiz = {
            id: 'completed_' + Date.now(),
            title: this.quizData.title,
            score: this.score,
            totalQuestions: this.quizData.questions.length,
            percentage: Math.round((this.score / this.quizData.questions.length) * 100),
            timeSpent: this.calculateTimeSpent(),
            completedAt: Date.now(),
            userAnswers: [...this.userAnswers],
            quizData: { ...this.quizData }
        };

        completedQuizzes.push(completedQuiz);
        this.saveToStorage('completedQuizzes', completedQuizzes);

        // Remove from attempts if it exists
        if (this.currentAttemptId) {
            this.deleteAttempt(this.currentAttemptId);
        }

        this.loadCompletedQuizzes();
    }

    getCompletedQuizzes() {
        return this.getFromStorage('completedQuizzes') || [];
    }

    saveToStorage(key, data) {
        try {
            // Try localStorage first (works in most environments)
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(key, JSON.stringify(data));
                return;
            }
        } catch (error) {
            // localStorage failed, try sessionStorage
            try {
                sessionStorage.setItem(key, JSON.stringify(data));
                return;
            } catch (sessionError) {
                // Both storage methods failed, fall back to memory
                console.log('Storage not available, using memory fallback');
            }
        }
        
        // Fallback: store in memory (will be lost on page reload)
        window[key] = data;
    }

    getFromStorage(key) {
        try {
            // Try localStorage first
            if (typeof(Storage) !== "undefined" && localStorage.getItem(key)) {
                return JSON.parse(localStorage.getItem(key));
            }
        } catch (error) {
            // localStorage failed, try sessionStorage
            try {
                if (typeof(Storage) !== "undefined" && sessionStorage.getItem(key)) {
                    return JSON.parse(sessionStorage.getItem(key));
                }
            } catch (sessionError) {
                console.log('Storage read failed, checking memory fallback');
            }
        }
        
        // Fallback: check memory storage
        try {
            return window[key] || null;
        } catch (error) {
            return null;
        }
    }

    clearFromStorage(key) {
        try {
            // Clear from all possible storage locations
            if (typeof(Storage) !== "undefined") {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            }
        } catch (error) {
            console.log('Could not clear from storage:', error);
        }
        
        // Clear from memory
        if (window[key]) {
            delete window[key];
        }
    }

    loadSavedAttempts() {
        const attempts = this.getSavedAttempts();
        const container = document.getElementById('saved-attempts');
        
        if (attempts.length === 0) {
            container.innerHTML = '<p style="color: #666; margin: 20px 0;">No saved attempts found</p>';
            return;
        }

        container.innerHTML = '';
        attempts.sort((a, b) => b.lastSaved - a.lastSaved);
        
        attempts.forEach(attempt => {
            const attemptElement = document.createElement('div');
            attemptElement.style.marginBottom = '10px';
            attemptElement.style.position = 'relative';
            
            const button = document.createElement('button');
            button.className = 'quiz-item attempt-item';
            button.innerHTML = `
                <div style="text-align: left; padding-right: 40px;">
                    <div style="font-weight: bold;">${attempt.quizData.title}</div>
                    <div class="attempt-info">
                        Progress: ${attempt.progress}% | Question ${attempt.currentQuestionIndex + 1}/${attempt.quizData.questions.length} | 
                        Time: ${this.formatTime(attempt.timeSpent)} | Saved: ${this.formatDate(attempt.lastSaved)}
                    </div>
                </div>
            `;
            
            button.addEventListener('click', () => this.restoreAttempt(attempt));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-attempt';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteAttempt(attempt.id);
            });
            
            button.appendChild(deleteBtn);
            attemptElement.appendChild(button);
            container.appendChild(attemptElement);
        });
    }

    loadCompletedQuizzes() {
        const completedQuizzes = this.getCompletedQuizzes();
        const container = document.getElementById('completed-quizzes');
        
        if (completedQuizzes.length === 0) {
            container.innerHTML = '<p style="color: #666; margin: 20px 0;">No completed quizzes found</p>';
            return;
        }

        container.innerHTML = '';
        completedQuizzes.sort((a, b) => b.completedAt - a.completedAt);
        
        completedQuizzes.forEach(quiz => {
            const quizElement = document.createElement('div');
            quizElement.style.marginBottom = '10px';
            quizElement.style.position = 'relative';
            
            const button = document.createElement('button');
            button.className = 'quiz-item completed-item';
            button.innerHTML = `
                <div style="text-align: left; padding-right: 40px;">
                    <div style="font-weight: bold;">${quiz.title}</div>
                    <div class="attempt-info">
                        Score: ${quiz.score}/${quiz.totalQuestions} (${quiz.percentage}%) | 
                        Time: ${this.formatTime(quiz.timeSpent)} | Completed: ${this.formatDate(quiz.completedAt)}
                    </div>
                </div>
            `;
            
            button.addEventListener('click', () => this.reviewCompletedQuiz(quiz));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-attempt';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCompletedQuiz(quiz.id);
            });
            
            button.appendChild(deleteBtn);
            quizElement.appendChild(button);
            container.appendChild(quizElement);
        });
    }

    restoreAttempt(attempt) {
        this.quizData = attempt.quizData;
        this.currentQuestionIndex = attempt.currentQuestionIndex;
        this.userAnswers = attempt.userAnswers;
        this.quizStartTime = attempt.quizStartTime;
        this.timeSpent = attempt.timeSpent;
        this.currentAttemptId = attempt.id;

        document.getElementById('quiz-selection').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        document.getElementById('quiz-title').textContent = this.quizData.title;
        
        this.displayQuestion();
        this.showTemporaryMessage('✅ Quiz attempt restored!', 'success');
    }

    reviewCompletedQuiz(completedQuiz) {
        this.quizData = completedQuiz.quizData;
        this.userAnswers = completedQuiz.userAnswers;
        this.score = completedQuiz.score;
        this.timeSpent = completedQuiz.timeSpent;
        this.currentAttemptId = null; // Clear attempt ID for review mode

        document.getElementById('quiz-selection').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';

        document.getElementById('score-text').textContent = 
            `You scored ${this.score} out of ${this.quizData.questions.length}`;
        document.getElementById('score-percentage').innerHTML = 
            `${completedQuiz.percentage}%<br><small style="color: #666;">Time taken: ${this.formatTime(this.timeSpent)}</small>`;

        this.showTemporaryMessage('📊 Viewing completed quiz', 'success');
    }

    deleteAttempt(attemptId) {
        if (confirm('Delete this saved attempt?')) {
            const attempts = this.getSavedAttempts();
            const filteredAttempts = attempts.filter(a => a.id !== attemptId);
            this.saveToStorage('quizAttempts', filteredAttempts);
            this.loadSavedAttempts();
            this.showTemporaryMessage('Attempt deleted', 'info');
        }
    }

    deleteCompletedQuiz(quizId) {
        if (confirm('Delete this completed quiz record?')) {
            const completedQuizzes = this.getCompletedQuizzes();
            const filteredQuizzes = completedQuizzes.filter(q => q.id !== quizId);
            this.saveToStorage('completedQuizzes', filteredQuizzes);
            this.loadCompletedQuizzes();
            this.showTemporaryMessage('Quiz record deleted', 'info');
        }
    }

    clearAllData() {
        if (confirm('This will delete all saved attempts and completed quiz records. Are you sure?')) {
            this.clearFromStorage('quizAttempts');
            this.clearFromStorage('completedQuizzes');
            this.loadSavedAttempts();
            this.loadCompletedQuizzes();
            this.showTemporaryMessage('All data cleared', 'info');
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    calculateTimeSpent() {
        if (!this.quizStartTime) return this.timeSpent;
        return this.timeSpent + (Date.now() - this.quizStartTime);
    }

    checkStorageStatus() {
        let storageType = 'none';
        try {
            if (typeof(Storage) !== "undefined") {
                // Test localStorage
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                storageType = 'localStorage';
            }
        } catch (error) {
            try {
                // Test sessionStorage
                sessionStorage.setItem('test', 'test');
                sessionStorage.removeItem('test');
                storageType = 'sessionStorage';
            } catch (sessionError) {
                storageType = 'memory (data will be lost on page reload)';
            }
        }
        
        console.log(`Quiz App: Using ${storageType} for data persistence`);
        
        // Show warning if using memory storage
        if (storageType.includes('memory')) {
            setTimeout(() => {
                this.showTemporaryMessage('⚠️ Using temporary storage - data may be lost on page reload', 'error');
            }, 2000);
        }
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

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Quiz controls
        document.getElementById('start-quiz-btn').addEventListener('click', () => this.startQuiz());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('finish-btn').addEventListener('click', () => this.finishQuiz());
        // unhighlight if you want to able answer toggle
        // document.getElementById('show-answer-btn').addEventListener('click', () => this.toggleAnswer()); 
        document.getElementById('review-answers-btn').addEventListener('click', () => this.showReview());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartQuiz());
    }

    async discoverQuizFiles() {
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = '<div class="loading-spinner"></div><p>Discovering quiz files...</p>';

        this.availableQuizzes = [];

        // Process folders
        for (const [folderName, files] of Object.entries(this.quizFolders)) {
            const folderQuizzes = [];
            
            for (const filename of files) {
                try {
                    const response = await fetch(filename);
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (this.validateQuizData(data)) {
                            folderQuizzes.push({
                                file: filename,
                                title: data.title || this.formatFilename(filename),
                                description: data.description || `Quiz containing ${data.questions.length} questions`
                            });
                        }
                    }
                } catch (error) {
                    console.log(`Could not load ${filename}:`, error.message);
                }
            }

            if (folderQuizzes.length > 0) {
                this.availableQuizzes.push({
                    type: 'folder',
                    name: folderName,
                    quizzes: folderQuizzes
                });
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
        return filename
            .replace('.json', '')
            .split('/').pop()
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
        
        this.availableQuizzes.forEach(item => {
            if (item.type === 'folder') {
                const folderElement = document.createElement('div');
                folderElement.className = 'folder';
                
                const folderHeader = document.createElement('div');
                folderHeader.className = 'folder-header';
                folderHeader.innerHTML = `
                    <span>📁 ${item.name} (${item.quizzes.length} quizzes)</span>
                    <span class="folder-toggle">▼</span>
                `;
                
                const folderContent = document.createElement('div');
                folderContent.className = 'folder-content';
                
                item.quizzes.forEach(quiz => {
                    const button = document.createElement('button');
                    button.className = 'quiz-item';
                    button.innerHTML = `
                        <div style="text-align: left;">
                            <div style="font-weight: bold; margin-bottom: 5px;">${quiz.title}</div>
                            <div style="font-size: 0.9rem; opacity: 0.8;">${quiz.description}</div>
                        </div>
                    `;
                    button.addEventListener('click', () => this.loadQuiz(quiz.file));
                    folderContent.appendChild(button);
                });
                
                folderHeader.addEventListener('click', () => {
                    folderContent.classList.toggle('open');
                    const toggle = folderHeader.querySelector('.folder-toggle');
                    toggle.classList.toggle('open');
                    toggle.textContent = toggle.classList.contains('open') ? '▲' : '▼';
                });
                
                folderElement.appendChild(folderHeader);
                folderElement.appendChild(folderContent);
                quizList.appendChild(folderElement);
            }
        });

        // Add refresh button
        const refreshButton = document.createElement('button');
        refreshButton.className = 'btn btn-secondary';
        refreshButton.textContent = '🔄 Refresh Quiz List';
        refreshButton.style.marginTop = '1rem';
        refreshButton.style.marginRight = '1rem';
        refreshButton.addEventListener('click', () => {
            this.discoverQuizFiles();
        });
        
        // Add clear data button (for debugging/maintenance)
        const clearButton = document.createElement('button');
        clearButton.className = 'btn btn-secondary';
        clearButton.textContent = '🗑️ Clear All Data';
        clearButton.style.marginTop = '1rem';
        clearButton.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
        clearButton.addEventListener('click', () => {
            this.clearAllData();
        });
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '1rem';
        buttonContainer.appendChild(refreshButton);
        buttonContainer.appendChild(clearButton);
        
        quizList.appendChild(buttonContainer);
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
            this.currentAttemptId = null; // Reset attempt ID for new quiz
            
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

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    startQuiz() {
        if (!this.quizData) return;

        // Generate new attempt ID for fresh start
        this.currentAttemptId = this.generateAttemptId();

        document.getElementById('quiz-selection').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        
        document.getElementById('quiz-title').textContent = this.quizData.title;
        this.currentQuestionIndex = 0;
        this.showingAnswer = false;
        this.quizStartTime = Date.now();
        this.timeSpent = 0;
        
        this.displayQuestion();
        this.saveAttemptState(); // Save initial state
    }

    displayQuestion() {
        const question = this.quizData.questions[this.currentQuestionIndex];
        const totalQuestions = this.quizData.questions.length;
        
        // Update progress
        document.getElementById('progress-info').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${totalQuestions}`;
        
        // Display question
        document.getElementById('question-text').innerHTML = question.question;
        
        // Display options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = option;
            optionElement.addEventListener('click', () => this.selectOption(index));
            
            // Show previous selection
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
            optionsContainer.appendChild(optionElement);
        });
        
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
        this.saveAttemptState(); // Save state after each answer
    }

    toggleAnswer() {
        const question = this.quizData.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');
        
        if (this.showingAnswer) {
            this.hideAnswer();
        } else {
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
            this.saveAttemptState();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.saveAttemptState();
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
        this.timeSpent = this.calculateTimeSpent();
        
        // Save completed quiz
        this.saveCompletedQuiz();
        
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        const totalQuestions = this.quizData.questions.length;
        const percentage = Math.round((this.score / totalQuestions) * 100);
        
        document.getElementById('score-text').textContent = 
            `You scored ${this.score} out of ${totalQuestions}`;
        document.getElementById('score-percentage').innerHTML = 
            `${percentage}%<br><small style="color: #666;">Time taken: ${this.formatTime(this.timeSpent)}</small>`;
        
        this.showTemporaryMessage('🎉 Quiz completed!', 'success');
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

    restartQuiz() {
        this.quizData = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.showingAnswer = false;
        this.score = 0;
        this.quizStartTime = null;
        this.timeSpent = 0;
        this.currentAttemptId = null;
        
        document.getElementById('load-info').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('quiz-selection').style.display = 'block';
        document.getElementById('review-section').style.display = 'none';
        
        // Switch to available quizzes tab
        this.switchTab('available');
        
        this.displayQuizList();
        this.loadSavedAttempts();
        this.loadCompletedQuizzes();
    }
}

// Initialize the quiz app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});