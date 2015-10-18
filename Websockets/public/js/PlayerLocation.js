define(
	"PlayerLocation",
	[],
	function() {

		function PlayerLocation(model) {
			if (model !== undefined) {
				console.log("defined space")
				//this.playerName = model.playerName;
				this.playerName = "Anonymous";
				this.xCoordinate = model.xCoordinate;
				this.yCoordinate = model.yCoordinate;
				this.zCoordinate = model.zCoordinate;
			} else {
				console.log("undefined space")
				this.playerName = "Anonymous";
				this.xCoordinate = 0;
				this.yCoordinate = 0;
				this.zCoordinate = 0;
			}

			this.toModel = function() {
				return {
					name: this.playerName,
					x: this.xCoordinate,
					y: this.yCoordinate,
					z: this.zCoordinate
				};
			}
		}

		return PlayerLocation;
	}
);
