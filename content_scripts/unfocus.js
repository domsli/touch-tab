(function() {
  if (window.hasRun) return;
  window.hasRun = true;

  browser.runtime.onMessage.addListener((message) => {
    // get notified by popup that we should unfocus tab page
    if (message.command == 'unfocus') {
      document.activeElement.blur();
    }
  });

})();