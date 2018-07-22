/**
 * This listener enables the handshake hack. It listens for the
 * handshake from the popup. Once it gets a handshake, it responds
 * back to the popup as a signal that the popup can at last perform
 * its intended task.
 */
browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.command == 'tabs') {
    browser.tabs.query({currentWindow: true})
      .then((tabs) => {
        const activeTab = tabs.find((tab) => {return tab.active});
        browser.tabs.sendMessage(activeTab.id, {info: 'tabs', tabs: tabs, activeTab: activeTab});
      });
  }
  else if (message.command == "activate") {
    browser.tabs.update(message.tabId, {active: true});
  }
});