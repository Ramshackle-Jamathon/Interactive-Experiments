define(
	"PlayerLocationList",
	[
		"PlayerLocation"
	],
	function(PlayerLocation) {

		function PlayerLocationList(websocket) {
			var that = this;
			this.playerLocations = [];

			this.editingPlayerLocation = new PlayerLocation();

			this.send = function() {
				var model = this.editingPlayerLocation.toModel();
				console.log("sending model")
				console.log(model)
				websocket.send($.toJSON(model));
				var playerLocation = new PlayerLocation();
				playerLocation.playerName = model.playerName;
				this.editingPlayerLocation = playerLocation;
			};

			websocket.onmessage = function(event) {
				console.log("recieved model");
				console.log(event.data);
				var model = $.evalJSON(event.data);
				var loc = new PlayerLocation(model);
				that.playerLocations.push(loc);
			};
		}
		
		return PlayerLocationList;
	}
);
