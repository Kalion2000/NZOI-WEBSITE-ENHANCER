// ==UserScript==
// @name        NZOI Dashboard Upgrade
// @namespace   http://tampermonkey.net/
// @version     2.0
// @description Enhanced NZOI Dashboard (fully fixed)
// @match       https://train.nzoi.org.nz/*
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(async () => {
    "use strict";

    const url = location.href;
    const isHome = url === "https://train.nzoi.org.nz/";
    const isProblem = /^https:\/\/train\.nzoi\.org\.nz\/problems\//.test(url);

    if (isProblem) return;

    // Basic gentle dark mode for non-home, non-problem pages
    if (!isHome) {
  GM_addStyle(`
    body, html {
      background-color: #1e1e1e !important;
      /* tab menu base */
ul.tab_menu li a {
  background-color: #2a2a2a !important;
  color: #ddd !important;
  border: none !important;
  padding: 8px 14px !important;
  display: inline-block !important;
  text-decoration: none !important;
}

/* tab hover */
ul.tab_menu li a:hover {
  background-color: #333 !important;
  color: #fff !important;
}
/* remove weird blocky backgrounds/padding on li */
ul.tab_menu li {
  background: none !important;
  padding: 0 !important;
  margin: 0 !important;
  display: inline !important;
}


/* active tab */
ul.tab_menu li a.selected,
ul.tab_menu li.simple-navigation-active-leaf a {
  background-color: #444 !important;
  color: #fff !important;
  font-weight: 600 !important;
}

      color: #ddd !important;
    }

    a {
      color: #ddd !important;
      text-decoration: none !important;
    }

    a:hover {
      color: #fff !important;
    }

    table, td, th {
      background-color: #1f1f1f !important;
      color: #e0e0e0 !important;
      border-color: #444 !important;
    }

    input, select, textarea {
      background-color: #2c2c2c !important;
      color: #fff !important;
      border: 1px solid #444 !important;
    }

    ul.tab_menu {
      background-color: #222 !important;
      border-bottom: 1px solid #333 !important;
    }

    ul.tab_menu li {
      background-color: #2c2c2c !important;
      color: #ccc !important;
    }

    ul.tab_menu li a {
      color: #ccc !important;
      padding: 8px 12px !important;
      display: block !important;
    }

    ul.tab_menu li a.selected,
    ul.tab_menu li.simple-navigation-active-leaf a {
      background-color: #444 !important;
      color: #fff !important;
      font-weight: bold !important;
    }

    ul.tab_menu li:hover {
      background-color: #333 !important;
    }

    ul.tab_menu li a:hover {
      color: #fff !important;
    }
  `);

        return;
    }



    // Wait for Puter.com library to load
    if (!window.puter) {
        const script = document.createElement("script");
        script.src = "https://js.puter.com/v2/";
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    const $ = window.jQuery;

    // Rating boundaries and color classes
    const ratingBounds = [800, 1200, 1400, 1600, 1900, 2100, 2400, 9999];
    const ratingColors = ["gray", "green", "cyan", "blue", "violet", "orange", "red", "legendary"];

    let sortAscending = false;
    let currentSortColumn = "rating";
    let problems = [];
    const allTags = new Set();
    const allGroups = new Set();
    const cachedProblems = [];

    // Main function to build and render the dashboard UI
    async function renderDashboard(allProblems) {
        const sidePanel = $("#side").clone();
        $("#main-container").html(sidePanel).append(`
            <div style="flex: 1; max-width: calc(100% - 260px);">
                <div class="header-container">
                    <h2 style='color:white; margin:0;'>All Problems</h2>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                        <div class="stats-badge">
                            <span id="cached-count">0</span>/${allProblems.length} problems classified
                        </div>
                        <div class="cache-controls">
                            <button id="refresh-cache" class="cache-btn">Refresh AI Classifications</button>
                            <button id="clear-cache" class="cache-btn">Clear All Cache</button>
                        </div>
                    </div>
                </div>
                <div class="controls-container">
                    <div class="filters-container">
                        <input id='search' placeholder='Search problems...' style='flex:1;min-width:200px;'>
                        <select id='tag-filter'><option>All Tags</option></select>
                        <select id='diff-filter'>
                            <option>All Difficulties</option>
                            <option>800-1200</option>
                            <option>1201-1600</option>
                            <option>1601+</option>
                        </select>
                        <select id='group-filter'><option>All Groups</option></select>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table id='cf-table' class='main_table'>
                        <thead>
                            <tr>
                                <th id='name-header'>Name</th>
                                <th id='progress-header'>Progress</th>
                                <th id='group-header'>Group</th>
                                <th id='tag-header'>Tags</th>
                                <th id='rating-header'>Rating</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="5">Loading problems...</td></tr>
                    </table>
                </div>
            </div>
            <div style="width: 240px; margin-top: 30px;">
                <h2 style="padding-bottom: 10px; border-bottom: 1px solid #333; margin-top: 0; color: #eee;">My Groups</h2>
                <div style="margin-top: 3px; border-bottom: 1px solid #333; text-align: right;">
                    <div style="float: left; color: #9cf;"><b><a href="/groups/124">NZIC 2025</a></b></div>
                    <i>&nbsp;</i>
                </div>
            </div>
        `);

        // Event handlers for cache buttons
        $("#refresh-cache").click(() => {
            problems.forEach(p => localStorage.removeItem(`nztags_${p.id}`));
            location.reload();
        });
        $("#clear-cache").click(() => {
            Object.keys(localStorage).filter(key => key.startsWith("nztags_")).forEach(key => localStorage.removeItem(key));
            location.reload();
        });

        // Collect all unique groups
        allProblems.forEach(p => allGroups.add(p.group));
        allGroups.forEach(group => $("#group-filter").append(new Option(group, group)));

        // Separate cached from uncached problems
        const uncachedProblems = [];
        allProblems.forEach(p => {
            const cachedData = localStorage.getItem(`nztags_${p.id}`);
            if (cachedData) {
                try {
                    cachedProblems.push({ ...p, ...JSON.parse(cachedData) });
                } catch {
                    uncachedProblems.push(p);
                }
            } else {
                uncachedProblems.push(p);
            }
        });
        $("#cached-count").text(cachedProblems.length);
        problems = cachedProblems;
        cachedProblems.forEach(p => p.tags.forEach(tag => allTags.add(tag)));
        const tagSelect = $("#tag-filter").empty().append("<option>All Tags</option>");
        Array.from(allTags).sort().forEach(tag => tagSelect.append(new Option(tag, tag)));
        updateTable();

        // Process uncached problems with AI
        if (uncachedProblems.length > 0) {
            await classifyProblems(uncachedProblems, allProblems.length);
        }
    }

    // Function to classify problems using AI
    async function classifyProblems(uncachedList, totalCount) {
        for (let i = 0; i < uncachedList.length; i++) {
            const problem = uncachedList[i];
            const cacheKey = `nztags_${problem.id}`;
            const classification = await getProblemClassification(problem);

            localStorage.setItem(cacheKey, JSON.stringify(classification));
            problems.push({ ...problem, ...classification });

            // Update UI periodically and on completion
            if (i % 3 === 0 || i === uncachedList.length - 1) {
                updateTable();
                $("#cached-count").text(problems.length);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // AI classification logic
    async function getProblemClassification(problem, retries = 3) {
        const responses = [];
        const prompt = (text) => `You are a competitive programming problem classifier. Your task is to analyze the following problem statement and assign it a difficulty rating and up to three relevant tags from a predefined list. The problem rating must be an integer between 800 and 3500. The tags must be chosen from the following list: [2-satisfiability, binary search, bitmasks, brute force, chinese remainder theorem, combinatorics, constructive algorithms, data structures, depth-first search and similar, divide and conquer, dynamic programming, disjoint set union, expression parsing, fast fourier transform, flows, game theory, geometry, graph matchings, graphs, greedy algorithms, hashing, implementation, linear algebra, meet-in-the-middle, number theory, probabilities, scheduling, shortest paths, sorting, string suffix structures, strings, ternary search, trees, two pointers, IO].\n\nThe output must be a single JSON object with two keys: "tags" (an array of strings) and "rating" (an integer). Do not include any other text or explanation.\n\nProblem Statement:\n${text}`;

        let problemText = "";
        try {
            const response = await fetch(problem.href);
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");
            problemText = doc.querySelector(".problem-statement")?.innerText || doc.body.innerText;
            problemText = problemText.substring(0, 4000) + (problemText.length > 4000 ? "..." : "");
        } catch (e) {
            console.error("Failed to fetch problem text.", e);
            return { tags: ["unknown"], rating: 800 };
        }

        for (let i = 0; i < retries; i++) {
            try {
                const aiResponse = await puter.ai.chat(prompt(problemText));
                const parsedResponse = JSON.parse(aiResponse);
                responses.push(parsedResponse);
            } catch (error) {
                console.error(`AI call failed on attempt ${i + 1}`, error);
            }
        }

        if (responses.length === 0) {
            return { tags: ["unknown"], rating: 800 };
        }

        const tagCounts = {};
        let totalRating = 0;
        let validResponses = 0;

        responses.forEach(res => {
            if (typeof res.rating === "number" && Array.isArray(res.tags)) {
                totalRating += Math.min(Math.max(res.rating, 800), 3500);
                res.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
                validResponses++;
            }
        });

        if (validResponses === 0) {
            return { tags: ["unknown"], rating: 800 };
        }

        const finalRating = Math.round(totalRating / validResponses);
        const finalTags = Object.entries(tagCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([tag]) => tag);

        return { tags: finalTags, rating: finalRating };
    }

    // Filter and sort problems, then render the table
    const updateTable = () => {
        const searchTerm = $("#search").val().toLowerCase();
        const tagFilter = $("#tag-filter").val();
        const diffFilter = $("#diff-filter").val();
        const groupFilter = $("#group-filter").val();

        const filteredProblems = problems.filter(problem => {
            const searchString = (problem.name + " " + problem.tags.join(" ") + " " + problem.rating).toLowerCase();
            if (searchTerm && !searchString.includes(searchTerm)) return false;
            if (tagFilter !== "All Tags" && !problem.tags.map(t => t.toLowerCase()).includes(tagFilter.toLowerCase())) return false;
            if (groupFilter !== "All Groups" && problem.group.toLowerCase() !== groupFilter.toLowerCase()) return false;
            if (diffFilter === "800-1200" && (problem.rating > 1200)) return false;
            if (diffFilter === "1201-1600" && (problem.rating <= 1200 || problem.rating > 1600)) return false;
            if (diffFilter === "1601+" && (problem.rating <= 1600)) return false;
            return true;
        });

        // Sort problems
        filteredProblems.sort((a, b) => {
            let result;
            switch (currentSortColumn) {
                case "name":
                    result = a.name.localeCompare(b.name);
                    break;
                case "group":
                    result = a.group.localeCompare(b.group);
                    break;
                case "tag":
                    result = a.tags.join(", ").localeCompare(b.tags.join(", "));
                    break;
                case "rating":
                    result = a.rating - b.rating;
                    break;
                case "progress":
                    result = a.progress - b.progress;
                    break;
                default:
                    result = 0;
            }
            return result * (sortAscending ? 1 : -1);
        });

        // Render table rows
        renderTableRows(filteredProblems);
    };

    // Renders the table body with problem data
    const renderTableRows = (list) => {
        const tbody = $("#cf-table tbody");
        tbody.empty();

        if (list.length === 0) {
            tbody.html('<tr><td colspan="5" style="text-align:center; padding: 20px;">No problems found</td></tr>');
            return;
        }

        list.forEach(problem => {
            const row = $("<tr></tr>");
            const progressColor = problem.progress === 100 ? "rgb(0,200,0)" : problem.progress > 60 ? "rgb(100,200,100)" : problem.progress > 30 ? "rgb(200,180,0)" : "rgb(200,100,100)";
            const ratingClass = ratingColors.find((_, i) => problem.rating <= ratingBounds[i]);

            row.append(`<td><a href='${problem.href}' style='color:#007bff;font-weight:500;'>${problem.name}</a></td>`);
            row.append(`
                <td>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${problem.progress}%; background:${progressColor}"></div>
                        </div>
                        <span>${problem.progress}%</span>
                    </div>
                </td>
            `);
            row.append(`<td>${problem.group}</td>`);
            row.append(`<td>${problem.tags.join(", ")}</td>`);
            row.append(`<td data-raw='${problem.rating}'><span class='${ratingClass}' style='font-weight:700;'>${problem.rating}</span></td>`);

            tbody.append(row);
        });
    };

    // Helper to get all problem data from the original dashboard
    const getInitialProblems = () => {
        const allProblems = [];
        $(".subheading").each(function () {
            const groupName = $(this).find("td:first").text().trim();
            const groupID = $(this).find("td:first").attr("onclick")?.match(/'([^']+)'/)?.[1];
            if (!groupID) return;

            $(`#${groupID} table tbody tr`).each(function () {
                const link = $(this).find("td").first().find('a[href^="/problems/"]');
                if (!link.length) return;

                const href = link.attr("href");
                const name = link.text().trim();
                const progressText = $(this).find("td").eq(1).text().trim();
                let progress = 0;
                if (progressText.includes("%")) {
                    progress = parseInt(progressText);
                } else if (progressText.includes("/")) {
                    const [solved, total] = progressText.split("/").map(Number);
                    if (!isNaN(solved) && !isNaN(total) && total > 0) {
                        progress = Math.round((solved / total) * 100);
                    }
                }
                allProblems.push({ id: href.split("/").pop(), name, href, group: groupName, progress });
            });
        });
        return allProblems;
    };

    // Main execution flow
    const init = setInterval(() => {
        if ($('h2:contains("Public Problems")').length || $(".main_table").length) {
            clearInterval(init);

            // Check and set cache version for future-proofing
            if (GM_getValue("cache_version") !== "v3") {
                GM_setValue("cache_version", "v3");
                Object.keys(localStorage).filter(key => key.startsWith("nztags_")).forEach(key => localStorage.removeItem(key));
            }

            const initialProblems = getInitialProblems();
            renderDashboard(initialProblems);

            // Set up event listeners for filters and sorting
            $("#search, #tag-filter, #diff-filter, #group-filter").on("input change", updateTable);

            const setupSortHandler = (headerId, sortKey) => {
                $(`#${headerId}`).click(() => {
                    if (currentSortColumn === sortKey) {
                        sortAscending = !sortAscending;
                    } else {
                        currentSortColumn = sortKey;
                        sortAscending = true;
                    }
                    updateTable();
                });
            };

            setupSortHandler("name-header", "name");
            setupSortHandler("progress-header", "progress");
            setupSortHandler("group-header", "group");
            setupSortHandler("tag-header", "tag");
            setupSortHandler("rating-header", "rating");

            // Initial render call to show table after setup
            updateTable();
        }
    }, 300);

    // Revamped CSS for a modern and professional UI
    GM_addStyle(`
        body, html, #main-container, #main-page-title-box {
            background-color: #121212 !important;
            color: #e0e0e0 !important;
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        /* --- Main Layout and Containers --- */
        #main-container {
            padding: 30px;
            display: flex;
            gap: 30px;
            align-items: flex-start;
        }

        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
            margin-bottom: 20px;
        }

        .header-container h2 {
            color: #ffffff;
            font-size: 2.2em;
            font-weight: 700;
            margin: 0;
        }

        .controls-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 25px;
            align-items: center;
        }

        .filters-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            flex-grow: 1;
        }

        /* --- Form Elements: Input, Select, Buttons --- */
        #main-container input, #main-container select, .cache-btn {
            background-color: #2a2a2a !important;
            color: #e0e0e0 !important;
            border: 1px solid #444 !important;
            border-radius: 6px !important;
            padding: 10px 14px !important;
            font-size: 14px !important;
            font-family: inherit !important;
            transition: all 0.2s ease-in-out !important;
            outline: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
        }

        #main-container input::placeholder {
            color: #888 !important;
        }

        #main-container input:focus, #main-container select:focus {
            border-color: #007bff !important;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25) !important;
            background-color: #3a3a3a !important;
        }

        .cache-btn {
            cursor: pointer !important;
            font-weight: 600 !important;
            min-width: 150px !important;
            text-align: center !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        }

        .cache-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        }

        .cache-btn:active {
            transform: translateY(0) !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        }

        #refresh-cache {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
            border: none !important;
            color: #fff !important;
        }

        #clear-cache {
            background: linear-gradient(135deg, #dc3545 0%, #a71d2a 100%) !important;
            border: none !important;
            color: #fff !important;
        }

        #search {
            flex: 1 1 200px !important;
        }

        /* --- Table Styles --- */
        #cf-table.main_table {
            background: #1e1e1e !important;
            color: #e0e0e0 !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            width: 100% !important;
            border: 1px solid #333 !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3) !important;
        }

        #cf-table.main_table th {
            background: #1a1a1a !important;
            color: #c0c0c0 !important;
            padding: 15px 20px !important;
            text-align: left !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 0.9em !important;
            letter-spacing: 0.5px !important;
            user-select: none !important;
            border-bottom: 2px solid #333 !important;
            cursor: pointer !important;
            transition: background-color 0.2s !important;
        }

        #cf-table.main_table th:hover {
            background: #252525 !important;
        }

        #cf-table.main_table td {
            border-bottom: 1px solid #333 !important;
            padding: 15px 20px !important;
            background: #1e1e1e !important;
            color: #e0e0e0 !important;
        }

        #cf-table.main_table tr:hover {
            background: #252525 !important;
            transition: background-color 0.2s !important;
        }

        #cf-table.main_table tr:last-child td {
            border-bottom: none !important;
        }

        /* --- Typography and Colors --- */
        a {
            color: #007bff !important;
            text-decoration: none !important;
            transition: color 0.2s !important;
        }

        a:hover {
            color: #66aaff !important;
            text-decoration: underline !important;
        }

        .gray { color: #888 !important; }
        .green { color: #4CAF50 !important; }
        .cyan { color: #00BCD4 !important; }
        .blue { color: #2196F3 !important; }
        .violet { color: #9c27b0 !important; }
        .orange { color: #ff9800 !important; }
        .red { color: #f44336 !important; font-weight: 700 !important; }
        .legendary { color: #FFD700 !important; font-weight: 700 !important; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5) !important; }

        .stats-badge {
            background: #2a2a2a !important;
            border: 1px solid #444 !important;
            color: #e0e0e0 !important;
            padding: 6px 12px !important;
            border-radius: 20px !important;
            font-size: 0.9em !important;
            font-weight: 500 !important;
        }

        .stats-badge #cached-count {
            color: #007bff !important;
            font-weight: 700 !important;
        }

        /* --- Progress Bar --- */
        .progress-container {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }

        .progress-bar {
            width: 80px !important;
            height: 8px !important;
            background: #333 !important;
            border-radius: 4px !important;
            overflow: hidden !important;
            position: relative !important;
        }

        .progress-fill {
            height: 100% !important;
            border-radius: 4px !important;
            transition: width 0.4s ease-in-out !important;
        }

        /* --- Responsive Adjustments --- */
        @media (max-width: 1024px) {
            #main-container {
                flex-direction: column !important;
                gap: 20px !important;
                padding: 20px !important;
            }
        }
    `);

})();
