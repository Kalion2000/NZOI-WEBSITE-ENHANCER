# NZOI UserScripts

This repository contains two user scripts for the New Zealand Olympiad in Informatics (NZOI) training website. These scripts enhance the user experience by modernizing the dashboard and providing an integrated, local code editor for problems.

## 1. NZOI Dashboard Upgrade

This script completely overhauls the NZOI problems dashboard, giving it a modern, dark-themed user interface with powerful filtering and sorting options.

### Features
* **Modern UI:** A clean, dark theme for a more comfortable coding experience.
* **Problem Sorting:** Sort the problems list by name, progress, group, tags, or AI-classified rating.
* **Powerful Filters:** Easily filter problems by name, tag, difficulty range (rating), or group.
* **AI-Classified Ratings & Tags:** The script uses an AI to analyze problem descriptions and automatically assign tags and a difficulty rating (similar to platforms like Codeforces).
* **Caching:** AI-classified data is cached in your browser to prevent redundant requests and ensure a fast, seamless experience on subsequent visits.
* **Progress Visualization:** A progress bar is added to each problem, showing how much of it you have completed.

### How to Install
1.  Install a user script manager like **Tampermonkey** (for Chrome, Firefox, Edge) or **Greasemonkey** (for Firefox).
2.  Click the "Raw" button on the `NZOI Dashboard Upgrade.user.js` file in this repository.
3.  Your user script manager should automatically prompt you to install the script.
4.  Navigate to `https://train.nzoi.org.nz/` and the new dashboard should appear automatically.

### Usage
* **Search Bar:** Type in keywords to search for problems by name or tags.
* **Filter Dropdowns:** Use the dropdowns to filter problems by `Tag`, `Difficulty`, or `Group`.
* **Table Headers:** Click on any table header (`Name`, `Progress`, `Group`, `Tag`, `Rating`) to sort the table. Click again to reverse the sort order.
* **Cache Controls:** The header of the page includes buttons to **Refresh AI Classifications** or **Clear All Cache**. Use these if new problems are added or if you want to force the script to re-classify existing ones.

---

## 2. NZOI Lite (ONLY FOR C++)

This script transforms the problem page into a dedicated, split-screen development environment. It integrates a local code editor with live sample test execution, all within your browser. This is ideal for quickly testing your solutions without needing to submit them to the judge.

**Note:** This script is designed for C++ and requires a local clangd server to be running for advanced features like live diagnostics and auto-completion. The script will still work without the server, but those features will be disabled.

### Features
* **Monaco Editor:** A full-featured code editor (the same one used in Visual Studio Code) with syntax highlighting, auto-indent, and more.
* **Local Sample Testing:** Run your code against the problem's sample test cases directly in your browser using the Piston API.
* **Live Test Results:** See a summary of passed/failed tests and view detailed output/expected differences for any failed test case.
* **Integrated Submit Button:** A button is provided to submit your code to the NZOI judge without leaving the editor.
* **Live Diagnostics (with clangd):** Connect to a local `clangd` server to get real-time syntax checking, linting, and auto-completion.

### How to Install
1.  Install a user script manager like **Tampermonkey** or **Greasemonkey**.
2.  Click the "Raw" button on the `NZOI Lite.user.js` file in this repository.
3.  Your user script manager should prompt you to install the script.
4.  Navigate to any problem page on `https://train.nzoi.org.nz/problems/*` and the new UI will load automatically.

### Usage
* **Run Button:** Clicks the "Run" button to execute your code against the sample test cases and see the results in the `Test Results` panel.
* **Submit Button:** Clicks the "Submit" button to submit your code to the official NZOI judge.
* **Resizers:** Drag the resizers between the problem description, editor, and test results panels to adjust the layout to your preference.
* **Monaco Editor:** Use the editor to write and edit your C++ code. The script automatically saves your code to your browser's local storage for each problem.
---
# How to install and setup live diagnostics for C++

## 1. Install `clangd`

### macOS

```bash
brew install llvm
echo 'export PATH="/usr/local/opt/llvm/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install clangd
```

### Windows

1. Download LLVM for Windows from the [LLVM Releases](https://github.com/llvm/llvm-project/releases)
2. Run installer and check "Add to PATH"
3. Confirm install:

   ```powershell
   clangd --version
   ```

## 2. Download `lsp-ws-proxy`

* Go to: [Releases Page](https://github.com/gt-lang/lsp-ws-proxy/releases)
* Download the correct binary for your OS:

  * macOS: `lsp-ws-proxy-x86_64-apple-darwin`
  * Linux: `lsp-ws-proxy-x86_64-unknown-linux-gnu`
  * Windows: `lsp-ws-proxy-x86_64-pc-windows-msvc.exe`

No build step needed — just download and run.

## 3. Start the Proxy Server

### macOS / Linux

```bash
./lsp-ws-proxy --port 3000 --server-binary $(which clangd)
```

### Windows

```bash
lsp-ws-proxy.exe --port 3000 --server-binary "C:\Program Files\LLVM\bin\clangd.exe"
```

Adjust the path to `clangd.exe` if different.

##

##

