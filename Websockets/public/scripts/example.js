
(function() {
  var base = {
    defaultMessage : "test websockets"
    webSocket : new WebSocket("ws://localhost:8080/echo")
  }


  base.webSocket.onopen = function (e) {
    console.log("websocket Opened");
    //base.webSocket.send("Here's some text that the server is urgently awaiting!"); 
  };
  base.webSocket.onmessage = function(e) {
      console.log("websock: " + e.data);
  };
  console.log("init");

  /*base.webSocket.onmessage = function(event) {
    var f = document.getElementById("chatbox").contentDocument;
    var text = "";
    var msg = JSON.parse(event.data);
    var time = new Date(msg.date);
    var timeStr = time.toLocaleTimeString();
    
    switch(msg.type) {
      case "id":
        console.log("id");
        break;
      case "coordinates":
        console.log("coordinates")
        break;
    }
    
    if (text.length) {
      f.write(text);
      console.log("writing output")
    }
  };*/
})();

