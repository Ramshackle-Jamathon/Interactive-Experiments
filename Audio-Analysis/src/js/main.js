(function(){
    var THREE = require('./lib/three');

    var Detector = require('./lib/Detector');
    var NProgress = require('./lib/nprogress');
    var Stats = require('./lib/Stats');
    var dat = require('./lib/datGUI.js');
    var AudioHandler = require('./AudioHandler');

    var gui = new dat.gui.GUI();
    var audioHandler = new AudioHandler();

    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    function init() {
        document.addEventListener('drop', onDocumentDrop, false);
        audioHandler.init();
        audioHandler.onUseSample();
        update();
    }

    function update() {
        requestAnimationFrame(update);
        audioHandler.update();
    }

    //load dropped MP3
    function onDocumentDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        audioHandler.onMP3Drop(evt);
    }


    document.addEventListener("DOMContentLoaded", function(event) { 
       init();
    });

})();
