define(
	"main",
	[
		"PlayerLocationList",
		"FractalFlyer"
	],
	function(PlayerLocationList, FractalFlyer) {
		var websocket = new WebSocket("ws://localhost:8080/entry");
		var list = new PlayerLocationList(websocket);
		Init(list);
	}
);
