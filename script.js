// SoloTask - Minimalist Task Manager
// Main JavaScript file handling all functionality

class SoloTask {
    constructor() {
        this.tasks = [];
        this.editingTask = null;
        this.draggedTask = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderTasks();
        this.updateTaskCount();
    }

    // Data Management
    loadData() {
        const savedTasks = localStorage.getItem('solotask-tasks');

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        } else {
            this.tasks = [];
        }
    }

    saveData() {
        localStorage.setItem('solotask-tasks', JSON.stringify(this.tasks));
    }

    // Event Listeners
    setupEventListeners() {
        // Task management
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
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
            order: this.tasks.length
        };

        this.tasks.push(task);
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
        const task = this.tasks.find(t => t.id === taskId);
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
        const task = this.tasks.find(t => t.id === taskId);
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
        const task = this.tasks.find(t => t.id === taskId);
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
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.renderTasks();
            this.updateTaskCount();
        }
    }

    // Rendering

    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        const emptyState = document.getElementById('empty-state');
        
        if (this.tasks.length === 0) {
            tasksContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tasksContainer.style.display = 'block';
        emptyState.style.display = 'none';
        tasksContainer.innerHTML = '';

        // Get sorted tasks
        const sortedTasks = this.getSortedTasks();

        // Add drag and drop event listeners to the container
        tasksContainer.addEventListener('dragover', (e) => this.handleContainerDragOver(e));
        tasksContainer.addEventListener('drop', (e) => this.handleContainerDrop(e));

        sortedTasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = `flex items-center p-4 hover:bg-gray-50 transition-colors priority-${task.priority}`;
            taskElement.setAttribute('data-task-id', task.id);
            taskElement.setAttribute('data-task-index', index);
            taskElement.setAttribute('draggable', 'true');

            const dueDateDisplay = task.dueDate ? this.formatDueDate(task.dueDate) : '';
            const priorityIcon = this.getPriorityIcon(task.priority);

            taskElement.innerHTML = `
                <div class="flex items-center flex-1">
                    <div class="drag-handle mr-2 p-1">
                        <i class="fas fa-grip-vertical text-gray-400"></i>
                    </div>
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

            // Add drag event listeners
            taskElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
            taskElement.addEventListener('dragover', (e) => this.handleDragOver(e));
            taskElement.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            taskElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            taskElement.addEventListener('drop', (e) => this.handleDrop(e));
            taskElement.addEventListener('dragend', (e) => this.handleDragEnd(e));

            tasksContainer.appendChild(taskElement);
        });
    }

    updateTaskCount() {
        const taskCount = document.getElementById('task-count');
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        if (totalTasks === 0) {
            taskCount.textContent = '0 tasks';
        } else if (pendingTasks === 0) {
            taskCount.textContent = `${totalTasks} tasks completed`;
        } else {
            taskCount.textContent = `${pendingTasks} of ${totalTasks} tasks`;
        }
    }



    // Drag and Drop Functions
    handleDragStart(e) {
        const taskId = e.target.getAttribute('data-task-id');
        const taskIndex = parseInt(e.target.getAttribute('data-task-index'));
        
        this.draggedTask = {
            id: taskId,
            index: taskIndex,
            element: e.target
        };
        
        e.target.classList.add('task-dragging');
        document.getElementById('tasks-container').classList.add('tasks-container-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Clear previous hover states
        this.clearDragStates();
        
        const taskElement = e.target.closest('[data-task-id]');
        if (taskElement && taskElement !== this.draggedTask.element) {
            const rect = taskElement.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                taskElement.classList.add('task-drag-over-top');
            } else {
                taskElement.classList.add('task-drag-over-bottom');
            }
        }
    }

    handleDragEnter(e) {
        e.preventDefault();
    }

    handleDragLeave(e) {
        // Clear states when leaving the task element
        if (e.target.closest('[data-task-id]')) {
            const taskElement = e.target.closest('[data-task-id]');
            taskElement.classList.remove('task-drag-over-top', 'task-drag-over-bottom');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const dropTarget = e.target.closest('[data-task-id]');
        
        if (dropTarget && dropTarget !== this.draggedTask.element) {
            const dropIndex = parseInt(dropTarget.getAttribute('data-task-index'));
            const rect = dropTarget.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            // Determine if we're dropping above or below the target
            const finalIndex = e.clientY < midY ? dropIndex : dropIndex + 1;
            this.reorderTask(this.draggedTask.index, finalIndex);
        }
        
        this.clearDragStates();
    }

    handleDragEnd(e) {
        e.target.classList.remove('task-dragging');
        document.getElementById('tasks-container').classList.remove('tasks-container-dragging');
        this.clearDragStates();
        this.draggedTask = null;
    }

    // Container-level drag handlers for more forgiving drop zones
    handleContainerDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Find the closest task element
        const taskElement = e.target.closest('[data-task-id]');
        if (taskElement && taskElement !== this.draggedTask.element) {
            // Let the task's own dragover handler deal with it
            return;
        }
        
        // Clear all drag states if we're not over a task
        this.clearDragStates();
    }

    handleContainerDrop(e) {
        e.preventDefault();
        
        // If we're dropping on the container but not on a specific task,
        // drop at the end of the list
        const dropTarget = e.target.closest('[data-task-id]');
        if (!dropTarget && this.draggedTask) {
            const sortedTasks = this.getSortedTasks();
            this.reorderTask(this.draggedTask.index, sortedTasks.length);
        }
        
        this.clearDragStates();
    }

    clearDragStates() {
        document.querySelectorAll('.task-drag-over-top, .task-drag-over-bottom').forEach(el => {
            el.classList.remove('task-drag-over-top', 'task-drag-over-bottom');
        });
    }

    getSortedTasks() {
        return [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
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
    }

    reorderTask(fromIndex, toIndex) {
        // Don't reorder if same position
        if (fromIndex === toIndex) return;
        
        // Get the sorted tasks
        const sortedTasks = this.getSortedTasks();

        // Adjust toIndex if moving from earlier position
        let adjustedToIndex = toIndex;
        if (fromIndex < toIndex) {
            adjustedToIndex = toIndex - 1;
        }

        // Move the task
        const [movedTask] = sortedTasks.splice(fromIndex, 1);
        sortedTasks.splice(adjustedToIndex, 0, movedTask);

        // Update order property for all tasks
        sortedTasks.forEach((task, index) => {
            task.order = index;
        });

        // Update the tasks array
        this.tasks = this.tasks.map(task => {
            const sortedTask = sortedTasks.find(st => st.id === task.id);
            return sortedTask || task;
        });

        this.saveData();
        this.renderTasks();
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