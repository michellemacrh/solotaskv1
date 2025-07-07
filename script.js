// SoloTask V1 - Minimalist Task Manager
// Main JavaScript file handling all functionality
 

class SoloTask {
    constructor() {
        this.tasks = [];
        this.editingTask = null;
        this.originalTaskContent = null;
        this.draggedTask = null;
        this.defaultTags = ['Inbox', 'Next Action', 'Projects', 'Learning Topics', 'Someday'];
        this.collapsedGroups = new Set();
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadData();
        this.cleanupCompletedTasks();
        this.setupEventListeners();
        this.renderTasks();
        this.updateTaskCount();
        
        // Clean up any existing theme preference since we're now using dark mode only
        localStorage.removeItem('solotask-theme');
        
        // Add global click listener for click-away detection
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        
        // Set up periodic cleanup every hour
        setInterval(() => {
            this.cleanupCompletedTasks();
        }, 60 * 60 * 1000); // 1 hour in milliseconds
        

    }

    cacheDOM() {
        // Cache frequently used DOM elements
        this.elements = {
            taskInput: document.getElementById('task-input'),
            dueDateInput: document.getElementById('due-date-input'),
            prioritySelect: document.getElementById('priority-select'),
            tagSelect: document.getElementById('tag-select'),
            listContainer: document.getElementById('list-view'),
            emptyState: document.getElementById('empty-state'),
            taskCount: document.getElementById('task-count'),
            quickAddModal: document.getElementById('quick-add-modal'),
            quickAddForm: document.getElementById('quick-add-form'),
            quickAddInput: document.getElementById('quick-add-input'),
            quickAddTag: document.getElementById('quick-add-tag'),
            quickAddPriority: document.getElementById('quick-add-priority'),
            quickAddDue: document.getElementById('quick-add-due'),
            exportBtn: document.getElementById('export-csv-btn')
        };

        // Check for missing elements
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.warn('Missing DOM elements:', missingElements);
        }
    }

    // Data Management - localStorage only
    loadData() {
        try {
            const savedTasks = localStorage.getItem('solotask-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            } else {
                this.tasks = [];
            }
            
            // Load collapsed groups state
            const savedCollapsedGroups = localStorage.getItem('solotask-collapsed-groups');
            if (savedCollapsedGroups) {
                this.collapsedGroups = new Set(JSON.parse(savedCollapsedGroups));
            } else {
                this.collapsedGroups = new Set();
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            this.tasks = [];
            this.collapsedGroups = new Set();
        }
        
        // Ensure backwards compatibility - convert multiple tags to single tag
        this.tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                // Convert from array to single tag, use first tag or default to 'Inbox'
                task.tag = task.tags.length > 0 ? task.tags[0] : 'Inbox';
                delete task.tags; // Remove old tags array
            } else if (!task.tag) {
                task.tag = 'Inbox'; // Default tag for new tasks
            }
            
            // Add completedAt timestamp for completed tasks that don't have one
            if (task.completed && !task.completedAt) {
                task.completedAt = new Date().toISOString();
            }
        });
    }

    saveData() {
        try {
            localStorage.setItem('solotask-tasks', JSON.stringify(this.tasks));
            localStorage.setItem('solotask-collapsed-groups', JSON.stringify(Array.from(this.collapsedGroups)));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }
    
    cleanupCompletedTasks() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const initialTaskCount = this.tasks.length;
        
        this.tasks = this.tasks.filter(task => {
            // Keep task if it's not completed
            if (!task.completed) {
                return true;
            }
            
            // Keep task if it doesn't have a completion timestamp (backwards compatibility)
            if (!task.completedAt) {
                return true;
            }
            
            // Keep task if it was completed less than 1 day ago
            const completedDate = new Date(task.completedAt);
            return completedDate > oneDayAgo;
        });
        
        // Save and update UI if we removed any tasks
        if (this.tasks.length !== initialTaskCount) {
            const removedCount = initialTaskCount - this.tasks.length;
            console.log(`🗑️ Cleaned up ${removedCount} completed task${removedCount > 1 ? 's' : ''} older than 1 day`);
            this.saveAndUpdate();
        }
    }

    // Event Listeners
    setupEventListeners() {
        const taskForm = document.querySelector('.task-form');
        
        // Form submission - handles both button click and Enter key
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // Enter key handling for all form inputs
        const formInputs = [
            this.elements.taskInput,
            this.elements.dueDateInput,
            this.elements.prioritySelect,
            this.elements.tagSelect
        ];
        formInputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTask();
                }
            });
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        this.elements.taskInput.focus();
                        break;
                    case 'k':
                        e.preventDefault();
                        this.showQuickAddModal();
                        break;
                }
            }
            
            // Escape key to close modal
            if (e.key === 'Escape') {
                this.hideQuickAddModal();
            }
        });
        
        // Quick Add Modal Event Listeners
        this.setupQuickAddListeners();
        
        // CSV Export button
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportToCSV());
        }
    }
    
    // Quick Add Modal Event Listeners
    setupQuickAddListeners() {
        const cancelBtn = document.querySelector('.quick-add-cancel');
        
        // Form submission
        this.elements.quickAddForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuickTask();
        });
        
        // Cancel button
        cancelBtn.addEventListener('click', () => {
            this.hideQuickAddModal();
        });
        
        // Click outside modal to close
        this.elements.quickAddModal.addEventListener('click', (e) => {
            if (e.target === this.elements.quickAddModal) {
                this.hideQuickAddModal();
            }
        });
        
        // Keyboard shortcuts within modal
        this.elements.quickAddInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideQuickAddModal();
            }
        });
    }
    
    // Quick Add Modal Methods
    showQuickAddModal() {
        // Reset form
        this.elements.quickAddInput.value = '';
        this.elements.quickAddTag.value = 'Inbox';
        this.elements.quickAddPriority.value = 'medium';
        this.elements.quickAddDue.value = '';
        
        // Show modal
        this.elements.quickAddModal.classList.add('active');
        
        // Focus input after animation
        setTimeout(() => {
            this.elements.quickAddInput.focus();
        }, 100);
    }
    
    hideQuickAddModal() {
        this.elements.quickAddModal.classList.remove('active');
    }
    
    addQuickTask() {
        const title = this.elements.quickAddInput.value.trim();
        const tag = this.elements.quickAddTag.value;
        const priority = this.elements.quickAddPriority.value;
        const dueDate = this.elements.quickAddDue.value;
        
        if (title) {
            const task = this.createTask(title, tag, priority, dueDate);
            this.addTaskToList(task);
            
            // Hide modal
            this.hideQuickAddModal();
        }
    }

    // Task Management
    createTask(title, tag, priority, dueDate) {
        return {
            id: this.generateId(),
            title: title,
            tag: tag || 'Inbox',
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: this.parseDueDate(dueDate),
            priority: priority || 'medium',
            order: this.tasks.length
        };
    }

    addTaskToList(task) {
        this.tasks.push(task);
        this.saveAndUpdate();
    }

    saveAndUpdate() {
        this.saveData();
        this.renderTasks();
        this.updateTaskCount();
    }

    addTask() {
        const title = this.elements.taskInput.value.trim();
        const dueDate = this.elements.dueDateInput.value;
        const priority = this.elements.prioritySelect.value;
        const tag = this.elements.tagSelect.value;
        
        if (title) {
            const task = this.createTask(title, tag, priority, dueDate);
            this.addTaskToList(task);
            
            // Clear form
            this.elements.taskInput.value = '';
            this.elements.dueDateInput.value = '';
            this.elements.prioritySelect.value = 'medium';
            this.elements.tagSelect.value = 'Inbox';
            this.elements.taskInput.focus();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return;
        }
        
        this.editingTask = taskId;
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        
        // Store original content for restoration
        this.originalTaskContent = taskElement.innerHTML;
        
        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        
        // Title input
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = task.title;
        titleInput.className = 'input edit-title';
        
        // Second row with due date, priority, and tags
        const editRow = document.createElement('div');
        editRow.className = 'edit-row';
        
        // Due date input
        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'date';
        dueDateInput.value = task.dueDate ? this.formatDueDateForInput(task.dueDate) : '';
        dueDateInput.className = 'input edit-date text-sm';
        
        // Priority select
        const prioritySelect = document.createElement('select');
        prioritySelect.className = 'select edit-priority text-sm';
        prioritySelect.innerHTML = `
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
        `;
        
        // Tag select
        const tagSelect = document.createElement('select');
        tagSelect.className = 'select edit-tag text-sm';
        tagSelect.innerHTML = this.defaultTags.map(tag => 
            `<option value="${tag}" ${task.tag === tag ? 'selected' : ''}>${tag}</option>`
        ).join('');
        
        editRow.appendChild(dueDateInput);
        editRow.appendChild(prioritySelect);
        editRow.appendChild(tagSelect);
        
        // Action buttons row
        const actionsRow = document.createElement('div');
        actionsRow.className = 'edit-actions';
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
        `;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTaskFromEdit(taskId);
        });
        
        actionsRow.appendChild(deleteBtn);
        
        editForm.appendChild(titleInput);
        editForm.appendChild(editRow);
        editForm.appendChild(actionsRow);
        
        // Event listeners
        const saveEdit = () => {
            this.saveTaskEdit(taskId, {
                title: titleInput.value,
                dueDate: dueDateInput.value,
                priority: prioritySelect.value,
                tag: tagSelect.value
            });
        };
        
        const cancelEdit = () => {
            this.cancelTaskEdit();
        };
        
        // Keyboard events
        [titleInput, dueDateInput, prioritySelect, tagSelect].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (input === titleInput) {
                        dueDateInput.focus();
                    } else if (input === dueDateInput) {
                        prioritySelect.focus();
                    } else if (input === prioritySelect) {
                        tagSelect.focus();
                    } else {
                        saveEdit();
                    }
                } else if (e.key === 'Escape') {
                    cancelEdit();
                }
            });
            
            // Add Delete key support
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' && e.shiftKey) {
                    e.preventDefault();
                    this.deleteTaskFromEdit(taskId);
                }
            });
        });
        
        // Blur events
        [titleInput, dueDateInput, prioritySelect, tagSelect].forEach(input => {
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    if (!editForm.contains(document.activeElement)) {
                        saveEdit();
                    }
                }, 100);
            });
        });

        // Replace the entire task content with edit form
        taskElement.innerHTML = '';
        taskElement.appendChild(editForm);
        titleInput.focus();
        titleInput.select();
    }

    deleteTaskFromEdit(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.editingTask = null;
            this.originalTaskContent = null;
            this.saveAndUpdate();
        }
    }

    saveTaskEdit(taskId, editData) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && editData.title && editData.title.trim()) {
            task.title = editData.title.trim();
            task.tag = editData.tag || 'Inbox';
            task.dueDate = this.parseDueDate(editData.dueDate);
            task.priority = editData.priority;
        }
        this.editingTask = null;
        this.originalTaskContent = null;
        this.saveAndUpdate();
    }

    formatDueDateForInput(dateString) {
        if (!dateString) return '';
        
        // For date inputs, we need to return YYYY-MM-DD format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().split('T')[0];
    }

    cancelTaskEdit() {
        if (this.editingTask && this.originalTaskContent) {
            const taskElement = document.querySelector(`[data-task-id="${this.editingTask}"]`);
            if (taskElement) {
                taskElement.innerHTML = this.originalTaskContent;
            }
        }
        this.editingTask = null;
        this.originalTaskContent = null;
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveAndUpdate();
            
            // Clean up old completed tasks when toggling
            this.cleanupCompletedTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveAndUpdate();
        }
    }
    
    // New click handling methods
    addTaskClickListener(taskElement, taskId) {
        let isDragging = false;
        let dragStartTime = 0;
        
        taskElement.addEventListener('mousedown', (e) => {
            // Don't handle clicks on checkboxes
            if (e.target.type === 'checkbox') return;
            
            isDragging = false;
            dragStartTime = Date.now();
        });
        
        taskElement.addEventListener('dragstart', (e) => {
            isDragging = true;
        });
        
        taskElement.addEventListener('mousemove', (e) => {
            if (Date.now() - dragStartTime > 100) {
                isDragging = true;
            }
        });
        
        taskElement.addEventListener('click', (e) => {
            // Don't handle clicks on checkboxes
            if (e.target.type === 'checkbox') {
                return;
            }
            
            // Don't handle if we were dragging
            if (isDragging) {
                return;
            }
            
            // Don't handle if we're already in edit mode for this task
            if (this.editingTask === taskId) {
                return;
            }
            
            e.stopPropagation();
            this.editTask(taskId);
        });
    }
    
    handleGlobalClick(e) {
        // If we're in edit mode and the click was outside the edit form, cancel edit
        if (this.editingTask) {
            const editForm = e.target.closest('.edit-form');
            const isCheckbox = e.target.type === 'checkbox';
            
            // Cancel edit if click was outside edit form and not on a checkbox
            if (!editForm && !isCheckbox) {
                this.cancelTaskEdit();
            }
        }
    }

    // Rendering
    renderTasks() {
        this.renderGroupedListView();
    }
    
    renderGroupedListView() {
        if (this.tasks.length === 0) {
            this.elements.listContainer.innerHTML = '';
            this.elements.emptyState.style.display = 'block';
            return;
        }

        this.elements.emptyState.style.display = 'none';
        this.elements.listContainer.innerHTML = '';

        // Group tasks by tags
        const tasksByTag = this.groupTasksByTag();
        
        // Create tag groups
        this.defaultTags.forEach(tag => {
            const tagTasks = tasksByTag[tag] || [];
            const tagGroup = this.createTagGroup(tag, tagTasks);
            this.elements.listContainer.appendChild(tagGroup);
        });
    }
    
    groupTasksByTag() {
        const grouped = {};
        
        this.tasks.forEach(task => {
            const tag = task.tag || 'Inbox';
            if (!grouped[tag]) {
                grouped[tag] = [];
            }
            grouped[tag].push(task);
        });
        
        return grouped;
    }
    
    createTagGroup(tag, tasks) {
        const tagGroup = document.createElement('div');
        tagGroup.className = 'tag-group';
        tagGroup.setAttribute('data-tag', tag);
        
        // Check if this group should be collapsed
        const isCollapsed = this.collapsedGroups.has(tag);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'tag-group-header';
        
        const title = document.createElement('h3');
        title.className = 'tag-group-title';
        title.innerHTML = `${this.getTagIcon(tag)} ${tag} <i class="fas fa-chevron-down tag-group-arrow ${isCollapsed ? 'collapsed' : ''}"></i>`;
        
        const count = document.createElement('span');
        count.className = 'tag-group-count';
        count.textContent = tasks.length;
        
        header.appendChild(title);
        header.appendChild(count);
        
        // Add click handler for accordion toggle
        header.addEventListener('click', () => this.toggleTagGroup(tag));
        
        tagGroup.appendChild(header);
        
        // Create tasks container
        const tasksContainer = document.createElement('div');
        tasksContainer.className = `tag-group-tasks ${isCollapsed ? 'collapsed' : ''}`;
        tasksContainer.setAttribute('data-tag', tag);
        
        // Add drag and drop event listeners to the tasks container
        tasksContainer.addEventListener('dragover', (e) => this.handleTagGroupDragOver(e));
        tasksContainer.addEventListener('drop', (e) => this.handleTagGroupDrop(e));
        tasksContainer.addEventListener('dragenter', (e) => this.handleTagGroupDragEnter(e));
        tasksContainer.addEventListener('dragleave', (e) => this.handleTagGroupDragLeave(e));
        
        if (tasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = `tag-group-empty ${isCollapsed ? 'collapsed' : ''}`;
            emptyMessage.textContent = 'No tasks in this category';
            tasksContainer.appendChild(emptyMessage);
        } else {
            // Sort tasks by priority and creation date
            const sortedTasks = this.getSortedTasks(tasks);
            
            sortedTasks.forEach((task, index) => {
                const taskElement = this.createTaskElement(task, index);
                tasksContainer.appendChild(taskElement);
            });
        }
        
        tagGroup.appendChild(tasksContainer);
        return tagGroup;
    }
    
    createTaskElement(task, index) {
        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.completed ? 'task-completed' : ''} priority-${task.priority}`;
        taskElement.setAttribute('data-task-id', task.id);
        taskElement.setAttribute('data-task-index', index);
        taskElement.setAttribute('draggable', 'true');

        const dueDateDisplay = task.dueDate ? this.formatDueDate(task.dueDate) : '';
        const dueDateClass = this.getDueDateClass(task.dueDate);

        taskElement.innerHTML = `
            <div class="task-main">
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    class="checkbox"
                    onchange="app.toggleTask('${task.id}')"
                >
                <div class="task-content">
                    <p class="task-title">${this.parseMarkdownLinks(task.title)}</p>
                    <div class="task-meta">
                        ${dueDateDisplay ? `<span class="due-date ${dueDateClass}">${dueDateDisplay}</span>` : ''}
                    </div>
                </div>
            </div>
        `;

        // Add drag event listeners
        taskElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
        taskElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        taskElement.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        taskElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        taskElement.addEventListener('drop', (e) => this.handleDrop(e));
        taskElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        // Add click event listener for edit mode (excluding checkbox)
        this.addTaskClickListener(taskElement, task.id);

        return taskElement;
    }
    
    getTagIcon(tag) {
        const icons = {
            'Inbox': '<i class="fas fa-inbox"></i>',
            'Next Action': '<i class="fas fa-play"></i>',
            'Projects': '<i class="fas fa-folder"></i>',
            'Learning Topics': '<i class="fas fa-graduation-cap"></i>',
            'Someday': '<i class="fas fa-clock"></i>'
        };
        return icons[tag] || '<i class="fas fa-tag"></i>';
    }

    updateTaskCount() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        if (totalTasks === 0) {
            this.elements.taskCount.textContent = '0 tasks';
        } else if (pendingTasks === 0) {
            this.elements.taskCount.textContent = `${totalTasks} tasks completed`;
        } else {
            this.elements.taskCount.textContent = `${pendingTasks} of ${totalTasks} tasks`;
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
        // Note: tasks-container is not a real element in the current HTML structure
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
            const taskIndex = parseInt(taskElement.getAttribute('data-task-index'));
            
            // Find and activate the appropriate insertion indicator
            if (e.clientY < midY) {
                // Show indicator above this task
                const indicator = document.querySelector(`[data-insertion-index="${taskIndex}"]`);
                if (indicator) indicator.classList.add('active');
            } else {
                // Show indicator below this task
                const indicator = document.querySelector(`[data-insertion-index="${taskIndex + 1}"]`);
                if (indicator) indicator.classList.add('active');
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
        
        // Check if we're dropping on an insertion indicator
        const insertionIndicator = e.target.closest('.insertion-indicator');
        if (insertionIndicator && this.draggedTask) {
            const insertionIndex = parseInt(insertionIndicator.getAttribute('data-insertion-index'));
            this.reorderTask(this.draggedTask.index, insertionIndex);
            this.clearDragStates();
            return;
        }
        
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
        // Note: tasks-container is not a real element in the current HTML structure
        this.clearTagGroupDragStates();
        this.draggedTask = null;
    }

    clearDragStates() {
        // Clear all drag states
        document.querySelectorAll('.task-dragging').forEach(task => {
            task.classList.remove('task-dragging');
        });
        
        document.querySelectorAll('.task-drag-over-top, .task-drag-over-bottom').forEach(task => {
            task.classList.remove('task-drag-over-top', 'task-drag-over-bottom');
        });
        
        document.querySelectorAll('.insertion-indicator.active').forEach(indicator => {
            indicator.classList.remove('active');
        });
    }
    


    getSortedTasks(tasks) {
        const tasksToSort = tasks || this.tasks;
        return [...tasksToSort].sort((a, b) => {
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

        this.saveAndUpdate();
    }

    // Utility Functions
    parseDueDate(dateString) {
        if (!dateString) return null;

        // Date picker returns YYYY-MM-DD format, which is what we want
        // Validate the date format and return it if valid
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateString)) {
            const parsed = new Date(dateString);
            if (!isNaN(parsed.getTime())) {
                return dateString;
            }
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
            return 'Today';
        } else if (dateStr === tomorrowStr) {
            return 'Tomorrow';
        } else if (date < today) {
            return 'Overdue';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    getDueDateClass(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (dateStr === todayStr) {
            return 'today';
        } else if (dateStr === tomorrowStr) {
            return 'today'; // Tomorrow uses the same styling as today
        } else if (date < today) {
            return 'overdue';
        } else {
            return '';
        }
    }

    parseMarkdownLinks(text) {
        // Parse markdown links [text](url) and convert to HTML
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="task-link">$1</a>');
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Tag Group Drag and Drop Functions
    handleTagGroupDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleTagGroupDragEnter(e) {
        e.preventDefault();
        const tagGroup = e.target.closest('.tag-group');
        if (tagGroup && this.draggedTask) {
            // Get the tag of the current drag target
            const targetTag = tagGroup.getAttribute('data-tag');
            const currentTask = this.tasks.find(t => t.id === this.draggedTask.id);
            
            // Only highlight if it's a different tag
            if (currentTask && targetTag !== currentTask.tag) {
                tagGroup.classList.add('tag-group-drag-over');
            }
        }
    }
    
    handleTagGroupDragLeave(e) {
        const tagGroup = e.target.closest('.tag-group');
        if (tagGroup && !tagGroup.contains(e.relatedTarget)) {
            tagGroup.classList.remove('tag-group-drag-over');
        }
    }
    
    handleTagGroupDrop(e) {
        e.preventDefault();
        
        const tagGroup = e.target.closest('.tag-group');
        if (tagGroup && this.draggedTask) {
            const newTag = tagGroup.getAttribute('data-tag');
            const task = this.tasks.find(t => t.id === this.draggedTask.id);
            
            if (task && newTag && newTag !== task.tag) {
                // Update task tag
                task.tag = newTag;
                this.saveAndUpdate();
            }
        }
        
        // Clear all drag states
        this.clearTagGroupDragStates();
    }
    
    clearTagGroupDragStates() {
        document.querySelectorAll('.tag-group-drag-over').forEach(group => {
            group.classList.remove('tag-group-drag-over');
        });
        this.clearDragStates();
    }
    
    toggleTagGroup(tag) {
        const tagGroup = document.querySelector(`.tag-group[data-tag="${tag}"]`);
        if (!tagGroup) return;
        
        const arrow = tagGroup.querySelector('.tag-group-arrow');
        const tasksContainer = tagGroup.querySelector('.tag-group-tasks');
        const emptyMessage = tagGroup.querySelector('.tag-group-empty');
        
        const isCollapsed = this.collapsedGroups.has(tag);
        
        if (isCollapsed) {
            // Expand the group
            this.collapsedGroups.delete(tag);
            arrow.classList.remove('collapsed');
            tasksContainer.classList.remove('collapsed');
            if (emptyMessage) {
                emptyMessage.classList.remove('collapsed');
            }
        } else {
            // Collapse the group
            this.collapsedGroups.add(tag);
            arrow.classList.add('collapsed');
            tasksContainer.classList.add('collapsed');
            if (emptyMessage) {
                emptyMessage.classList.add('collapsed');
            }
        }
        
        this.saveData();
    }
    

    
    // CSV Export functionality
    exportToCSV() {
        if (this.tasks.length === 0) {
            alert('No tasks to export!');
            return;
        }
        
        // CSV headers
        const headers = ['Title', 'Tag', 'Priority', 'Due Date', 'Status', 'Created Date', 'Completed Date'];
        
        // Convert tasks to CSV rows
        const csvRows = this.tasks.map(task => {
            const title = `"${task.title.replace(/"/g, '""')}"`;  // Escape quotes
            const tag = task.tag || 'Inbox';
            const priority = task.priority || 'low';
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
            const status = task.completed ? 'Completed' : 'Pending';
            const createdDate = new Date(task.createdAt).toLocaleDateString();
            const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '';
            
            return [title, tag, priority, dueDate, status, createdDate, completedDate].join(',');
        });
        
        // Combine headers and rows
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `solotask-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('CSV export not supported in this browser');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SoloTask();
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