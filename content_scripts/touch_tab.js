(function() {
  if (window.hasRun) return;
  window.hasRun = true;

  // Create main div for holding the content
  var div = document.createElement('div');
  div.setAttribute('id', 'touch-tab');
  document.body.appendChild(div);

  const removeElem = function(elem) {
    elem.parentNode.removeChild(elem);
  };

  const cancelBubble = function(e) {
    var evt = e ? e:window.event;
    if (!evt) return;
    if (evt.stopPropagation) evt.stopPropagation();
    if (evt.cancelBubble != null) evt.cancelBubble = true;
  };

  const isOpened = function() {
    return div.classList.contains('opened');
  };

  const closeTouchTab = function() {
    div.classList.remove('opened');
    div.style.pointerEvents = 'none';
    div.removeChild(content);
  };

  // https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
  const copyToClipboard = function(elem) {
    var input = document.createElement('input');
    input.setAttribute('value', elem.innerHTML);
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand('copy');
    document.body.removeChild(input)
  };

  const PreviewManager = function() {
    const self = this;

    this.openPreview = function(candidateElem, url) {
      const preview = document.createElement('img');
      preview.setAttribute('class', 'touch-tab--preview');
      preview.setAttribute('src', url);
      candidateElem.appendChild(preview);
      const rowHeight = 18 + 18 + 10 + 10 + 10;
      const previewHeight = (screen.height * 2) / 5;
      if (previewHeight <= (candidateElem.rowIndex + 1) * rowHeight) {
        preview.style.bottom = '125%';
        preview.style.left = "0";
      }
      else if (previewHeight/2 <= (candidateElem.rowIndex) * rowHeight) {
        preview.style.top = ((rowHeight-previewHeight)/2).toString() + "px";
        preview.style.left = "20vw";
      }
      else {
        preview.style.top = '125%';
        preview.style.left = "0";
      }
    };

    this.closePreviewIfOpen = function() {
      const preview = document.querySelector('.touch-tab--preview');
      if (preview) {
        removeElem(preview);
      }
    };

    return this;
  };

  const CandidateTabsManager = function() {
    const self = this;

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
        const urlContainer = document.createElement('div');
        urlContainer.setAttribute('class', 'touch-tab--candidate-url-container');
        const url = document.createElement('p');
        url.setAttribute('class', 'touch-tab--candidate-url');
        url.innerHTML = tab.url;
        urlContainer.append(url);
        const tooltip = document.createElement('span');
        tooltip.setAttribute('class', 'touch-tab--tooltip');
        tooltip.innerHTML = "Copied to clipboard!";
        urlContainer.appendChild(tooltip);
        titleUrlCell.appendChild(urlContainer);
        row.appendChild(titleUrlCell);
        // create a cell for close button
        closeCell = document.createElement('td');
        closeCell.classList.add('touch-tab--candidate-close');
        closeButton = document.createElement('div');
        closeButton.classList.add('close');
        closeCell.appendChild(closeButton);
        row.appendChild(closeCell);
        container.appendChild(row);

        if (idOfTabToActivate != null && tab.id == idOfTabToActivate) {
          tabSelectionMaintainer.activateCandidateElem(row);
        }

        row.addEventListener('click', (evt) => {
          const tabId = self.extractIdFromCandidateElem_(row);
          browser.runtime.sendMessage({command: 'activate', tabId: tabId});
          closeTouchTab();
        });

        closeButton.addEventListener('click', (evt) => {
          cancelBubble(evt);
          const tabId = self.extractIdFromCandidateElem_(row);
          browser.runtime.sendMessage({command: 'remove', tabId: tabId});
        });
      }
    };

    return this;
  };

  const TabSelectionMaintainer = function() {
    this.selectedTabId = null;
    this.myId = null;

    this.getMyId = function() {
      return this.myId;
    };

    this.setMyId = function(tabId) {
      this.myId = tabId;
    };

    this.getSelectedTabId = function() {
      return this.selectedTabId;
    };

    this.setSelectedTabId = function(tabId) {
      this.selectedTabId = tabId;
    };

    this.down = function() {
      previewManager.closePreviewIfOpen();

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
      previewManager.closePreviewIfOpen();

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
  const previewManager = PreviewManager();

  // Listen to command keypresses
  document.addEventListener('keypress', (evt) => {
    // Ctrl+Alt+P is the main command to open popup
    if (evt.ctrlKey && evt.altKey && evt.key == "p") {
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
    else if (evt.ctrlKey && evt.altKey && evt.key == "c") {
      if (isOpened()) {
        const selectedTabId = tabSelectionMaintainer.getSelectedTabId();
        if (selectedTabId != null) {
          const candidateElem = document.getElementById('touch-tab--' + selectedTabId);
          const url = candidateElem.querySelector('.touch-tab--candidate-url');
          copyToClipboard(url);
  
          url.classList.add('copied');
          setTimeout(() => {
            url.classList.remove('copied');
          }, 100);

          const tooltip = candidateElem.querySelector('.touch-tab--tooltip');
          tooltip.classList.add('shown');
          setTimeout(() => {
            tooltip.classList.remove('shown');
          }, 700);
        }
      }
    }
    else if (evt.ctrlKey && evt.altKey && evt.key == "z") {
      if (isOpened()) {
        const preview = document.querySelector('.touch-tab--preview');
        // Close preview if it exists
        if (preview) {
          removeElem(preview);
        }
        // Open a preview if one does not exist
        else {
          const selectedTabId = tabSelectionMaintainer.getSelectedTabId();
          if (selectedTabId != null) {
            browser.runtime.sendMessage({command: 'captureTab', tabId: selectedTabId, myId: tabSelectionMaintainer.getMyId()});
          }
        }
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
        // Set my ID
        tabSelectionMaintainer.setMyId(message.activeTab.id);

        // Load HTML
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
    else if (message.info == 'capturedTab') {
      // Create the preview and add it as a child
      const candidateElem = document.getElementById('touch-tab--' + message.tabId);
      previewManager.openPreview(candidateElem, message.url);
    }
  });

})();