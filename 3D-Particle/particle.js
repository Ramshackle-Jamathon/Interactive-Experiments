/*
 * 3D Particle - Enjoy an outerSpace-inBrowser gravitron experience
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


$(document).ready(function () {
    particleSIM.init(); 
});

var particleSIM = {
  particles: [],
  particleCount: 0,
  tool: "trackBall",
  moving: false,
  lighting: true,
  fill: true,
  stroke: false,
  ambient: 0.3,
  trackBallMatrix: $M([
                [1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]
            ]),
  zoomMatrix: $M([
                [1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]
            ]),  
  perspectiveMatrix: $M([
                [1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0.001,1]
            ]),
  comboMatrix: $M([
                [1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]
            ])
}

var meny = Meny.create({
    menuElement: document.querySelector( '.meny' ),
    contentsElement: document.querySelector( '.contents' ),
    position: 'left',
    height: 200,
    width: 260,
    angle: 30,
    threshold: 40,
    overlap: 6,
    transitionDuration: '0.5s',
    transitionEasing: 'ease',
    gradient: 'rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.65) 100%)',
    mouse: true,
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
    particleSIM.trackBallRadius = 200;
    particleSIM.startingPosition = {
                                        x: particleSIM.cx.canvas.width / 2,
                                        y: particleSIM.cx.canvas.height / 2,
                                        z: particleSIM.cx.canvas.width / 2
                                    };
    particleSIM.trans1 = $M([ 
            [1, 0, 0, particleSIM.startingPosition.x ],
            [0, 1, 0, particleSIM.startingPosition.y ],
            [0, 0, 1, particleSIM.startingPosition.z ],
            [0, 0, 0, 1]
            ]),
    particleSIM.trans2 = $M([ 
            [1, 0, 0, -(particleSIM.startingPosition.x )],
            [0, 1, 0, -(particleSIM.startingPosition.y )],
            [0, 0, 1, -(particleSIM.startingPosition.z )],
            [0, 0, 0, 1]
            ])

    // bind events to event distributors
    $(particleSIM.canvas).bind('click', particleSIM.handleClick);
    $(particleSIM.canvas).bind('mouseup', particleSIM.handleMouseUp);
    $(particleSIM.canvas).bind('mousedown', particleSIM.handleMouseDown);
    $(particleSIM.canvas).bind('mousemove', particleSIM.handleMouseMove);
    $(particleSIM.canvas).bind('mousewheel DOMMouseScroll', particleSIM.zoom);
    
    //menuBinds
    $('.dropdown-heading').bind('click',particleSIM.launchParticle);


    $(particleSIM.canvas).bind('contextmenu', particleSIM.launchParticle);
    //generate sphere model
    particleSIM.sphere(8, 8, 30);
    particleSIM.updateComboMatrix();
    
    //middleParticle
    particleSIM.setFreeParticle(particleSIM.startingPosition.x, particleSIM.startingPosition.y, particleSIM.startingPosition.z, 99999999999999999, 0, 0, 0);
    
    // initial Particles
    for(var i = 0; i < 1; ++i) {
       // particleSIM.setFreeParticle(particleSIM.startingPosition.x, particleSIM.startingPosition.y, particleSIM.startingPosition.z, 30 + Math.random() * 2 * coinFlip(), Math.random() * 360, 10);
    }
    //start with timestamp 0
    particleSIM.play(0);
}
/*
 * particle constructor
 */
particleSIM.Particle = function (posx, posy, posz, life, alpha, beta, speed, index) {
    this.x = posx;
    this.y = posy;
    this.z = posz;
    this.index = index;
    this.lastx = posx
    this.lasty = posy
    this.lasty = posz
    this.life = life;
    var alphaInRadians = alpha * Math.PI / 180;
    var betaInRadians = beta * Math.PI / 180;
    this.velocity = {
        x: speed * Math.sin(alphaInRadians) * Math.cos(betaInRadians),
        y: speed * Math.sin(betaInRadians),
        z: speed * Math.cos(alphaInRadians) * Math.sin(betaInRadians)
    };
    this.color = '#fff';
    this.radius = 4;
    return this;
}
/*
 * particle update object
 */
particleSIM.Particle.prototype.update = function(dt) {  


    //FRICTION
    //this.velocity.x *= 0.90;
    //this.velocity.y *= 0.90;
    //this.velocity.Z *= 0.90;    
    
    //GRAVITY
    var newX = (particleSIM.cx.canvas.width / 2) - this.x;
    var newY = (particleSIM.cx.canvas.height / 2) - this.y;
    var newZ = (particleSIM.cx.canvas.width / 2) - this.z;
    m = Math.sqrt(newX * newX + newY * newY + newZ * newZ);
    if (m) {
        newX /= m;
        newY /= m;
        newZ /= m;
    }
    newX *= 3;
    newY *= 3;
    newZ *= 3;
    this.velocity.x += newX;
    this.velocity.y += newY;
    this.velocity.z += newZ;    
        
        
    this.life -= dt;
    if(this.life > 0) {
        //particle is alive! much celebration!
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.z += this.velocity.z * dt;
        /*if(this.x >= particleSIM.cx.canvas.width || this.x <= 0){
            this.velocity.x = -0.9 * this.velocity.x;
        }
        if(this.y >= particleSIM.cx.canvas.height || this.y <= 0){
            this.velocity.y = -0.9 * this.velocity.y;
        }
        if(this.z >= particleSIM.cx.canvas.width || this.z <= 0){
            this.velocity.z = -0.9 * this.velocity.z;
        }*/
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
 * alpha: up/down angle
 * beta: left/right angle
 */
particleSIM.setFreeParticle = function(posx, posy, posz, life, alpha, beta, speed) {
    particleSIM.particleCount++;
    if(typeof particleSIM.particles[particleSIM.particleCount-1] === 'undefined') {
         particleSIM.particles.push(new particleSIM.Particle(posx, posy, posz, life, alpha, beta, speed, particleSIM.particleCount-1));
    }
    else {
        var particle = particleSIM.particles[particleSIM.particleCount-1];
        particle.x = posx;
        particle.y = posy;
        particle.z = posz;
        particle.index = particleSIM.particleCount;
        particle.life = life;

        var alphaInRadians = alpha * Math.PI / 180;
        var betaInRadians = beta * Math.PI / 180;
        particle.velocity = {
            x: speed * Math.sin(alphaInRadians) * Math.cos(betaInRadians),
            y: speed * Math.sin(betaInRadians),
            z: speed * Math.cos(alphaInRadians) * Math.sin(betaInRadians)
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
    particleSIM.cx.beginPath();
    particleSIM.cx.arc(particleSIM.cx.canvas.width/2, particleSIM.cx.canvas.height/2, particleSIM.trackBallRadius, 0, 2* Math.PI);
    particleSIM.cx.stroke();
    
    particleSIM.cx.save();
    
    
    //var translationVector = $V([particle.x, particle.y, particle.z, 1]);
    
    
    particleSIM.particles.sort(function(a,b) {
        return b.z - a.z;
    });
    for(var i = 0; i < particleSIM.particleCount; ++i) {
        var particle = particleSIM.particles[i];
        if (particle.life > 0) {
            //console.log("particle: " + i + " at  (" + particle.x + ", " + particle.y + ", " + particle.z + ")");
        
            var translationMatrix = $M([
                [1,0,0,particle.x],
                [0,1,0,particle.y],
                [0,0,1,particle.z],
                [0,0,0,1]
            ]); 
            
                
            //var comboMatrix = translationMatrix.x(particleSIM.perspectiveMatrix).x(particleSIM.trackBallMatrix).x(particleSIM.zoomMatrix);
            var comboMatrix = (particleSIM.comboMatrix).x(translationMatrix);
            var translatedVerts = [];
            for (var a = 0; a < vertices.length; ++a){
                var vert = comboMatrix.x(vertices[a])
                //console.log(vert.elements);
                
                //var vert = particleSIM.perspectiveMatrix.x(vert);
                vert.elements[0] = vert.elements[0] * (1 / vert.elements[3]);
                vert.elements[1] = vert.elements[1] * (1 / vert.elements[3]);
                //vert.elements[2] = vert.elements[2] * (1 / vert.elements[3]);
                //console.log(vert.elements);
                translatedVerts.push(vert);
            }
            //Lighting
            if (particleSIM.lighting){
                for (var f = 0; f < faces.length; f++){                     
                    var faceIndices = faces[f].indices;
                    v1 = (translatedVerts[faceIndices[1]].subtract(translatedVerts[faceIndices[0]]));
                    v2 = (translatedVerts[faceIndices[2]].subtract(translatedVerts[faceIndices[1]]));
                    var normal = $V(v1.elements.slice(0,3)).cross($V(v2.elements.slice(0,3)));
                    var light = Math.abs($V([0,0,-1]).dot(normal.toUnitVector())) + particleSIM.ambient ;
                    //Color Illumination
                    faces[f].Kd[0] = particleSIM.brighten(0.3, light);
                    faces[f].Kd[1] = particleSIM.brighten(0.3, light);
                    faces[f].Kd[2] = particleSIM.brighten(0.3, light);
                }    
            }
            //hidden surface removal
            faces.sort(function(face1, face2){
                var face1Sum = 0;
                var face2Sum = 0;
                for (var i = 0; i < face1.indices.length; ++i)
                    face1Sum += translatedVerts[face1.indices[i]].elements[2];
                for (var i = 0; i < face2.indices.length; ++i)
                    face2Sum += translatedVerts[face2.indices[i]].elements[2];
                return (face1Sum / face1.indices.length) - ( face2Sum / face2.indices.length);
            });
            
            for (var a = 0; a < faces.length; ++a) {
                var indices = faces[a].indices;
                // back/front face culling
                
                var v1 = translatedVerts[indices[1]].subtract(translatedVerts[indices[0]]);
                v1 = $V(v1.elements.slice(0, 3));
                var v2 = translatedVerts[indices[2]].subtract(translatedVerts[indices[1]]);
                v2 = $V(v2.elements.slice(0, 3));
                if (v1.cross(v2).elements[2] > 0 )
                    continue;
                 
                particleSIM.cx.beginPath();
                var vertex = translatedVerts[indices[0]];
                particleSIM.cx.moveTo(vertex.elements[0], vertex.elements[1]);
                for (var b = 1; b < indices.length; ++b) {
                    vertex = translatedVerts[indices[b]];
                    particleSIM.cx.lineTo(vertex.elements[0], vertex.elements[1]);
                }
                particleSIM.cx.closePath();
                if (particleSIM.fill) {
                    particleSIM.cx.fillStyle = 'rgb('+Math.floor(faces[a].Kd[0])+','+Math.floor(faces[a].Kd[1])+','+Math.floor(faces[a].Kd[2])+')';
                    particleSIM.cx.fill();
                }
                if (particleSIM.stroke)
                    particleSIM.cx.stroke();
            }
            particleSIM.cx.restore();
            
        }
    }
}

/*
 * Generate sphere model
 */
particleSIM.sphere = function(latitudeBands, longitudeBands, radius){
    vertices = new Array();
    faces = new Array(); 
    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);
            
            vertices.push($V([radius * x, radius * y, radius * z, 1]));
            /*
            textureCoordData.push(u);
            textureCoordData.push(v);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
            */
        }
    }
    var f=0;
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        faces[f] = {};
        faces[f].indices = [first, second, first + 1];
        faces[f].Kd = [1,1,1];
        f++;
        
        faces[f] = {};
        faces[f].indices = [second, second + 1, first + 1];
        faces[f].Kd = [1,1,1];
        f++;
      }
    }
}

/*
 * Event Distributors
 */
particleSIM.handleClick = function(ev) {
    if(particleSIM.tool == "particleLauncher"){
        particleSIM.launchParticle(ev)
    }
} 
particleSIM.handleMouseDown = function(ev) {
    if(particleSIM.tool == "trackBall"){
        particleSIM.trackDown(ev)
    }
}  
particleSIM.handleMouseUp = function(ev) {
    if(particleSIM.tool == "trackBall"){
        particleSIM.trackUp(ev)
    }
}  
particleSIM.handleMouseMove = function(ev) {
    if(particleSIM.tool == "trackBall"){
        particleSIM.trackMove(ev)
    }
}   
 

/*
 * updateCombo
 */ 
particleSIM.updateComboMatrix = function() {
    particleSIM.comboMatrix = particleSIM.trans1.x(particleSIM.perspectiveMatrix).x(particleSIM.zoomMatrix).x(particleSIM.trackBallMatrix).x(particleSIM.trans2);
}


/*
 * Zoom
 */ 
particleSIM.zoom = function(ev) {
    if (ev.originalEvent.wheelDelta > 0 || ev.originalEvent.detail < 0) {
        // scroll up
        //particleSIM.trackBallRadius *= 0.9;
        particleSIM.zoomMatrix = $M([
                [particleSIM.zoomMatrix.e(1,1) * 0.9,   0,   0,   0],
                [0,   particleSIM.zoomMatrix.e(2,2) * 0.9,   0,   0],
                [0,   0,   particleSIM.zoomMatrix.e(3,3) * 0.9,   0],
                [0,   0,   0, 1]
            ]);
    }
    else {
        // scroll down
        //particleSIM.trackBallRadius *= 1.1;
        particleSIM.zoomMatrix = $M([
                [particleSIM.zoomMatrix.e(1,1) * 1.1,   0,   0,   0],
                [0,   particleSIM.zoomMatrix.e(2,2) * 1.1,   0,   0],
                [0,   0,   particleSIM.zoomMatrix.e(3,3) * 1.1,   0],
                [0,   0,   0, 1]
            ]);
    }
    particleSIM.updateComboMatrix();
    return false;
}
 
/*
 * Particle launcher
 */
particleSIM.launchParticle = function(ev) {
    var x = ev.pageX - $(particleSIM.canvas).offset().left;
    var y = ev.pageY - $(particleSIM.canvas).offset().top;
    x = (x - particleSIM.cx.canvas.width/2)/particleSIM.trackBallRadius;
    y = (y - particleSIM.cx.canvas.height/2)/particleSIM.trackBallRadius;
    var z = Math.sqrt( Math.abs(1 - x*x - y*y)) * (x*x + y*y > 1 ? -1 : 1 );
    var launchVec = $V([x, y, z, 1]);
    
     
    launchVec = (particleSIM.zoomMatrix).x(particleSIM.trackBallMatrix).inverse().x(launchVec);
    launchVec.elements[0] = launchVec.elements[0] * particleSIM.trackBallRadius + particleSIM.startingPosition.x;
    launchVec.elements[1] = launchVec.elements[1] * particleSIM.trackBallRadius + particleSIM.startingPosition.y;
    launchVec.elements[2] = launchVec.elements[2] * particleSIM.trackBallRadius + particleSIM.startingPosition.z;
    console.log(launchVec.elements);
    
    for(var i = 0; i < 1; ++i) {
        particleSIM.setFreeParticle(launchVec.elements[0], launchVec.elements[1], launchVec.elements[2], 9000 + Math.random() * 2 * coinFlip(), Math.random() * 360, Math.random() * 360, 100);
    }
    ev.preventDefault();
}


/*
 * TrackBall Tool
 */ 
particleSIM.trackBall = function(x,y){
  var x = (x - particleSIM.cx.canvas.width/2)/particleSIM.trackBallRadius;
  var y = -(y - particleSIM.cx.canvas.height/2)/particleSIM.trackBallRadius;
  var z = Math.sqrt(Math.abs(1 - x*x - y*y)) * (x*x + y*y > 1 ? -1 : 1);
  return $V([x, y, z]);
  //return $V([x, -y, Math.sqrt( Math.max(1 - (x*x) - (y*y) , 0) )]);
}

particleSIM.trackDown = function(ev){
  particleSIM.moving = true;
  offset = $('canvas').offset();
  var x = ev.pageX - $(particleSIM.canvas).offset().left;
  var y = ev.pageY - $(particleSIM.canvas).offset().top;
  
  //correcting mouse coordinates
  var m1 = particleSIM.trackBallMatrix;
  m1 = $M([ 
        [m1.e(1,1), m1.e(1,2), m1.e(1,3)],
        [m1.e(2,1), m1.e(2,2), m1.e(2,3)],
        [m1.e(3,1), m1.e(3,2), m1.e(3,3)],
        ]);
  particleSIM.startVector = m1.inverse().x(particleSIM.trackBall(x,y));
}

particleSIM.trackUp = function(ev) {
  particleSIM.moving = false;
}

particleSIM.trackMove = function(ev) {
  if (particleSIM.moving){
    var x = ev.pageX - $(particleSIM.canvas).offset().left;
    var y = ev.pageY - $(particleSIM.canvas).offset().top;
    var newVector = particleSIM.trackBall(x,y);
    var n = particleSIM.startVector.cross(newVector).toUnitVector();
    var theta = particleSIM.startVector.angleFrom(newVector);
    var m1 = Matrix.Rotation(theta,n);
    //translates for centering rotation
    particleSIM.trackBallMatrix =  $M([ 
                    [m1.e(1,1), m1.e(1,2), m1.e(1,3), 0],
                    [m1.e(2,1), m1.e(2,2), m1.e(2,3), 0],
                    [m1.e(3,1), m1.e(3,2), m1.e(3,3), 0],
                    [0, 0, 0, 1]]);   
    particleSIM.updateComboMatrix();        
  }
}


/*
 * Helper Functions
 */
function coinFlip() {
    return Math.random() > .5 ? 1 : -1;
}
// Menu Expander
particleSIM.menuToggle = function(ev) {
    $(this).toggleClass("selected");
    $(this).siblings(".dropdown-menu").slideToggle("slow");
}

particleSIM.brighten = function(color, amount){
    color = color * amount;
    if (color > 1) { color = 1 }
    return Math.floor(color * 255);
}
