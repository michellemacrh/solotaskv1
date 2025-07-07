# SoloTask V1 - Minimalist Task Manager

![SoloTask Screenshot](https://github.com/michellemacrh/solotaskv1/blob/main/solotaskv1.png)

A clean, efficient task management application designed for personal productivity. SoloTask organizes your tasks by tags with a beautiful dark theme and intuitive interface.

> **Built with Cursor AI IDE**: This project was created through vibe-coding sessions with Cursor AI, combining human creativity with AI assistance for rapid development and optimization.

## ✨ Features

### 🏷️ **Tag-Based Organization**
- **5 Built-in Categories**: Inbox, Next Action, Projects, Learning Topics, Someday
- **Grouped View**: Tasks automatically organized by tags
- **Collapsible Sections**: Show/hide tag groups as needed
- **State Persistence**: Collapsed/expanded states saved between sessions

### 🎯 **Task Management**
- **Quick Add Modal**: Press Ctrl/Cmd+K for instant task creation from anywhere
- **Click-to-Edit**: Single click on any task to edit inline
- **Rich Task Details**: Title, due date, priority, tags, completion status
- **Priority Levels**: High, Medium, Low with visual indicators
- **Due Date Tracking**: Today, Tomorrow, Overdue status highlighting
- **Auto-Cleanup**: Completed tasks automatically removed after 24 hours

### 🎨 **User Experience**
- **Drag & Drop**: Move tasks between tag groups effortlessly
- **Keyboard Shortcuts**: Multiple shortcuts for power users
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Markdown Links**: Support for clickable links in task titles

### 📊 **Data Management**
- **Local Storage**: All data stored in browser localStorage with error handling
- **CSV Export**: Export tasks to spreadsheet format
- **Auto-Save**: Changes saved automatically
- **Data Safety**: No data loss with reliable local storage and backup options

### ⚡ **Performance**
- **Instant Load**: No server dependencies - works offline
- **Optimized DOM**: Cached elements and efficient rendering
- **Smooth Interactions**: Optimized for responsive user experience
- **Automatic Cleanup**: Keeps your task list focused and clutter-free

## 🚀 Getting Started

### Quick Start
1. **Download**: Clone or download the repository
2. **Open**: Simply open `index.html` in your web browser (no server needed!)
3. **Start Using**: No setup required - start adding tasks immediately!

> **Note**: This is a standalone HTML application. No server, installation, or setup required. Just open the HTML file in any modern browser.

### File Structure
```
solotask/
├── index.html          # Main application file
├── script.js           # JavaScript functionality
├── solotaskV1.png      # Application screenshot
└── README.md          # This file
```

## 📝 How to Use

### Adding Tasks

**Quick Add (Recommended):**
1. Press **Ctrl/Cmd + K** to open the quick add modal
2. Type your task title
3. Optionally set tag, priority, and due date
4. Press Enter or click "Add Task"

**Standard Form:**
1. Type your task in the input field
2. Set due date (optional)
3. Choose priority level (defaults to Medium)
4. Select appropriate tag category
5. Press Enter or click the + button

### Managing Tasks
- **Edit**: Click on any task to edit inline
- **Complete**: Check the checkbox to mark as done
- **Delete**: Click the delete button when editing a task or use Shift+Delete
- **Move**: Drag tasks between different tag groups
- **Organize**: Collapse/expand tag sections as needed
- **Links**: Add clickable links using markdown syntax: `[Link Text](URL)`

### Keyboard Shortcuts
- **Ctrl/Cmd + K**: Open quick add modal ⭐
- **Enter**: Save task (when adding/editing)
- **Escape**: Cancel edit mode or close quick add modal
- **Shift + Delete**: Delete task (when editing)

### Export Data
- Click the "Export CSV" button in the header
- Downloads a spreadsheet with all your tasks
- Includes: Title, Tag, Priority, Due Date, Status, Created Date, Completed Date

## 🎯 Task Categories

### 📥 **Inbox**
Default category for new tasks and quick captures

### ▶️ **Next Action**
Tasks ready to be worked on immediately

### 📁 **Projects**
Multi-step tasks and larger initiatives

### 🎓 **Learning Topics**
Educational content and skill development

### 🕐 **Someday**
Ideas and tasks for future consideration

## 💡 Pro Tips

### Productivity Workflow
1. **Capture**: Add everything to Inbox initially
2. **Organize**: Move tasks to appropriate categories
3. **Prioritize**: Set priority levels for better focus
4. **Focus**: Collapse completed sections to reduce clutter
5. **Review**: Export CSV periodically for analysis

### Best Practices
- Use specific, actionable task titles
- Set realistic due dates
- Review and organize tasks regularly
- Let auto-cleanup keep your list focused
- Export data periodically for backup

## 🔧 Technical Details

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Local storage support required

### Data Storage
- **Primary**: Browser localStorage with error handling
- **Backup**: CSV export functionality
- **Privacy**: All data stays on your device

### Auto-Cleanup System
- Completed tasks automatically removed after 24 hours
- Cleanup runs on app start and hourly intervals
- Backwards compatible with existing data
- Console logging for cleanup activities

### Performance Optimizations
- Cached DOM elements for faster access
- Consolidated save/render operations
- Efficient event handling
- Optimized rendering pipeline

## 🛡️ Privacy & Security

- **No External Servers**: Everything runs locally in your browser
- **No Data Collection**: Zero tracking or analytics
- **Complete Privacy**: Your tasks never leave your device
- **Offline Ready**: Works without internet connection

## 🤖 Development

### Built with Cursor AI IDE
This project was developed through an innovative "vibe-coding" approach using Cursor AI IDE, where:
- **Human creativity** guided the vision and user experience decisions
- **AI assistance** accelerated development, optimization, and code quality
- **Collaborative coding** enabled rapid iteration and feature refinement
- **Code optimization** was enhanced through AI-powered analysis and suggestions

The result is a polished, performant application that combines thoughtful design with clean, maintainable code.

## 🤝 Contributing

This is a personal productivity tool designed for simplicity and focus. The current feature set is intentionally minimal to avoid feature bloat.

## 📄 License

This project is open source and available under the MIT License.
