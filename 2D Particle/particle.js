/*
 * 2D Particle - Enjoy an outerSpace-inBrowser gravitron experience
 *
    The MIT License (MIT)

    Copyright (c) March 2015 Joseph Van Drunen

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
 */


$(document).ready(function () { particleSIM.init(); });

var particleSIM = {
  particles: [],
  particleCount: 0,
  particleTool: "Cluster",
  accelX: 0,
  accelY: 0,
  accelZ: 0,
  gyroAlpha: 90,
  gyroBeta: 0,
  gyroGamma: 0
}

var meny = Meny.create({
    // The element that will be animated in from off screen
    menuElement: document.querySelector( '.meny' ),

    // The contents that gets pushed aside while Meny is active
    contentsElement: document.querySelector( '.contents' ),

    // The alignment of the menu (top/right/bottom/left)
    position: 'left',

    // The height of the menu (when using top/bottom position)
    height: 200,

    // The width of the menu (when using left/right position)
    width: 260,

    // The angle at which the contents will rotate to.
    angle: 30,

    // The mouse distance from menu position which can trigger menu to open.
    threshold: 40,

    // Width(in px) of the thin line you see on screen when menu is in closed position.
    overlap: 6,

    // The total time taken by menu animation.
    transitionDuration: '0.5s',

    // Transition style for menu animations
    transitionEasing: 'ease',

    // Gradient overlay for the contents
    gradient: 'rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.65) 100%)',

    // Use mouse movement to automatically open/close
    mouse: true,

    // Use touch swipe events to open/close
    touch: true
});

particleSIM.requestAnimationFrame = window.requestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	window.oRequestAnimationFrame || function(callback) {
	window.setTimeout(callback, 1 / 60 * 1000);
};


particleSIM.init = function () {  

    particleSIM.canvas  = $('#canvas')[0];
    particleSIM.cx = particleSIM.canvas.getContext('2d');
    particleSIM.cx.canvas.width  = window.innerWidth;
    particleSIM.cx.canvas.height = window.innerHeight;
    particleSIM.startingPosition = {
				                        x: particleSIM.cx.canvas.width / 2,
				                        y: particleSIM.cx.canvas.height / 2
			                        };
    // create offscreen copy of canvas in an image
    particleSIM.imgData = particleSIM.cx.getImageData(0, 0, particleSIM.cx.canvas.width, particleSIM.cx.canvas.height);




    // bind functions to events, button clicks
    $(particleSIM.canvas).bind('click', particleSIM.click);
    $(particleSIM.canvas).bind('mouseup', particleSIM.mouseUp);
    $(particleSIM.canvas).bind('mousedown', particleSIM.mouseDown);
    $(particleSIM.canvas).bind('mousemove', particleSIM.mouseMove);
    
    
    //GYRO/Accel + screen orientation lock
    if(window.DeviceMotionEvent){
      window.addEventListener("devicemotion", particleSIM.motion, false);
    }else{
      console.log("DeviceMotionEvent is not supported");
    }
    if(window.DeviceOrientationEvent){
      window.addEventListener("deviceorientation", particleSIM.orientation, false);
    }else{
      console.log("DeviceOrientationEvent is not supported");
    }

    
    //menuBinds
    $('.dropdown-heading').bind('click',particleSIM.menuToggle);
    
    // initial Particles
    for(var i = 0; i < 200; ++i) {
        particleSIM.setFreeParticle(particleSIM.startingPosition.x, particleSIM.startingPosition.y, 30 + Math.random() * 2 * coinFlip(), Math.random() * 360, 100);
    }
    particleSIM.play(0);
}
/*
 * particle constructor
 */
particleSIM.Particle = function (posx, posy, life, angle, speed, index) {
	this.x = posx;
	this.y = posy;
	this.index = index;
	this.lastx = posx
	this.lasty = posy
	this.life = life;
	var angleInRadians = angle * Math.PI / 180;
	this.velocity = {
		x: speed * Math.cos(angleInRadians),
		y: -speed * Math.sin(angleInRadians)
	};
	this.color = '#fff';
	this.radius = 4;
	return this;
}
/*
 * particle update object
 */
particleSIM.Particle.prototype.update = function(dt) {
    
    //very terrible implementation of orientation needs friction 
    this.velocity.x += particleSIM.gyroGamma * 1;
    this.velocity.y += particleSIM.gyroBeta * 1;    


    //GRAVITY
    var newX = (particleSIM.cx.canvas.width / 2) - this.x;
    var newY = (particleSIM.cx.canvas.height / 2) - this.y;
    m = Math.sqrt(newX * newX + newY * newY);
    if (m) {
        newX /= m;
        newY /= m;
    }
    newX *= 3;
    newY *= 3;
    this.velocity.x += newX;
    this.velocity.y += newY;    
        
        
	this.life -= dt;
	if(this.life > 0) {
	    //particle is alive! much celebration!
        this.lastx = this.x
        this.lasty = this.y
		this.x += this.velocity.x * dt;
		this.y += this.velocity.y * dt;
		if(this.x >= particleSIM.cx.canvas.width || this.x <= 0){
            this.velocity.x = -0.9 * this.velocity.x;
        }
        if(this.y >= particleSIM.cx.canvas.height || this.y <= 0){
            this.velocity.y = -0.9 * this.velocity.y;
        }
	} else {
	    //particle is dead return it to particle pool(the end of the array)
		var particleThatJustDied = particleSIM.particles[this.index];
		particleSIM.particles[this.index] = particleSIM.particles[particleSIM.particleCount - 1];
		particleSIM.particles[particleSIM.particleCount - 1] = particleThatJustDied;
		particleSIM.particleCount--;
	}
}
/*
 * particle pool handler function
 */
particleSIM.setFreeParticle = function(posx, posy, life, angle, speed) {
	particleSIM.particleCount++;
	if(typeof particleSIM.particles[particleSIM.particleCount-1] === 'undefined') {
		 particleSIM.particles.push(new particleSIM.Particle(posx, posy, life, angle, speed, particleSIM.particleCount-1));
	}
	else {
		var particle = particleSIM.particles[particleSIM.particleCount-1];
		particle.x = posx;
		particle.y = posy;
		particle.index = particleSIM.particleCount;
		particle.lastx = posx
		particle.lasty = posy
		particle.life = life;

		var angleInRadians = angle * Math.PI / 180;
		particle.velocity = {
			x: speed * Math.cos(angleInRadians),
			y: -speed * Math.sin(angleInRadians)
		};
	}
}
/*
 * frame Handler (updates objects then draws)
 */
particleSIM.play = function (timestamp) {
    var delta = timestamp - (particleSIM.lastTimestamp || timestamp);
    particleSIM.lastTimestamp = Math.floor(timestamp);
    delta /= 1000;
	for(var i = 0; i < particleSIM.particleCount; ++i) {
        particleSIM.particles[i].update(delta);
    }
    particleSIM.draw();
    window.requestAnimationFrame(particleSIM.play);
}
/*
 * frame draw
 */
particleSIM.draw = function () {
	particleSIM.cx.fillStyle = 'grey';
	particleSIM.cx.fillRect(0, 0, particleSIM.cx.canvas.width, particleSIM.cx.canvas.height);

    for(var i = 0; i < particleSIM.particleCount; ++i) {
        var particle = particleSIM.particles[i];
    	if (particle.life > 0) {
            particleSIM.cx.fillStyle = particle.color;
//            particleSIM.cx.lineCap = 'round';
//            particleSIM.cx.lineWidth = particle.radius * 2;
//            particleSIM.cx.beginPath();
//            particleSIM.cx.moveTo(particle.lastx, particle.lasty);
//            particleSIM.cx.lineTo(particle.x, particle.y);
//            particleSIM.cx.stroke();
            particleSIM.cx.beginPath();
            particleSIM.cx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2, false);
            particleSIM.cx.fill();
			particleSIM.cx.closePath();
			

            particleSIM.cx.save();
            particleSIM.cx.fillStyle = "black";
            particleSIM.cx.translate(particle.x, particle.y);
            particleSIM.cx.rotate(particleSIM.lastTimestamp/240);
            particleSIM.cx.beginPath();
            particleSIM.cx.arc(15, 15, 1.5, 0, Math.PI * 2, false);
            particleSIM.cx.fill();
			particleSIM.cx.closePath();
			
            particleSIM.cx.translate(15, 15);
            particleSIM.cx.rotate(particleSIM.lastTimestamp/360);
            particleSIM.cx.beginPath();
            particleSIM.cx.fillStyle = "white";
            particleSIM.cx.arc(4, 4, 0.5, 0, Math.PI * 2, false);
            particleSIM.cx.fill();
			particleSIM.cx.closePath();
			
            particleSIM.cx.restore();
            
		}
    }
}

    $(particleSIM.canvas).bind('click', particleSIM.click);
    $(particleSIM.canvas).bind('mouseup', particleSIM.mouseUp);
    $(particleSIM.canvas).bind('mousedown', particleSIM.mouseDown);
/*
 * handle click events
 */
particleSIM.click = function(ev) {
    x = ev.pageX - $(particleSIM.canvas).offset().left;
    y = ev.pageY - $(particleSIM.canvas).offset().top;
    for(var i = 0; i < 200; ++i) {
        particleSIM.setFreeParticle(x, y, 30 + Math.random() * 2 * coinFlip(), Math.random() * 360, 100);
    }
}
/*
 * handle down events
 */
particleSIM.mouseDown = function(ev){

}
/*
 * handle mouseup events
 */
particleSIM.mouseUp = function(ev) {

}
/*
 * handle mousemove events
 */
particleSIM.mouseMove = function(ev) {

} 
/*
 * handle devicemotion events
 */
particleSIM.motion = function(ev){
  particleSIM.accelX = ev.acceleration.x;
  particleSIM.accelY = ev.acceleration.y;
  particleSIM.accelZ = ev.acceleration.z;
}
/*
 * handle deviceorientation events
 */
particleSIM.orientation = function(ev){
  particleSIM.gyroAlpha = ev.alpha;
  particleSIM.gyroBeta = ev.beta;
  particleSIM.gyroGamma = ev.gamma;
}

/*
 * flipity flip
 */
function coinFlip() {
	return Math.random() > .5 ? 1 : -1;
}
/*
 * Menu Expanders
 */
particleSIM.menuToggle = function(ev) {
    $(this).toggleClass("selected");
    $(this).siblings(".dropdown-menu").slideToggle("slow");
}

