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

## 2. NZOI Lite (clangd self host)

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

-----

### Setting up `clangd` for macOS & Linux

For the best experience with the NZOI Lite UserScript, you can set up a local `clangd` server. This is an optional but highly recommended step that enables advanced editor features like real-time diagnostics, intelligent auto-completion, and live linting directly within your browser.

#### Step 1: Install `clangd` and a Build System

You'll need both the `clangd` language server and a build system that can generate a `compile_commands.json` file. `clangd` uses this file to understand your project's structure and include paths.

  * **On macOS (using Homebrew):**

    1.  Install `llvm` which includes `clangd` and `cmake`.
        ```bash
        brew install llvm cmake
        ```
    2.  Add `llvm` to your shell's path. Homebrew will usually tell you how to do this after installation. A common command is:
        ```bash
        echo 'export PATH="/usr/local/opt/llvm/bin:$PATH"' >> ~/.zshrc
        source ~/.zshrc
        ```
        (Use `~/.bash_profile` if you're using Bash instead of Zsh).

  * **On Linux (using `apt` for Debian/Ubuntu):**

    ```bash
    sudo apt-get update
    sudo apt-get install clangd-14 clangd-14-doc cmake
    ```

    (You can replace `14` with a more recent version number if available).

#### Step 2: Install the `clangd-vscode-proxy`

The `clangd-vscode-proxy` acts as a bridge, converting `clangd`'s standard I/O communication into a WebSocket connection that the UserScript can understand.

1.  Clone the repository and build it.
    ```bash
    git clone https://github.com/josephfrazier/clangd-vscode-proxy.git
    cd clangd-vscode-proxy
    npm install
    npm run build
    ```
2.  Now you can run the proxy from the `dist` folder. To make it easier, you can create a symbolic link or a simple shell script to run it.

#### Step 3: Start the Server

Before you open the NZOI problem page, you need to start the `clangd` proxy server.

```bash
cd /path/to/your/clangd-vscode-proxy/dist
node cli.js --port 3000 --stdio-pipe-name /path/to/your/clangd
```

**Note:** The `--stdio-pipe-name` flag may require you to manually point to the `clangd` binary. For example, it might be `/usr/bin/clangd-14` on Linux or `/usr/local/opt/llvm/bin/clangd` on macOS.

-----

### Setting up `clangd` for Windows

Setting up `clangd` on Windows can be a bit more involved, but it is definitely possible and worth the effort.

#### Step 1: Install `clangd`

1.  **Download LLVM:** The easiest way to get `clangd` is by downloading the pre-built binaries from the [LLVM releases page](https://releases.llvm.org/). Choose the latest version for Windows.
2.  **Install LLVM:** Run the installer and make sure to check the option to add LLVM to the system `PATH`.
3.  **Verify the installation:** Open a Command Prompt or PowerShell and type `clangd --version`. If it shows the version number, you're good to go.

#### Step 2: Install the `clangd-vscode-proxy`

Since you'll be using the Node.js-based proxy, you'll need to install Node.js first.

1.  **Install Node.js:** Download and install Node.js from the [official website](https://nodejs.org/).
2.  **Clone the proxy repository:** Open a Command Prompt or PowerShell and clone the `clangd-vscode-proxy` repository.
    ```bash
    git clone https://github.com/josephfrazier/clangd-vscode-proxy.git
    cd clangd-vscode-proxy
    npm install
    npm run build
    ```

#### Step 3: Start the Server

1.  Open a Command Prompt or PowerShell window.
2.  Navigate to the `dist` folder of the `clangd-vscode-proxy` you just built.
3.  Run the proxy server, pointing it to your `clangd.exe` binary.
    ```bash
    node cli.js --port 3000 --stdio-pipe-name "C:\Program Files\LLVM\bin\clangd.exe"
    ```
    (Adjust the path to `clangd.exe` if your installation directory is different).

Now, with the server running, the UserScript will automatically connect to it and provide live coding assistance on the NZOI website.
