chrome.commands.onCommand.addListener((command) => {
    if (command === "open-tab-switcher") {
      chrome.tabs.query({}, (tabs) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
          const activeTab = activeTabs[0];
          
          chrome.tabs.sendMessage(activeTab.id, {
            action: "open-switcher",
            tabs: tabs
          });
        });
      });
    }
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "switch-to-tab") {
      chrome.tabs.update(message.tabId, { active: true });
      sendResponse({success: true});
      return true;
    }
  });