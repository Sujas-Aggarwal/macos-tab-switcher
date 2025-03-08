// switcher.js
let allTabs = [];
let selectedIndex = 0;

// Listen for messages from content script
window.addEventListener("message", (event) => {
  if (event.data.action === "load-tabs") {
    allTabs = event.data.tabs;
    renderTabs(allTabs);
    document.getElementById("search-input").focus();
  }
});

// Set up search functionality
document.getElementById("search-input").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filteredTabs = allTabs.filter(
    (tab) =>
      tab.title.toLowerCase().includes(query) ||
      tab.url.toLowerCase().includes(query)
  );
  renderTabs(filteredTabs);
});

// Handle keyboard navigation
document.addEventListener("keydown", (e) => {
  const tabElements = document.querySelectorAll(".tab-item");

  if (e.key === "ArrowDown") {
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
  } else if (e.key === "Escape") {
    window.parent.postMessage({ action: "close-switcher" }, "*");
  }
});

function renderTabs(tabs) {
  const tabsList = document.getElementById("tabs-list");
  tabsList.innerHTML = "";
  selectedIndex = 0;

  tabs.forEach((tab, index) => {
    const tabElement = document.createElement("div");
    tabElement.className = "tab-item" + (index === 0 ? " selected" : "");
    tabElement.dataset.tabId = tab.id;

    // Get domain from URL
    const url = new URL(tab.url);
    const domain = url.hostname;

    // Create favicon
    const favicon = document.createElement("img");
    favicon.className = "tab-favicon";
    favicon.src = tab.favIconUrl || "icons/default-favicon.png";
    favicon.onerror = function () {
      this.src = "icons/default-favicon.png";
    };

    // Create title and url elements
    const titleElement = document.createElement("div");
    titleElement.className = "tab-title";
    titleElement.textContent = tab.title;

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
  window.parent.postMessage(
    {
      action: "switch-to-tab",
      tabId: tabId,
    },
    "*"
  );
}
