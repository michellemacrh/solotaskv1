# SoloTask - Minimalist Task Manager

A lightweight, client-side task management tool built with HTML, Tailwind CSS, and vanilla JavaScript. Perfect for solo users who want quick, frictionless task management without accounts or servers.

## Features

### Core Features
- ✅ **Add Tasks**: Quick task input with title, due date, and priority
- ✅ **Edit Tasks**: Click to edit task titles in place
- ✅ **Mark Complete**: Check off completed tasks
- ✅ **Delete Tasks**: Remove tasks you no longer need
- ✅ **Drag & Drop Sorting**: Reorder tasks by dragging them up or down
- ✅ **Persistent Storage**: All data saved to browser's localStorage
- ✅ **Boards**: Organize tasks into custom boards (Projects, Next Actions, etc.)
- ✅ **Natural Language Dates**: Support for "today", "tomorrow", "next Monday", etc.
- ✅ **Priority Levels**: High, Medium, Low with visual indicators
- ✅ **Responsive Design**: Works on desktop and mobile devices

### User Experience
- Clean, minimalist interface inspired by Todoist
- Instant loading with no server required
- Offline functionality
- Dark/Light theme toggle
- Keyboard shortcuts (Ctrl/Cmd + N for new task, Ctrl/Cmd + B for new board)
- Visual priority indicators and due date formatting
- Smooth drag-and-drop with visual feedback (opacity, rotation, border highlights)

## Getting Started

1. **Clone or download** the repository
2. **Open `index.html`** in any modern web browser
3. **Start adding tasks** immediately - no setup required!

### Running with Local Server (Optional)
```bash
# Navigate to the project directory
cd solotask

# Start a local HTTP server
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## Usage

### Adding Tasks
1. Type your task in the input field
2. Optionally add a due date using natural language ("tomorrow", "next Monday")
3. Select priority level (Low, Medium, High)
4. Press Enter or click the + button

### Reordering Tasks
1. **Drag and Drop**: Click and hold the grip icon (⋮⋮) on the left of any task
2. **Drag** the task to your desired position
3. **Drop** it between other tasks to reorder
4. **Order is preserved** automatically and saved to localStorage

### Managing Boards
- **Create Board**: Click "New Board" in the header
- **Switch Board**: Click on any board name in the sidebar
- **Edit Board**: Click the edit icon next to a board name
- **Delete Board**: Switch to the board and click the trash icon

### Keyboard Shortcuts
- `Ctrl/Cmd + N`: Focus on task input
- `Ctrl/Cmd + B`: Create new board
- `Enter`: Save task or board
- `Escape`: Cancel editing

## Data Storage

All data is stored locally in your browser using localStorage. This means:
- ✅ No server required
- ✅ Works offline
- ✅ Data persists between sessions
- ⚠️ Data is tied to your browser/device
- ⚠️ Clearing browser data will remove all tasks

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- localStorage
- CSS Grid/Flexbox

## File Structure

```
solotask/
├── index.html      # Main HTML file
├── script.js       # All JavaScript functionality
└── README.md       # This file
```

## Technical Details

- **No dependencies** - Uses Tailwind CSS via CDN
- **Vanilla JavaScript** - No frameworks required
- **Client-side only** - No backend server needed
- **Responsive design** - Mobile-first approach
- **Accessible** - Basic ARIA support included

## Contributing

This is a simple, standalone project. Feel free to fork and modify for your needs!

## License

Open source - feel free to use and modify as needed. 