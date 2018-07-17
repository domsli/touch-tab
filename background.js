/**
 * This listener enables the handshake hack. It listens for the
 * handshake from the popup. Once it gets a handshake, it responds
 * back to the popup as a signal that the popup can at last perform
 * its intended task.
 */
browser.runtime.onMessage.addListener(function(message) {
  if (message.command != 'unfocus') {
    console.log("Background receives handshake");
    browser.runtime.sendMessage({}, function(response){
      console.log("Background responds to handshake");
    });
  }
});