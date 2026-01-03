# 📋 Release Notes - IFS Log Report Viewer

## 🎉 Version 2.0.0 - Multi-Format Log Support (January 2026)

### 🚀 Major New Features

#### **Multi-Format Log Parser Architecture**

The IFS Log Report Viewer now supports **four different log formats** with automatic format detection! Upload any supported log file and the parser will automatically detect and parse the appropriate format.

#### **Supported Log Formats**

| Format | Type | Separator | Levels | Use Case |
|--------|------|-----------|--------|----------|
| **Original** | Space-delimited | Space | I, W, E | Legacy IFS MAUI logs with SourceContext |
| **Tab-Separated** | Tab-delimited | Tab (`\t`) | I, W, E, T | Server Response & Sync Trace logs |
| **JSON Lines (NDJSON)** | JSON per line | Newline | Auto-detected | Structured event logs with properties |
| **Mixed Format** | Combined | Various | All | Logs with multiple format types |

---

### 📝 Format Details

#### **Format 1: Original (Space-Delimited)**

```
I      2025-10-24 13:06:40 AM     System: ApplicationStarted    {"SourceContext":"App.Services.Core"}
E      2025-10-24 13:21:37 AM     <System.Exception>...          {"SourceContext":"App.Network"}
```

- **Features:** SourceContext metadata, full exception parsing
- **Levels:** Information (I), Warning (W), Error (E)
- **Metadata:** JSON with SourceContext field

#### **Format 2: Tab-Separated**

```
I	2025-10-24 13:07:01 AM	Identify (User=IFSAPP, AppName=ServiceEngApp)
T	2025-10-24 13:07:32 AM	System: InitializationStarted
```

- **Features:** Simpler format, new Trace level
- **Levels:** Information (I), Warning (W), Error (E), Trace (T)
- **Fields:** Level, Timestamp, Message (tab-separated)

#### **Format 3: JSON Lines (NDJSON)**

```json
{"LoggedAt":"2025-10-24T13:06:40.5882074+05:30","Name":"System: ApplicationStarted","Properties":{"Version":"25.99.1622.0"}}
{"LoggedAt":"2025-10-24T13:21:37.7451511+05:30","Name":"Exception","Properties":{"Exception":"<CloudException>..."}}
```

- **Features:** Structured properties, ISO 8601 timestamps, nested exception support
- **Format:** One JSON object per line
- **Rich Data:** Full property trees, dependency tracking, performance metrics

---

### ✨ New Features

#### **1. Trace Level Support (T)**

- **New Log Level:** Added purple-themed Trace level for tracking application flow
- **Visual Design:** Cyan color scheme with lightning icon
- **Keyboard Shortcut:** Press `T` to jump to next trace entry
- **Statistics:** Dedicated trace count in dashboard
- **Filtering:** Toggle trace entries on/off independently

#### **2. Event Name Tracking**

- **Event Detection:** Automatically extracts event names from logs (e.g., "System: ApplicationStarted", "Identify")
- **Event Filter:** New collapsible filter panel for event names
- **Statistics Display:** Shows unique event names with counts
- **Detail View:** Event names prominently displayed in log details

#### **3. JSON Lines Properties Viewer**

- **Structured Display:** Beautifully formatted JSON properties view
- **Syntax Highlighting:** Color-coded keys, strings, numbers, and booleans
- **Copy Support:** One-click copy of JSON properties
- **Property Tree:** Hierarchical display of nested properties

#### **4. Enhanced Timestamp Display**

- **Format Detection:** Automatically handles ISO 8601 (`2025-10-24T13:06:40.5882074+05:30`) and standard formats
- **Consistent Display:** Shows time as `HH:mm:ss` for all formats
- **Full Timestamp Tooltip:** Hover to see complete date and time
- **No Overlap:** Fixed width columns prevent text collision

#### **5. Nested Exception Support**

- **Chained Exceptions:** Parses and displays entire exception chains
- **XML Parsing:** Handles nested `<System.Exception>` structures
- **Collapsible View:** Individual sections for each nested exception
- **Stack Traces:** Separate stack trace for each exception in the chain

#### **6. Format Type Badges**

- **Visual Indicators:** Small badges show log format type (JSON, TAB)
- **Mixed Log Support:** Clear identification in files with multiple formats
- **Tooltips:** Hover for detailed format information

---

### 🔧 Technical Improvements

#### **Parser Architecture Rewrite**

- **Two-Pass Parsing:** First pass identifies entry boundaries, second pass extracts data
- **Multi-Line Support:** Correctly handles entries spanning multiple lines (stack traces, exceptions)
- **Robust Error Handling:** Graceful fallback for malformed entries
- **Performance:** Optimized for large files (10,000+ entries)

#### **Type Safety Enhancements**

- **Extended Types:** New interfaces for `JsonLProperties`, `NestedExceptionInfo`
- **Format Typing:** `LogFormatType` union type for format detection
- **Parse Status:** Tracks parsing success/partial/failure for each entry
- **Strict Imports:** Uses TypeScript's `import type` for better tree-shaking

#### **UI/UX Improvements**

- **Responsive Layout:** Adjusted column widths for better space utilization
- **Smart Truncation:** Intelligent text shortening with full text on hover
- **Visual Hierarchy:** Improved spacing and alignment
- **Accessibility:** Better contrast ratios and keyboard navigation

---

### 📊 Statistics Dashboard Updates

- **Trace Count Card:** New card showing total trace entries
- **Event Names Summary:** Displays top 5 event names with expandable view
- **Unparsed Indicator:** Warning badge for entries that couldn't be parsed
- **Enhanced Time Range:** Better date/time formatting for all log types

---

### 🎨 UI Components Updated

| Component | Changes |
|-----------|---------|
| **LogViewer** | Added format badge, trace level styling, improved timestamp display |
| **DetailPanel** | New sections for event names, JSON properties, nested exceptions |
| **FilterPanel** | Added trace level toggle, event name filter with search |
| **StatsDashboard** | New trace count, event names summary, format indicators |
| **FileUpload** | Enhanced format detection feedback |

---

### 🐛 Bug Fixes

- **Fixed:** Timestamp overlap issue with ISO 8601 format in JSONL logs
- **Fixed:** Multi-line exception entries not being grouped correctly
- **Fixed:** Nested exceptions causing parser to fail
- **Fixed:** Empty log lines breaking entry detection
- **Fixed:** SourceContext extraction from malformed JSON metadata
- **Fixed:** Time display inconsistency between log formats
- **Fixed:** Event name truncation in narrow displays

---

### ⚡ Performance Optimizations

- **Virtual Scrolling:** Enhanced for mixed-format logs
- **Lazy Parsing:** JSON properties parsed only when detail panel is opened
- **Regex Optimization:** Compiled patterns for faster format detection
- **Memory Efficiency:** Reduced memory footprint for large files

---

### 🎯 Breaking Changes

**None** - This release is fully backward compatible with existing log files. All original format logs will continue to work without any changes.

---

### 📚 Examples

#### **Example 1: JSONL Log with Exception**

```json
{
  "LoggedAt": "2025-10-24T13:21:37.7451511+05:30",
  "Name": "Exception",
  "Properties": {
    "Exception": "<Ifs.Cloud.Client.Exceptions.CloudException><Message>New refresh token required</Message></Ifs.Cloud.Client.Exceptions.CloudException>",
    "Kind": "Unexpected"
  }
}
```

**Displays as:**
- **Time:** 13:21:37
- **Event:** Exception
- **Level:** Auto-detected as Error
- **Properties:** Full JSON tree with exception details
- **Parsed Exception:** CloudException with extracted message

#### **Example 2: Tab-Separated Trace Log**

```
T	2025-10-24 13:07:32 AM	System: InitializationStarted
```

**Displays as:**
- **Level:** Trace (T) with cyan lightning icon
- **Time:** 13:07:32 (from timestamp)
- **Event:** System: InitializationStarted
- **Format Badge:** "TAB"

---

### 🔜 Coming Soon

We're working on even more features for future releases:

- **Timeline Visualization:** Graphical timeline view of log events
- **Pattern Detection:** Automatic identification of common error patterns
- **Session Grouping:** Group logs by user session with sync boundaries
- **Export Features:** Export filtered logs to CSV/JSON/PDF
- **Custom Themes:** Light mode and customizable color schemes
- **Real-time Monitoring:** Live log streaming support
- **Comparison View:** Side-by-side comparison of multiple log files

---

### 🙏 Acknowledgments

This release was made possible through feedback and bug reports from:
- IFS QA Team for providing production log samples
- Development team for identifying edge cases
- Community contributors for testing and suggestions

---

### 📦 Installation & Upgrade

**For Online Users:**
- Simply refresh the page at [https://pasanl-ifs.github.io/IFSLogReport/](https://pasanl-ifs.github.io/IFSLogReport/)
- No action needed - auto-updates on page load

**For Local Development:**
```bash
git pull origin main
npm install
npm run build
```

---

### 📞 Support

- **Issues:** Report bugs at [GitHub Issues](https://github.com/PasanL-ifs/IFSLogReport/issues)
- **Documentation:** See [README.md](README.md) for usage guide
- **Questions:** Contact the development team

---

## Version 1.0.0 - Initial Release (December 2025)

### Features

- Single-format log parser (space-delimited)
- Log level filtering (I, W, E)
- Search and filter capabilities
- Exception and stack trace parsing
- Virtual scrolling for performance
- Drag & drop file upload
- Dark theme UI
- Keyboard navigation
- Statistics dashboard
- Detail panel view

---

<p align="center">
  <strong>Built with ❤️ for IFS Developers and QA Engineers</strong>
</p>

