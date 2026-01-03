# 📊 Log Report Viewer

A modern, web-based log file analyzer with powerful filtering, search, and visualization capabilities. Built for developers and QA engineers who need to quickly analyze application logs and debug issues.

![TypeScript](https://img.shields.io/badge/TypeScript-93.7%25-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![License](https://img.shields.io/badge/License-MIT-green)

🔗 **[Live Demo](https://pasanl-ifs.github.io/IFSLogReport/)**

---

## 🎉 What's New in v2.0

**Multi-Format Log Support** is here! The viewer now supports **4 different log formats** with automatic detection:
- ✅ Original space-delimited format (I, W, E)
- ✅ Tab-separated format with **new Trace level (T)**
- ✅ JSON Lines (NDJSON) with structured properties
- ✅ Mixed format logs in the same file

**New Features:**
- 🔵 **Trace Level (T)** - Track application flow with cyan-themed trace entries
- 📊 **Event Name Tracking** - Filter and view logs by event names
- 🗂️ **JSON Properties Viewer** - Beautiful display of structured log properties
- ⏱️ **Enhanced Timestamps** - Support for ISO 8601 and standard formats
- 🔗 **Nested Exception Parsing** - Full exception chain visualization

📖 **[Read the full Release Notes →](RELEASE_NOTES.md)**

---

## ✨ Features

- 🔄 **Multi-format support** - Automatic detection of 4 different log formats (space-delimited, tab-separated, JSONL, mixed)
- 🎨 **Color-coded log levels** - Instantly identify Errors (red), Warnings (amber), Info (blue), and Trace (cyan)
- 🔍 **Powerful search** - Search across messages, stack traces, metadata, and event names
- 📁 **Drag & drop upload** - Simply drop your log file to start analyzing
- ⚡ **Virtual scrolling** - Handle thousands of log entries with smooth performance
- 🎯 **Smart filtering** - Filter by log level, source context, exception type, event names, and time range
- 📋 **Stack trace parsing** - Beautifully formatted exception details with nested exception support
- 🗂️ **JSON Properties Viewer** - Structured display of JSONL log properties
- ⌨️ **Keyboard navigation** - Quick shortcuts to jump between errors, warnings, and traces
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

## 📖 Supported Log Formats

The viewer **automatically detects and parses** multiple log formats:

<img width="1912" height="866" alt="image" src="https://github.com/user-attachments/assets/4392f8b0-6c12-49b4-9a56-490dc9fd10d5" />

### Format 1: Original (Space-Delimited)

```
{LEVEL}      {TIMESTAMP}     {MESSAGE}    {"SourceContext":"namespace.class"}
```

**Example:**
```
I      2025-12-09 10:37:27 AM     SyncStarted    {"SourceContext":"App.Services.SyncService"}
E      2025-12-09 10:37:45 AM     <System.NullReferenceException>...    {"SourceContext":"App.Core.Handler"}
```

### Format 2: Tab-Separated

```
{LEVEL}\t{TIMESTAMP}\t{MESSAGE}
```

**Example:**
```
I	2025-10-24 13:07:01 AM	Identify (User=IFSAPP, AppName=ServiceEngApp)
T	2025-10-24 13:07:32 AM	System: InitializationStarted
```

### Format 3: JSON Lines (NDJSON)

One JSON object per line with `LoggedAt`, `Name`, and optional `Properties`:

**Example:**
```json
{"LoggedAt":"2025-10-24T13:06:40.5882074+05:30","Name":"System: ApplicationStarted","Properties":{"Version":"25.99.1622.0","OS":"Windows"}}
{"LoggedAt":"2025-10-24T13:21:37.7451511+05:30","Name":"Exception","Properties":{"Exception":"<CloudException>...","Kind":"Unexpected"}}
```

### Log Levels

| Level | Icon | Color | Description |
|-------|------|-------|-------------|
| `I` | ℹ️ | Blue | Information - General application events |
| `W` | ⚠️ | Amber | Warning - Potential issues that don't stop execution |
| `E` | ❌ | Red | Error - Exceptions and failures |
| `T` | ⚡ | Cyan | Trace - Application flow tracking (new in v2.0) |

### Exception Format with Nested Stack Traces

The parser handles complex nested exceptions:

```
E      2025-12-09 01:00:37 PM     <System.ArgumentNullException><Message>Parameter cannot be null</Message><StackTrace>   at MyApp.Services.DataHandler.Process()
   at MyApp.Core.Engine.Execute()
</StackTrace><System.Exception><Message>Inner exception message</Message></System.Exception></System.ArgumentNullException>    {"SourceContext":"MyApp.Services.DataHandler"}
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between log entries |
| `E` | Jump to next error |
| `W` | Jump to next warning |
| `T` | Jump to next trace *(new in v2.0)* |
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

## 📚 Documentation

- **[Release Notes](RELEASE_NOTES.md)** - Detailed changelog and version history
- **[GitHub Repository](https://github.com/PasanL-ifs/IFSLogReport)** - Source code and issues
- **[Live Demo](https://pasanl-ifs.github.io/IFSLogReport/)** - Try it online

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Special thanks to IFS QA Team for testing and feedback

---

<p align="center">
  Made with ❤️ for developers who debug logs
</p>
