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

  // input.addEventListener('blur', (evt) => {
  //   input.focus();
  // })

  // Add a listener to the input so that candidates are repopulated
  input.addEventListener('input', function(evt) {
    let queryStr = evt.target.value;
    queryStr = queryStr.toLowerCase();
    listCandidateTabs(queryStr);
  });

});

const listCandidateTabs = function(queryStr) {
  browser.tabs.query({currentWindow: true})
    .then((tabs) => {
      const matchingTabs = getMatchingTabs(tabs, queryStr);
      const didActivateCandidate = populateCandidateTabsContainer(matchingTabs);
      tabSelectionMaintainer.reload(!didActivateCandidate);
    });
};

const getMatchingTabs = function(tabs, queryStr) {
  const matches = tabs.filter((tab) => {
    return (!tab.url.startsWith("about:") &&
      (tab.url.toLowerCase().includes(queryStr) ||
        tab.title.toLowerCase().includes(queryStr)));
  });
  return matches;
};

const populateCandidateTabsContainer = function(tabs) {
  const container = document.getElementById('tt-candidate-tabs');
  container.innerHTML = "";
  let didActivateCandidate = false;
  for (let tab of tabs) {
    const row = document.createElement('tr');
    row.setAttribute('id', 'tt-' + tab.id);
    row.setAttribute('class', 'tt-candidate');
    if (!this.selectedTabId && tab.active) {
      didActivateCandidate = true;
      tabSelectionMaintainer.activateCandidateElem_(row);
    }
    // create a cell for icon
    const favicon = document.createElement('img');
    favicon.setAttribute('src', tab.favIconUrl);
    favicon.setAttribute('height', '24px');
    const iconCell = document.createElement('td');
    iconCell.appendChild(favicon);
    row.appendChild(iconCell);
    // create a cell for title/url
    const titleUrlCell = document.createElement('td');
    titleUrlCell.setAttribute('class', 'tt-candidate-title-url');
    const title = document.createElement('p');
    title.setAttribute('class', 'tt-candidate-title');
    title.innerHTML = tab.title;
    titleUrlCell.appendChild(title);
    const br = document.createElement('br');
    const url = document.createElement('p');
    url.setAttribute('class', 'tt-candidate-url');
    url.innerHTML = tab.url;
    titleUrlCell.appendChild(url);
    row.appendChild(titleUrlCell);
    container.appendChild(row);
  }
  return didActivateCandidate;
};

const TabSelectionMaintainer = function() {
  this.selectedTabId = null;

  this.down = function() {
    if (this.selectedTabId != null) {
      const activeP = document.getElementById('tt-' + this.selectedTabId);
      const nextP = activeP.nextSibling;
      // activate next candidate if it exists
      if (nextP) {
        this.deactivateCandidateElem_(activeP);
        this.activateCandidateElem_(nextP);
        return;
      }
    }
    const firstChildP = document.getElementById('tt-candidate-tabs').firstChild;
    // activate first child if it exists
    if (firstChildP) {
      if (this.selectedTabId != null) {
        const activeP = document.getElementById('tt-' + this.selectedTabId);
        this.deactivateCandidateElem_(activeP);
      }
      this.activateCandidateElem_(firstChildP);
    }
  };

  this.up = function() {
    if (this.selectedTabId != null) {
      const activeP = document.getElementById('tt-' + this.selectedTabId);
      const prevP = activeP.previousSibling;
      // activate previous candidate if it exists
      if (prevP) {
        this.deactivateCandidateElem_(activeP);
        this.activateCandidateElem_(prevP);
        return;
      }
    }
    const lastChildP = document.getElementById('tt-candidate-tabs').lastChild;
    // activate last child if it exists
    if (lastChildP) {
      if (this.selectedTabId != null) {
        const activeP = document.getElementById('tt-' + this.selectedTabId);
        this.deactivateCandidateElem_(activeP);
      }
      this.activateCandidateElem_(lastChildP);
    }
  };

  this.reload = function(shouldActivateWithNewCandidate) {
    if (this.selectedTabId != null) {
      const activeP = document.getElementById('tt-' + this.selectedTabId);
      // re-activate this if it exists
      if (activeP) {
        this.activateCandidateElem_(activeP);
      }
      // activate first child if we should be activating with a new candidate
      else if (shouldActivateWithNewCandidate) {
        const firstChildP = document.getElementById('tt-candidate-tabs').firstChild;
        if (firstChildP) {
          this.activateCandidateElem_(firstChildP);
        }
      }
    }
    else if (shouldActivateWithNewCandidate) {
      const firstChildP = document.getElementById('tt-candidate-tabs').firstChild;
      if (firstChildP) {
        this.activateCandidateElem_(firstChildP);
      }
    }
  };

  this.extractIdFromCandidateElem_ = function(candidateElem) {
    return +(candidateElem.getAttribute('id').substring(3));
  };

  this.deactivateCandidateElem_ = function(candidateElem) {
    candidateElem.classList.remove('tt-active-candidate');
    candidateElem.classList.remove('tt-entered-candidate');
  };

  this.activateCandidateElem_ = function(candidateElem) {
    candidateElem.classList.add('tt-active-candidate');
    candidateElem.scrollIntoView();
    const tabId = this.extractIdFromCandidateElem_(candidateElem);

    const self = this;
    // only need to change page if selected tabId different from
    // the one we want to change to
    if (this.selectedTabId != tabId) {
      this.selectedTabId = tabId;
      enteredTabId = null;
    }
  };

  this.focusInput = function() {
    const input = document.getElementById('tt-query-input');
    input.focus();
  };

  return this;
};

tabSelectionMaintainer = TabSelectionMaintainer();

let enteredTabId = null;

document.addEventListener('keydown', (evt) => {
  if (evt.keyCode == 38) {
    tabSelectionMaintainer.up();
  }
  else if (evt.keyCode == 40) {
    tabSelectionMaintainer.down();
  }
  else if (evt.keyCode == 13) {
    if (this.selectedTabId) {
      if (this.selectedTabId == enteredTabId) {
        window.close();
      }
      else {
        browser.tabs.update(this.selectedTabId, {active: true})
          .then(() => {
            enteredTabId = this.selectedTabId;
          });
      }
    }
  }
});

const reloadCandidateTabs = function() {
  const input = document.getElementById('tt-query-input');
  let queryStr = input.value;
  queryStr = queryStr.toLowerCase();
  listCandidateTabs(queryStr);
};

browser.tabs.onUpdated.addListener(reloadCandidateTabs);
browser.tabs.onRemoved.addListener(reloadCandidateTabs);
browser.tabs.onActivated.addListener((tab) => {
  tabSelectionMaintainer.focusInput();
  browser.tabs.sendMessage(tab.tabId, {command:'unfocus'})
    .then(() => {
      tabSelectionMaintainer.focusInput();
    });
});