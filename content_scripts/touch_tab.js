(function() {
  if (window.hasRun) return;
  window.hasRun = true;

  // Create main div for holding the content
  var div = document.createElement('div');
  div.setAttribute('id', 'touch-tab');
  document.body.appendChild(div);

  function cancelBubble(e) {
    var evt = e ? e:window.event;
    if (!evt) return;
    if (evt.stopPropagation) evt.stopPropagation();
    if (evt.cancelBubble != null) evt.cancelBubble = true;
  }

  const isOpened = function() {
    return div.classList.contains('opened');
  }

  const closeTouchTab = function() {
    div.classList.remove('opened');
    div.style.pointerEvents = 'none';
    div.removeChild(content);
  };

  const CandidateTabsManager = function() {
    this.populateCandidateTabsContainer = function(filter, tabs, container, activeTabId) {
      container.innerHTML = "";
      // filter tabs
      tabs = tabs.filter((tab) => {
        const urlStr = tab.url.toLowerCase();
        const titleStr = tab.title.toLowerCase();
        return (urlStr.includes(filter) || titleStr.includes(filter));
      });
      // find a tab to activate
      const selectedTabId = tabSelectionMaintainer.getSelectedTabId();
      let idOfTabToActivate = (selectedTabId != null) ? selectedTabId : activeTabId;
      if (!tabs.find((tab) => {return tab.id == idOfTabToActivate}) && tabs.length > 0) {
        idOfTabToActivate = tabs[0].id;
      }
      // loop through the tabs and populate them into container
      for (let tab of tabs) {
        const row = document.createElement('tr');
        row.setAttribute('id', 'touch-tab--' + tab.id);
        row.setAttribute('class', 'touch-tab--candidate');
        // create a cell for icon
        const favicon = document.createElement('img');
        favicon.setAttribute('src', tab.favIconUrl);
        favicon.setAttribute('height', '32px');
        const iconCell = document.createElement('td');
        iconCell.setAttribute('class', 'touch-tab--candidate-favicon');
        iconCell.appendChild(favicon);
        row.appendChild(iconCell);
        // create a cell for title/url
        const titleUrlCell = document.createElement('td');
        titleUrlCell.setAttribute('class', 'touch-tab--candidate-title-url');
        const title = document.createElement('p');
        title.setAttribute('class', 'touch-tab--candidate-title');
        title.innerHTML = tab.title;
        titleUrlCell.appendChild(title);
        const br = document.createElement('br');
        const url = document.createElement('p');
        url.setAttribute('class', 'touch-tab--candidate-url');
        url.innerHTML = tab.url;
        titleUrlCell.appendChild(url);
        row.appendChild(titleUrlCell);
        container.appendChild(row);

        if (idOfTabToActivate != null && tab.id == idOfTabToActivate) {
          tabSelectionMaintainer.activateCandidateElem(row);
        }
        if (tab.id == activeTabId) {
          row.classList.add('activeTab');
        }
      }
    };

    return this;
  };

  const TabSelectionMaintainer = function() {
    this.selectedTabId = null;

    this.getSelectedTabId = function() {
      return this.selectedTabId;
    };

    this.setSelectedTabId = function(tabId) {
      this.selectedTabId = tabId;
    }

    this.down = function() {
      if (this.selectedTabId != null) {
        const activeP = document.getElementById('touch-tab--' + this.selectedTabId);
        const nextP = activeP.nextSibling;
        // activate next candidate if it exists
        if (nextP) {
          this.deactivateCandidateElem(activeP);
          this.activateCandidateElem(nextP);
          nextP.scrollIntoView({block: 'center'});
          return;
        }
      }
      const firstChildP = document.querySelector('.touch-tab--candidates-container').firstChild;
      // activate first child if it exists
      if (firstChildP) {
        if (this.selectedTabId != null) {
          const activeP = document.getElementById('touch-tab--' + this.selectedTabId);
          this.deactivateCandidateElem(activeP);
        }
        this.activateCandidateElem(firstChildP);
        firstChildP.scrollIntoView({block: 'center'});
      }
    };

    this.up = function() {
      if (this.selectedTabId != null) {
        const activeP = document.getElementById('touch-tab--' + this.selectedTabId);
        const prevP = activeP.previousSibling;
        // activate previous candidate if it exists
        if (prevP) {
          this.deactivateCandidateElem(activeP);
          this.activateCandidateElem(prevP);
          prevP.scrollIntoView({block: 'center'});
          return;
        }
      }
      const lastChildP = document.querySelector('.touch-tab--candidates-container').lastChild;
      // activate last child if it exists
      if (lastChildP) {
        if (this.selectedTabId != null) {
          const activeP = document.getElementById('touch-tab--' + this.selectedTabId);
          this.deactivateCandidateElem(activeP);
        }
        this.activateCandidateElem(lastChildP);
        lastChildP.scrollIntoView({block: 'center'});
      }
    };

    this.deactivateCandidateElem = function(candidateElem) {
      candidateElem.classList.remove('active');
    };

    this.activateCandidateElem = function(candidateElem) {
      candidateElem.classList.add('active');
      const tabId = this.extractIdFromCandidateElem_(candidateElem);

      const self = this;
      // only need to change page if selected tabId different from
      // the one we want to change to
      if (this.selectedTabId != tabId) {
        this.selectedTabId = tabId;
      }
    };

    this.extractIdFromCandidateElem_ = function(candidateElem) {
      return +(candidateElem.getAttribute('id').substring('touch-tab--'.length));
    };

    return this;
  };

  const tabSelectionMaintainer = TabSelectionMaintainer();
  const candidateTabsManager = CandidateTabsManager();

  // Listen to command keypresses
  document.addEventListener('keypress', (evt) => {
    // Ctrl+Alt+P is the main command to open popup
    if (evt.ctrlKey & evt.altKey && evt.which == 112) {
      // Close the Touch Tab content if it is already open
      if (isOpened()) {
        closeTouchTab();
      }
      // Ask background script for tabs so that this content
      // script can create the content
      else {  
        browser.runtime.sendMessage({command: 'tabs'});
      }
    }
    else if (evt.key == "ArrowDown") {
      if (isOpened()) {
        tabSelectionMaintainer.down();
      }
    }
    else if (evt.key == "ArrowUp") {
      if (isOpened()) {
        tabSelectionMaintainer.up();
      }
    }
    // Esc will close the content
    else if (evt.key == "Escape") {
      closeTouchTab();
    }
    else if (evt.key == "Enter") {
      if (isOpened()) {
        const selectedTabId = tabSelectionMaintainer.getSelectedTabId();
        if (selectedTabId != null) {
          browser.runtime.sendMessage({command: 'activate', tabId: selectedTabId});
          closeTouchTab();
        }
      }
    }
  });

  const createInitialHtml = function() {
    // Create the elements
    const content = document.createElement('div');
    content.classList.add('touch-tab--content');

    const components = document.createElement('div');
    components.classList.add('touch-tab--components');

    const filterContainer = document.createElement('div');
    filterContainer.classList.add('touch-tab--filter-container');

    const input = document.createElement('input');
    input.classList.add('touch-tab--filter');
    input.setAttribute('placeholder', "Type to filter...");

    const filterUnderline = document.createElement('div');
    filterUnderline.classList.add('touch-tab--filter-underline');

    const candidatesContainer = document.createElement('table');
    candidatesContainer.classList.add('touch-tab--candidates-container');
    candidatesContainer.setAttribute('cellspacing', '0');

    // Form relationships
    content.appendChild(components);
    components.appendChild(filterContainer);
    components.appendChild(candidatesContainer);
    filterContainer.appendChild(input);
    filterContainer.appendChild(filterUnderline);

    return content;
  };

  // Listen to messages from the background script
  browser.runtime.onMessage.addListener((message) => {
    // Contruct container from tabs
    if (message.info == 'tabs') {
      if (message.isInitialization) {
        div.appendChild(createInitialHtml());
        div.style.pointerEvents = 'all';
        div.classList.add('opened');
        
        // Add listeners so that clicking outside of content removes it
        content = document.querySelector('.touch-tab--content');
        content.addEventListener('click', (evt) => {
          cancelBubble(evt);
        });
        div.addEventListener('click', (evt) => {
          closeTouchTab();
        });

        // Add a focus listener to the input
        var input = document.querySelector('.touch-tab--filter');
        input.addEventListener('focus', (evt) => {
          div.classList.add('active');
        });
        // Add blur listener to the input
        input.addEventListener('blur', (evt) => {
          div.classList.remove('active');
        });

        // Focus on the input
        input.focus();

        // Populate container with tab candidates
        const tabs = message.tabs;
        const activeTab = message.activeTab;
        const container = document.querySelector('.touch-tab--candidates-container');
        candidateTabsManager.populateCandidateTabsContainer(input.value.toLowerCase(), tabs, container, activeTab.id);
        const activeP = document.getElementById('touch-tab--' + activeTab.id);
        activeP.scrollIntoView({block: 'center'});
      
        // Add input listener to filter
        input.addEventListener('input', (evt) => {
          const filter = input.value.toLowerCase();
          candidateTabsManager.populateCandidateTabsContainer(filter, tabs, container, activeTab.id)
        });
      }
      else {
        const tabs = message.tabs;
        // Update the TabSelectionManager if the selected tab is no longer available
        const selectedTabId = tabSelectionMaintainer.getSelectedTabId();
        if (!tabs.find((tab) => {return tab.id == selectedTabId})) {
          tabSelectionMaintainer.setSelectedTabId(null);
        }

        // Populate container with tab candidates
        var input = document.querySelector('.touch-tab--filter');
        const filter = input.value.toLowerCase();
        const activeTab = message.activeTab;
        const container = document.querySelector('.touch-tab--candidates-container');
        candidateTabsManager.populateCandidateTabsContainer(filter, tabs, container, activeTab.id);
      }
    }
  });

})();