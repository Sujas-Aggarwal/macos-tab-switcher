let isOpen = false;
let allTabs = [];
let selectedIndex = 0;

console.log("content.js loaded");

// Create and append the switcher HTML
const switcherHTML = `
<div id="switcher-bg">
    <div class="tab-switcher-container">
        <div class="search-container">
            <input type="text" id="search-input" placeholder="Search tabs...">
        </div>
        <div class="tabs-container" id="tabs-list">
            <!-- Tabs will be inserted here -->
        </div>
    </div>
</div>
`;

// Append the HTML to the body
const switcherElement = document.createElement("div");
switcherElement.innerHTML = switcherHTML;
document.body.appendChild(switcherElement);

// Get references to the DOM elements
const switcherBg = document.getElementById("switcher-bg");
const searchInput = document.getElementById("search-input");
const tabsList = document.getElementById("tabs-list");

// Hide the switcher initially
switcherBg.style.display = "none";

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "open-switcher") {
    showSwitcher(message.tabs);
  }
  return false; // No async response needed
});

function showSwitcher(tabs) {
  if (isOpen) return;

  allTabs = tabs;
  isOpen = true;

  // Show the switcher
  switcherBg.style.display = "flex";

  // Render the tabs
  renderTabs(allTabs);

  // Focus the search input
  setTimeout(() => {
    searchInput.focus();
  }, 50);

  // Add event listeners
  document.addEventListener("keydown", handleKeyPress);
  searchInput.addEventListener("input", handleSearch);
}

function hideSwitcher() {
  switcherBg.style.display = "none";
  isOpen = false;

  // Remove event listeners
  document.removeEventListener("keydown", handleKeyPress);
  searchInput.removeEventListener("input", handleSearch);
}

function handleKeyPress(e) {
  const tabElements = document.querySelectorAll(".tab-item");

  if (e.key === "Escape") {
    hideSwitcher();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % tabElements.length;
    updateSelection();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex =
      (selectedIndex - 1 + tabElements.length) % tabElements.length;
    updateSelection();
  } else if (e.key === "Enter") {
    const selectedTab = document.querySelector(".tab-item.selected");
    if (selectedTab) {
      switchToTab(parseInt(selectedTab.dataset.tabId));
    }
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filteredTabs = allTabs.filter(
    (tab) =>
      tab.title.toLowerCase().includes(query) ||
      tab.url.toLowerCase().includes(query)
  );
  renderTabs(filteredTabs);
}

// Helper function to get default favicon path
function getDefaultFavicon() {
  return chrome.runtime.getURL("icons/default-favicon.png") || "icons/default-favicon.png";
}

// Helper function to create favicon with proper error handling
function createFavicon(tab) {
  const favicon = document.createElement("img");
  favicon.className = "tab-favicon";
  
  // Set default first to prevent flashing of broken image
  const defaultIcon = getDefaultFavicon();
  
  // Only attempt to use the tab's favicon if it exists and is not empty
  if (tab.favIconUrl && tab.favIconUrl.trim() !== "") {
    favicon.src = tab.favIconUrl;
    
    // Comprehensive error handling
    favicon.onerror = function() {
      // Log the error for debugging
      console.warn(`Failed to load favicon for tab: ${tab.id}, URL: ${tab.url}`);
      
      // Set to default icon
      this.src = defaultIcon;
      
      // Remove onerror handler to prevent potential infinite loops
      this.onerror = null;
      
      // Add a class that could be used for styling fallback icons
      this.classList.add("fallback-favicon");
    };
  } else {
    // No favicon URL available, use default immediately
    favicon.src = defaultIcon;
    favicon.classList.add("fallback-favicon");
  }
  
  // Add extra protection against CORS issues
  favicon.crossOrigin = "anonymous";
  
  return favicon;
}

function renderTabs(tabs) {
  tabsList.innerHTML = "";
  selectedIndex = 0;

  tabs.forEach((tab, index) => {
    const tabElement = document.createElement("div");
    tabElement.className = "tab-item" + (index === 0 ? " selected" : "");
    tabElement.dataset.tabId = tab.id;

    // Get domain from URL
    let domain = "";
    try {
      const url = new URL(tab.url);
      domain = url.hostname;
    } catch (error) {
      console.warn(`Invalid URL for tab ${tab.id}: ${tab.url}`);
      domain = "unknown";
    }

    // Create favicon with enhanced error handling
    // const favicon = createFavicon(tab);
    const favicon = document.createElement("span");
    favicon.style.width = "100px";

    // Create title and url elements
    const titleElement = document.createElement("div");
    titleElement.className = "tab-title";
    titleElement.textContent = tab.title || "Untitled";

    const urlElement = document.createElement("div");
    urlElement.className = "tab-url";
    urlElement.textContent = domain;

    // Put it all together
    const tabInfo = document.createElement("div");
    tabInfo.className = "tab-info";
    tabInfo.appendChild(titleElement);
    tabInfo.appendChild(urlElement);

    tabElement.appendChild(favicon);
    tabElement.appendChild(tabInfo);

    // Add click handler
    tabElement.addEventListener("click", () => {
      switchToTab(tab.id);
    });

    tabsList.appendChild(tabElement);
  });
}

function updateSelection() {
  const tabElements = document.querySelectorAll(".tab-item");
  tabElements.forEach((el, index) => {
    if (index === selectedIndex) {
      el.classList.add("selected");
      el.scrollIntoView({ block: "nearest" });
    } else {
      el.classList.remove("selected");
    }
  });
}

function switchToTab(tabId) {
  searchInput.value = "";
  chrome.runtime.sendMessage(
    {
      action: "switch-to-tab",
      tabId: tabId,
    },
    (response) => {
      // Add error handling for message response
      if (chrome.runtime.lastError) {
        console.error("Error switching tabs:", chrome.runtime.lastError);
        return;
      }
      console.log("Tab switch response:", response);
    }
  );
  hideSwitcher();
}