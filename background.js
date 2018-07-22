/**
 * This listener enables the handshake hack. It listens for the
 * handshake from the popup. Once it gets a handshake, it responds
 * back to the popup as a signal that the popup can at last perform
 * its intended task.
 */

const informContentScriptToUpdateCandidates = function(isInitialization) {
  browser.tabs.query({currentWindow: true})
      .then((tabs) => {
        const activeTab = tabs.find((tab) => {return tab.active});
        browser.tabs.sendMessage(activeTab.id, {info: 'tabs', tabs: tabs, activeTab: activeTab, isInitialization: isInitialization});
      });
};

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.command == 'tabs') {
    informContentScriptToUpdateCandidates(true);
  }
  else if (message.command == "activate") {
    browser.tabs.update(message.tabId, {active: true});
  }
});

browser.tabs.onActivated.addListener(() => { informContentScriptToUpdateCandidates(false) });
browser.tabs.onUpdated.addListener(() => { informContentScriptToUpdateCandidates(false) });
browser.tabs.onRemoved.addListener(() => { informContentScriptToUpdateCandidates(false) });
browser.tabs.onCreated.addListener(() => { informContentScriptToUpdateCandidates(false) });