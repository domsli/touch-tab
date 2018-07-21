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

  const closeTouchTab = function() {
    div.classList.remove('opened');
    div.style.pointerEvents = 'none';
    div.removeChild(content);
  };

  const populateCandidateTabsContainer = function(tabs, container) {
    container.innerHTML = "";
    for (let tab of tabs) {
      const row = document.createElement('tr');
      row.setAttribute('id', 'touch-tab--' + tab.id);
      row.setAttribute('class', 'touch-tab--candidate');
      // create a cell for icon
      const favicon = document.createElement('img');
      favicon.setAttribute('src', tab.favIconUrl);
      favicon.setAttribute('height', '32px');
      const iconCell = document.createElement('td');
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
    }
  };

  // Listen to command keypresses
  document.addEventListener('keypress', (evt) => {
    // Ctrl+Alt+P is the main command to open popup
    if (evt.ctrlKey & evt.altKey && evt.which == 112) {
      // Close the Touch Tab content if it is already open
      if (div.classList.contains('opened')) {
        closeTouchTab();
      }
      // Ask background script for tabs so that this content
      // script can create the content
      else {  
        browser.runtime.sendMessage({command: 'tabs'});
      }
    }
    // Esc will close the content
    else if (evt.key == "Escape") {
      closeTouchTab();
    }
  });

  // Listen to messages from the background script
  browser.runtime.onMessage.addListener((message) => {
    // Contruct container from tabs
    if (message.info == 'tabs') {
      // AJAX request to fetch HTML
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          div.innerHTML = this.responseText;
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
          const tabs = message.data;
          const container = document.querySelector('.touch-tab--candidates-container');
          populateCandidateTabsContainer(tabs, container);
        } else {
          console.log('files not found');
        }
      };
      xhttp.open("GET", chrome.extension.getURL("/touch_tab.html"), true);
      xhttp.send();
    }
  });

})();