// SoloTask - Minimalist Task Manager
// Main JavaScript file handling all functionality

class SoloTask {
    constructor() {
        this.boards = [];
        this.currentBoard = 'inbox';
        this.tasks = {};
        this.editingTask = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderBoards();
        this.renderTasks();
        this.updateTaskCount();
    }

    // Data Management
    loadData() {
        const savedBoards = localStorage.getItem('solotask-boards');
        const savedTasks = localStorage.getItem('solotask-tasks');
        const savedCurrentBoard = localStorage.getItem('solotask-current-board');

        if (savedBoards) {
            this.boards = JSON.parse(savedBoards);
        } else {
            this.boards = [
                { id: 'inbox', name: 'Inbox', color: 'blue' },
                { id: 'projects', name: 'Projects', color: 'green' },
                { id: 'next-actions', name: 'Next Actions', color: 'purple' }
            ];
        }

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        } else {
            this.tasks = {};
            this.boards.forEach(board => {
                this.tasks[board.id] = [];
            });
        }

        if (savedCurrentBoard && this.boards.some(b => b.id === savedCurrentBoard)) {
            this.currentBoard = savedCurrentBoard;
        }
    }

    saveData() {
        localStorage.setItem('solotask-boards', JSON.stringify(this.boards));
        localStorage.setItem('solotask-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('solotask-current-board', this.currentBoard);
    }

    // Event Listeners
    setupEventListeners() {
        // Task management
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Board management
        document.getElementById('add-board-btn').addEventListener('click', () => this.showBoardModal());
        document.getElementById('save-board-btn').addEventListener('click', () => this.saveBoardModal());
        document.getElementById('cancel-board-btn').addEventListener('click', () => this.hideBoardModal());
        document.getElementById('delete-board-btn').addEventListener('click', () => this.deleteCurrentBoard());

        // Modal events
        document.getElementById('board-modal').addEventListener('click', (e) => {
            if (e.target.id === 'board-modal') this.hideBoardModal();
        });

        document.getElementById('board-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveBoardModal();
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        document.getElementById('task-input').focus();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.showBoardModal();
                        break;
                }
            }
        });
    }

    // Task Management
    addTask() {
        const taskInput = document.getElementById('task-input');
        const dueDateInput = document.getElementById('due-date-input');
        const prioritySelect = document.getElementById('priority-select');

        const title = taskInput.value.trim();
        if (!title) return;

        const task = {
            id: Date.now().toString(),
            title: title,
            completed: false,
            priority: prioritySelect.value,
            dueDate: this.parseDueDate(dueDateInput.value.trim()),
            createdAt: new Date().toISOString(),
            boardId: this.currentBoard
        };

        if (!this.tasks[this.currentBoard]) {
            this.tasks[this.currentBoard] = [];
        }

        this.tasks[this.currentBoard].push(task);
        this.saveData();
        this.renderTasks();
        this.updateTaskCount();

        // Clear inputs
        taskInput.value = '';
        dueDateInput.value = '';
        prioritySelect.value = 'low';
        taskInput.focus();
    }

    editTask(taskId) {
        const task = this.tasks[this.currentBoard].find(t => t.id === taskId);
        if (!task) return;

        this.editingTask = taskId;
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const titleElement = taskElement.querySelector('.task-title');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.title;
        input.className = 'flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
        
        input.addEventListener('blur', () => this.saveTaskEdit(taskId, input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveTaskEdit(taskId, input.value);
            } else if (e.key === 'Escape') {
                this.cancelTaskEdit();
            }
        });

        titleElement.replaceWith(input);
        input.focus();
        input.select();
    }

    saveTaskEdit(taskId, newTitle) {
        const task = this.tasks[this.currentBoard].find(t => t.id === taskId);
        if (task && newTitle.trim()) {
            task.title = newTitle.trim();
            this.saveData();
        }
        this.editingTask = null;
        this.renderTasks();
    }

    cancelTaskEdit() {
        this.editingTask = null;
        this.renderTasks();
    }

    toggleTask(taskId) {
        const task = this.tasks[this.currentBoard].find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveData();
            this.renderTasks();
            this.updateTaskCount();
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks[this.currentBoard] = this.tasks[this.currentBoard].filter(t => t.id !== taskId);
            this.saveData();
            this.renderTasks();
            this.updateTaskCount();
        }
    }

    // Board Management
    showBoardModal(boardId = null) {
        const modal = document.getElementById('board-modal');
        const titleElement = document.getElementById('board-modal-title');
        const inputElement = document.getElementById('board-name-input');

        if (boardId) {
            const board = this.boards.find(b => b.id === boardId);
            titleElement.textContent = 'Edit Board';
            inputElement.value = board.name;
            inputElement.dataset.editingId = boardId;
        } else {
            titleElement.textContent = 'New Board';
            inputElement.value = '';
            delete inputElement.dataset.editingId;
        }

        modal.classList.remove('hidden');
        inputElement.focus();
    }

    hideBoardModal() {
        document.getElementById('board-modal').classList.add('hidden');
        document.getElementById('board-name-input').value = '';
        delete document.getElementById('board-name-input').dataset.editingId;
    }

    saveBoardModal() {
        const inputElement = document.getElementById('board-name-input');
        const name = inputElement.value.trim();
        
        if (!name) return;

        if (inputElement.dataset.editingId) {
            // Edit existing board
            const board = this.boards.find(b => b.id === inputElement.dataset.editingId);
            if (board) {
                board.name = name;
            }
        } else {
            // Create new board
            const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const board = {
                id: id,
                name: name,
                color: this.getRandomColor()
            };
            this.boards.push(board);
            this.tasks[id] = [];
        }

        this.saveData();
        this.renderBoards();
        this.hideBoardModal();
    }

    switchBoard(boardId) {
        this.currentBoard = boardId;
        this.saveData();
        this.renderBoards();
        this.renderTasks();
        this.updateTaskCount();
        this.updateCurrentBoardDisplay();
    }

    deleteCurrentBoard() {
        if (this.boards.length <= 1) {
            alert('You must have at least one board.');
            return;
        }

        if (confirm('Are you sure you want to delete this board and all its tasks?')) {
            this.boards = this.boards.filter(b => b.id !== this.currentBoard);
            delete this.tasks[this.currentBoard];
            this.currentBoard = this.boards[0].id;
            this.saveData();
            this.renderBoards();
            this.renderTasks();
            this.updateTaskCount();
            this.updateCurrentBoardDisplay();
        }
    }

    // Rendering
    renderBoards() {
        const boardsList = document.getElementById('boards-list');
        boardsList.innerHTML = '';

        this.boards.forEach(board => {
            const boardElement = document.createElement('div');
            boardElement.className = `flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                board.id === this.currentBoard ? 'board-active' : ''
            }`;

            const taskCount = this.tasks[board.id] ? this.tasks[board.id].length : 0;
            const completedCount = this.tasks[board.id] ? this.tasks[board.id].filter(t => t.completed).length : 0;

            boardElement.innerHTML = `
                <div class="flex items-center flex-1" onclick="app.switchBoard('${board.id}')">
                    <div class="w-3 h-3 rounded-full bg-${board.color}-500 mr-2"></div>
                    <span class="font-medium text-gray-700">${board.name}</span>
                    <span class="ml-auto text-sm text-gray-500">${taskCount}</span>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="app.showBoardModal('${board.id}')" class="p-1 hover:bg-gray-200 rounded transition-colors">
                        <i class="fas fa-edit text-xs text-gray-400"></i>
                    </button>
                </div>
            `;

            boardsList.appendChild(boardElement);
        });
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        const emptyState = document.getElementById('empty-state');
        
        const currentTasks = this.tasks[this.currentBoard] || [];
        
        if (currentTasks.length === 0) {
            tasksContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tasksContainer.style.display = 'block';
        emptyState.style.display = 'none';
        tasksContainer.innerHTML = '';

        // Sort tasks: incomplete first, then by priority, then by due date
        const sortedTasks = [...currentTasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        sortedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `flex items-center p-4 hover:bg-gray-50 transition-colors priority-${task.priority}`;
            taskElement.setAttribute('data-task-id', task.id);

            const dueDateDisplay = task.dueDate ? this.formatDueDate(task.dueDate) : '';
            const priorityIcon = this.getPriorityIcon(task.priority);

            taskElement.innerHTML = `
                <div class="flex items-center flex-1">
                    <input 
                        type="checkbox" 
                        ${task.completed ? 'checked' : ''} 
                        class="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        onchange="app.toggleTask('${task.id}')"
                    >
                    <div class="flex-1">
                        <div class="flex items-center">
                            <span class="task-title ${task.completed ? 'task-completed' : ''} text-gray-800">${task.title}</span>
                            ${priorityIcon}
                        </div>
                        ${dueDateDisplay ? `<div class="text-sm text-gray-500 mt-1">${dueDateDisplay}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="app.editTask('${task.id}')" class="p-1 hover:bg-gray-200 rounded transition-colors">
                        <i class="fas fa-edit text-gray-400"></i>
                    </button>
                    <button onclick="app.deleteTask('${task.id}')" class="p-1 hover:bg-gray-200 rounded transition-colors">
                        <i class="fas fa-trash text-gray-400"></i>
                    </button>
                </div>
            `;

            tasksContainer.appendChild(taskElement);
        });
    }

    updateTaskCount() {
        const taskCount = document.getElementById('task-count');
        const currentTasks = this.tasks[this.currentBoard] || [];
        const totalTasks = currentTasks.length;
        const completedTasks = currentTasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        if (totalTasks === 0) {
            taskCount.textContent = '0 tasks';
        } else if (pendingTasks === 0) {
            taskCount.textContent = `${totalTasks} tasks completed`;
        } else {
            taskCount.textContent = `${pendingTasks} of ${totalTasks} tasks`;
        }
    }

    updateCurrentBoardDisplay() {
        const currentBoard = this.boards.find(b => b.id === this.currentBoard);
        document.getElementById('current-board-name').textContent = currentBoard ? currentBoard.name : 'Inbox';
        
        const deleteBtn = document.getElementById('delete-board-btn');
        if (this.boards.length > 1) {
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    // Utility Functions
    parseDueDate(dateString) {
        if (!dateString) return null;

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const lowerStr = dateString.toLowerCase();

        // Handle common natural language dates
        if (lowerStr === 'today') {
            return today.toISOString().split('T')[0];
        } else if (lowerStr === 'tomorrow') {
            return tomorrow.toISOString().split('T')[0];
        } else if (lowerStr.includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return nextWeek.toISOString().split('T')[0];
        } else if (lowerStr.includes('next monday')) {
            const nextMonday = new Date(today);
            const daysUntilMonday = (8 - nextMonday.getDay()) % 7;
            nextMonday.setDate(nextMonday.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
            return nextMonday.toISOString().split('T')[0];
        }

        // Try to parse as regular date
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }

        return null;
    }

    formatDueDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (dateStr === todayStr) {
            return '📅 Today';
        } else if (dateStr === tomorrowStr) {
            return '📅 Tomorrow';
        } else if (date < today) {
            return '🔴 Overdue';
        } else {
            return `📅 ${date.toLocaleDateString()}`;
        }
    }

    getPriorityIcon(priority) {
        switch (priority) {
            case 'high':
                return '<i class="fas fa-exclamation-triangle text-red-500 ml-2"></i>';
            case 'medium':
                return '<i class="fas fa-exclamation-circle text-yellow-500 ml-2"></i>';
            case 'low':
                return '<i class="fas fa-info-circle text-green-500 ml-2"></i>';
            default:
                return '';
        }
    }

    getRandomColor() {
        const colors = ['blue', 'green', 'purple', 'pink', 'indigo', 'teal', 'orange'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');
        
        if (body.classList.contains('dark')) {
            body.classList.remove('dark');
            themeToggle.innerHTML = '<i class="fas fa-moon text-gray-600"></i>';
            localStorage.setItem('solotask-theme', 'light');
        } else {
            body.classList.add('dark');
            themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
            localStorage.setItem('solotask-theme', 'dark');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('solotask-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SoloTask();
    window.app.loadTheme();
    window.app.updateCurrentBoardDisplay();
});

// Handle page visibility changes to save data
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.app) {
        window.app.saveData();
    }
});

// Handle page unload to save data
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.saveData();
    }
}); 