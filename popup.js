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
  document.getElementById('tt-query-input').focus();
});