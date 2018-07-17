/**
 * When the popup is loaded, we want to autofocus on the input.
 * However, for some reason, it does not suffice to simply call
 * the focus method immediately. Instead, we need to apply the
 * handshake hack. This hack makes the popup initiate a handshake
 * to the background script, which then responds to the handshake.
 * Once the response is heard on the popup, we can finally focus.
 */

// Send a message to start handshake
browser.runtime.sendMessage({}, function() {
  console.log("Popup initiated handshake");
});

// Listen for response to handshake from background script
browser.runtime.onMessage.addListener(function() {
  console.log("Receives background script's response to handshake");
  // Focus on input and list initial candidates
  const input = document.getElementById('tt-query-input')
  input.focus();
  listCandidateTabs(input.value);

  // Add a listener to the input so that candidates are repopulated
  input.addEventListener('input', function(evt) {
    let queryStr = evt.target.value;
    listCandidateTabs(queryStr);
  });
});

const listCandidateTabs = function(queryStr) {
  browser.tabs.query({currentWindow: true})
    .then((tabs) => {
      const matchingTabs = getMatchingTabs(tabs, queryStr);
      populateCandidateTabsContainer(matchingTabs);
    });
};

const getMatchingTabs = function(tabs, queryStr) {
  const matches = tabs.filter((tab) => {
    return (tab.url.includes(queryStr) || tab.title.includes(queryStr));
  });
  return matches;
};

const populateCandidateTabsContainer = function(tabs) {
  const container = document.getElementById('tt-candidate-tabs');
  container.innerHTML = "";
  for (let tab of tabs) {
    const p = document.createElement('p');
    p.innerHTML = tab.url;
    container.appendChild(p);
  }
};