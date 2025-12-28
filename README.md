# 📊 Log Report Viewer

A modern, web-based log file analyzer with powerful filtering, search, and visualization capabilities. Built for developers and QA engineers who need to quickly analyze application logs and debug issues.

![TypeScript](https://img.shields.io/badge/TypeScript-93.7%25-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![License](https://img.shields.io/badge/License-MIT-green)

🔗 **[Live Demo](https://pasanl-ifs.github.io/IFSLogReport/)**

---

## ✨ Features

- 🎨 **Color-coded log levels** - Instantly identify Errors (red), Warnings (amber), and Info (blue)
- 🔍 **Powerful search** - Search across messages, stack traces, and metadata
- 📁 **Drag & drop upload** - Simply drop your log file to start analyzing
- ⚡ **Virtual scrolling** - Handle thousands of log entries with smooth performance
- 🎯 **Smart filtering** - Filter by log level, source context, exception type, and time range
- 📋 **Stack trace parsing** - Beautifully formatted exception details with syntax highlighting
- ⌨️ **Keyboard navigation** - Quick shortcuts to jump between errors and warnings
- 🌙 **Dark theme** - Easy on the eyes during long debugging sessions
- 📱 **Responsive** - Works on desktop and tablet devices

---

## 🚀 Quick Start

### Use Online (Recommended)

Visit the hosted version: **[https://pasanl-ifs.github.io/IFSLogReport/](https://pasanl-ifs.github.io/IFSLogReport/)**

Simply drag and drop your `.log` or `.txt` file to start analyzing.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/PasanL-ifs/IFSLogReport.git
cd IFSLogReport

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📖 Supported Log Format

The viewer parses logs in the following format:

```
{LEVEL}      {TIMESTAMP}     {MESSAGE}    {"SourceContext":"namespace.class"}
```

### Log Levels

| Level | Description | Example |
|-------|-------------|---------|
| `I` | Information | `I      2025-12-09 10:37:27 AM     SyncStarted    {"SourceContext":"App.Services.SyncService"}` |
| `W` | Warning | `W      2025-12-09 10:37:32 AM     Connection timeout    {"SourceContext":"App.Network.Client"}` |
| `E` | Error | `E      2025-12-09 10:37:45 AM     <System.NullReferenceException>...    {"SourceContext":"App.Core.Handler"}` |

### Error Format with Stack Trace

```
E      2025-12-09 01:00:37 PM     <System.ArgumentNullException><Message>Parameter cannot be null</Message><StackTrace>   at MyApp.Services.DataHandler.Process()
   at MyApp.Core.Engine.Execute()
</StackTrace></System.ArgumentNullException>    {"SourceContext":"MyApp.Services.DataHandler"}
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between log entries |
| `E` | Jump to next error |
| `Shift + E` | Jump to previous error |
| `W` | Jump to next warning |
| `Shift + W` | Jump to previous warning |
| `Escape` | Clear selection |

---

## 🛠️ Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Virtual Scrolling:** TanStack Virtual
- **Icons:** Lucide React
- **Date Formatting:** date-fns

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

<p align="center">
  Made with ❤️ for developers who debug logs
</p>