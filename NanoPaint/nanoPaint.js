/*
 * nanoPaint - Canvas and Interactive Menu System for In browser painting
 *
 *
 * Joseph Van Drunen -- March 2015
 */

$(document).ready(function () { cpaint.init(); });

var cpaint = {
  drawing: 		false,
  tool:			'marker',
  lineThickness: 	12,
  color:		'#333399',
  lastX: 0,
  lastY: 0,
  originX: 0,
  originY: 0
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

cpaint.init = function () {  
  cpaint.canvas  = $('#canvas1')[0];
  cpaint.cx = cpaint.canvas.getContext('2d');
  cpaint.cx.canvas.width  = window.innerWidth;
  cpaint.cx.canvas.height = window.innerHeight;
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  					// create offscreen copy of canvas in an image

  // bind functions to events, button clicks
  $(cpaint.canvas).bind('mousedown', cpaint.drawStart);
  $(cpaint.canvas).bind('mousemove', cpaint.draw);
  $(cpaint.canvas).bind('mouseout', cpaint.stopdraw);
  $('*').bind('mouseup', cpaint.drawEnd);

  // bind menu options
  $('#menuClear').bind('click', cpaint.clear);
  $('#menuNew').bind('click', cpaint.clear);
  $('#menuFade').bind('click', cpaint.fade);
  $('#menuUnfade').bind('click', cpaint.unfade);
  $('#menuOpen').bind('click',cpaint.open);
  $('#menuSave').bind('click',cpaint.save);
  $('#blur').bind('click',cpaint.blur);
  $('#sharpen').bind('click',cpaint.sharpen);
  $('#edgeDetect').bind('click',cpaint.edgeDetect);
  $('#emboss').bind('click',cpaint.emboss);
  
  $('.toolSelector').bind('click',cpaint.toolSelect);
  
  $('#brushWidthSlider').bind('input change',cpaint.updateWidth);
  $('.toolbarCell').bind('click',cpaint.buttonClick);
  $('.dropdown-heading').bind('click',cpaint.menuToggle);
  cpaint.updateWidth();
  
  
  //$('#toolBar').show();		// when toolbar is initialized, make it visible
}

/*
 * handle mousedown events
 */
cpaint.drawStart = function(ev) {
  var x, y; 				// convert event coords to (0,0) at top left of canvas
  x = ev.pageX - $(cpaint.canvas).offset().left;
  y = ev.pageY - $(cpaint.canvas).offset().top;
  ev.preventDefault();

  cpaint.drawing = true;			// go into drawing mode
  cpaint.cx.lineWidth = cpaint.lineThickness;
  cpaint.cx.strokeStyle = cpaint.color;
  cpaint.cx.fillStyle = cpaint.color;
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  						// save drawing window contents
  cpaint.lastX = x;
  cpaint.lastY = y;
  cpaint.originX = x;
  cpaint.originY = y;
}
/*
 * bugfix for marker
 */
cpaint.stopdraw = function(ev){
  if( cpaint.tool == 'marker'){
    cpaint.drawing = false;	
  }
}
/*
 * handle mouseup events
 */
cpaint.drawEnd = function(ev) {
  cpaint.drawing = false;
}

/*
 * handle mousemove events
 */
cpaint.draw = function(ev) {
  var x, y;
  x = ev.pageX - $(cpaint.canvas).offset().left;
  y = ev.pageY - $(cpaint.canvas).offset().top;

  if (cpaint.drawing) {
    if(cpaint.tool == 'marker'){
        cpaint.cx.beginPath();
        cpaint.cx.moveTo(cpaint.lastX,cpaint.lastY);
        cpaint.cx.lineTo(x,y);
        cpaint.cx.stroke();
        cpaint.cx.arc(cpaint.lastX, cpaint.lastY, cpaint.lineThickness/2 , 0, 2*Math.PI, false);
        cpaint.cx.arc(x, y, cpaint.lineThickness/2 , 0, 2*Math.PI, false);
        cpaint.cx.fill();
    } else if (cpaint.tool == 'line'){
        cpaint.cx.putImageData(cpaint.imgData, 0, 0);
        cpaint.cx.beginPath();
        cpaint.cx.moveTo(cpaint.originX,cpaint.originY);
        cpaint.cx.lineTo(x,y);
        cpaint.cx.stroke();
        cpaint.cx.arc(cpaint.originX, cpaint.originY, cpaint.lineThickness/2 , 0, 2*Math.PI, false);
        cpaint.cx.arc(x, y, cpaint.lineThickness/2 , 0, 2*Math.PI, false);
        cpaint.cx.fill();
    
    } else if (cpaint.tool == 'rectangle'){
        cpaint.cx.putImageData(cpaint.imgData, 0, 0);
        cpaint.cx.beginPath();
        cpaint.cx.rect(cpaint.originX,cpaint.originY,x-cpaint.originX,y-cpaint.originY);
        cpaint.cx.fill();
    
    } else if (cpaint.tool == 'eraser'){
        cpaint.cx.strokeStyle = "#ffffff";
        cpaint.cx.fillStyle = "#ffffff";
        cpaint.cx.beginPath();
        cpaint.cx.moveTo(cpaint.lastX,cpaint.lastY);
        cpaint.cx.lineTo(x,y);
        cpaint.cx.stroke();
        cpaint.cx.arc(cpaint.lastX, cpaint.lastY, cpaint.lineThickness/2 , 0, 2*Math.PI, false);
        cpaint.cx.arc(x, y, cpaint.lineThickness/2 , 0, 2*Math.PI, false);
        cpaint.cx.fill();
    }
  }
  cpaint.lastX = x;
  cpaint.lastY = y;
} 


/*
 * tool selector
 */
cpaint.toolSelect = function(ev) {
    cpaint.tool = $(this).attr("data-toolName");
    $(".toolSelector").removeClass("selected");
    $('#messages').prepend("tool: " +cpaint.tool + "<br>");	
    $(this).addClass("selected");
}
/*
 * clear the canvas, offscreen buffer, and message box
 */
cpaint.clear = function(ev) {
  cpaint.cx.clearRect(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  $('#messages').html("");
}  

/*
 * color picker widget handler
 */
$("#brushCanvas").spectrum({
    color: cpaint.color,
    showInput: true,
    preferredFormat: "hex",
    move: function (color) {
        cpaint.color = color;
        cpaint.updateWidth();
    },
    change: function(color) {
        cpaint.color = color;
        cpaint.updateWidth();
        $('#messages').prepend("Color: " + color + "<br>");
    }
});

/*
 * Menu Expanders
 */
cpaint.menuToggle = function(ev) {
    $(this).toggleClass("selected");
    $(this).siblings(".dropdown-menu").slideToggle("slow");
}
/*
 * Width Selector Preview Handler
 */
cpaint.updateWidth = function(ev) {
    width = $("#brushWidthSlider").val()
    cpaint.lineThickness = width;
    widthCanvas = $("#brushCanvas")[0].getContext('2d');
    widthCanvas.clearRect ( 0 , 0 , 260, 250 );
    widthCanvas.beginPath();
    widthCanvas.arc(125, 125, width/2 , 0, 2*Math.PI, false);
    widthCanvas.fillStyle = cpaint.color;
    widthCanvas.fill();
}

/*
 * handle open menu item by making open dialog visible
 */
cpaint.open = function(ev) { 
  $('#fileInput').show();
  $('#file1').bind('change submit',cpaint.loadFile);
  $('#closeBox1').bind('click',cpaint.closeDialog);
  $('#messages').prepend("In open<br>");	
}

/*
 * load the image whose URL has been typed in
 * (this should have some error handling)
 */
cpaint.loadFile = function() {
  $('#fileInput').hide();
  $('#messages').prepend("In loadFile<br>");	
  var img = document.createElement('img');
  var file1 = $("#file1").val();
  $('#messages').prepend("Loading image " + file1 + "<br>");	

  img.src=file1;
  img.onload = function() {
    cpaint.cx.clearRect(0, 0, cpaint.canvas.width, cpaint.canvas.height);
    cpaint.cx.drawImage(img,0, 0, cpaint.canvas.width, cpaint.canvas.height);
  }
}

cpaint.closeDialog = function() {
  $('#fileInput').hide();
}

/*
 * to save a drawing, copy it into an image element
 * which can be right-clicked and save-ased
 */
cpaint.save = function(ev) {
  $('#messages').prepend("Saving...<br>");	
  var dataURL = cpaint.canvas.toDataURL();
  if (dataURL) {
    $('#saveWindow').show();
    $('#saveImg').attr('src',dataURL);
    $('#closeBox2').bind('click',cpaint.closeSaveWindow);
  } else {
    alert("Your browser doesn't implement the toDataURL() method needed to save images.");
  }
}

cpaint.closeSaveWindow = function() {
  $('#saveWindow').hide();
}

/*
 * Fade/unfade an image by altering Alpha of each pixel
 */
cpaint.fade = function(ev) {
  $('#messages').prepend("Fade<br>");	
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  var pix = cpaint.imgData.data;
  for (var i=0; i<pix.length; i += 4) {
    pix[i+3] /= 2;		// reduce alpha of each pixel
  }
  cpaint.cx.putImageData(cpaint.imgData, 0, 0);
}

cpaint.unfade = function(ev) {
  $('#messages').prepend("Unfade<br>");	
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  var pix = cpaint.imgData.data;
  for (var i=0; i<pix.length; i += 4) {
    pix[i+3] *= 2;		// increase alpha of each pixel
  }
  cpaint.cx.putImageData(cpaint.imgData, 0, 0);
}
/*
 * Convolution kernels
 */
var matrices = [
  {
    name: 'mean removal (sharpen)',
    data:
     [[-1, -1, -1],
      [-1,  9, -1],
      [-1, -1, -1]]
  },
  {
    name: 'sharpen',
    data:
     [[ 0, -2,  0],
      [-2, 11, -2],
      [ 0, -2,  0]]
  },
  {
    name: 'blur',
    data:
     [[ 1,  2,  1],
      [ 2,  4,  2],
      [ 1,  2,  1]]
  },
  {
    name: 'emboss',
    data:
     [[ 2,  0,  0],
      [ 0, -1,  0],
      [ 0,  0, -1]],
    offset: 127,
  },
  {
    name: 'emboss subtle',
    data:
     [[ 1,  1, -1],
      [ 1,  3, -1],
      [ 1, -1, -1]],
  },
  {
    name: 'edge detect',
    data:
     [[ 1,  1,  1],
      [ 1, -7,  1],
      [ 1,  1,  1]],
  },
  {
    name: 'edge detect 2',
    data:
     [[-5,  0,  0],
      [ 0,  0,  0],
      [ 0,  0,  5]],
  }
];
/*
 * Convolutions
 */
cpaint.blur = function(ev) {
  radius = $("#blurSlider").val()
  $('#messages').prepend("bluring with radius: " + radius + "<br>");
  stackBlurCanvasRGBA( "canvas1", 0, 0, cpaint.canvas.width, cpaint.canvas.height, radius );
}

cpaint.sharpen = function(ev) {
  matrix = [[ 0, -2,  0],
      [-2, 11, -2],
      [ 0, -2,  0]];
  $('#messages').prepend("sharpening<br>");
  cpaint.convolve(matrix, undefined, undefined);
}

cpaint.edgeDetect = function(ev) {
  matrix = [[-5,  0,  0],
      [ 0,  0,  0],
      [ 0,  0,  5]];
  $('#messages').prepend("detecting edges<br>");
  cpaint.convolve(matrix, undefined, undefined);
}

cpaint.emboss = function(ev) {
  matrix = [[ 2,  0,  0],
      [ 0, -1,  0],
      [ 0,  0, -1]];
  $('#messages').prepend("emBOSSing<br>");
  cpaint.convolve(matrix, undefined, 127);
}


cpaint.convolve = function(matrix, divisor, offset) {
  var m = [].concat(matrix[0], matrix[1], matrix[2]); // flatten
  if (!divisor) {
    divisor = m.reduce(function(a, b) {return a + b;}) || 1; // sum
  }
  var olddata = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  var oldpx = olddata.data;
  var newdata = cpaint.cx.createImageData(olddata);
  var newpx = newdata.data
  var len = newpx.length;
  var res = 0;
  var w = cpaint.canvas.width;
  for (var i = 0; i < len; i++) {
    if ((i + 1) % 4 === 0) {
      newpx[i] = oldpx[i];
      continue;
    }
    res = 0;
    var these = [
      oldpx[i - w * 4 - 4] || oldpx[i],
      oldpx[i - w * 4]     || oldpx[i],
      oldpx[i - w * 4 + 4] || oldpx[i],
      oldpx[i - 4]         || oldpx[i],
      oldpx[i],
      oldpx[i + 4]         || oldpx[i],
      oldpx[i + w * 4 - 4] || oldpx[i],
      oldpx[i + w * 4]     || oldpx[i],
      oldpx[i + w * 4 + 4] || oldpx[i]
    ];
    for (var j = 0; j < 9; j++) {
      res += these[j] * m[j];
    }
    res /= divisor;
    if (offset) {
      res += offset;
    }
    newpx[i] = res;
  }
  cpaint.cx.putImageData(newdata,0,0);
};
/*

StackBlur - a fast almost Gaussian Blur For Canvas

Version: 	0.5
Author:		Mario Klingemann
Contact: 	mario@quasimondo.com
Website:	http://www.quasimondo.com/StackBlurForCanvas
Twitter:	@quasimondo

In case you find this class useful - especially in commercial projects -
I am not totally unhappy for a small donation to my PayPal account
mario@quasimondo.de

Or support me on flattr: 
https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

Copyright (c) 2010 Mario Klingemann

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

var mul_table = [
        512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
        454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
        482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
        437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
        497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
        320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
        446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
        329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
        505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
        399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
        324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
        268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
        451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
        385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
        332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
        289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];
        
   
var shg_table = [
	     9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
		17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
		19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
		20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
		23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

function stackBlurImage( imageID, canvasID, radius, blurAlphaChannel )
{
			
 	var img = document.getElementById( imageID );
	var w = img.naturalWidth;
    var h = img.naturalHeight;
       
	var canvas = document.getElementById( canvasID );
      
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";
    canvas.width = w;
    canvas.height = h;
    
    var context = canvas.getContext("2d");
    context.clearRect( 0, 0, w, h );
    context.drawImage( img, 0, 0 );

	if ( isNaN(radius) || radius < 1 ) return;
	
	if ( blurAlphaChannel )
		stackBlurCanvasRGBA( canvasID, 0, 0, w, h, radius );
	else 
		stackBlurCanvasRGB( canvasID, 0, 0, w, h, radius );
}


function stackBlurCanvasRGBA( id, top_x, top_y, width, height, radius )
{
	if ( isNaN(radius) || radius < 1 ) return;
	radius |= 0;
	
	var canvas  = document.getElementById( id );
	var context = canvas.getContext("2d");
	var imageData;
	
	try {
	  try {
		imageData = context.getImageData( top_x, top_y, width, height );
	  } catch(e) {
	  
		// NOTE: this part is supposedly only needed if you want to work with local files
		// so it might be okay to remove the whole try/catch block and just use
		// imageData = context.getImageData( top_x, top_y, width, height );
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			imageData = context.getImageData( top_x, top_y, width, height );
		} catch(e) {
			alert("Cannot access local image");
			throw new Error("unable to access local image data: " + e);
			return;
		}
	  }
	} catch(e) {
	  alert("Cannot access image");
	  throw new Error("unable to access image data: " + e);
	}
			
	var pixels = imageData.data;
			
	var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, 
	r_out_sum, g_out_sum, b_out_sum, a_out_sum,
	r_in_sum, g_in_sum, b_in_sum, a_in_sum, 
	pr, pg, pb, pa, rbs;
			
	var div = radius + radius + 1;
	var w4 = width << 2;
	var widthMinus1  = width - 1;
	var heightMinus1 = height - 1;
	var radiusPlus1  = radius + 1;
	var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;
	
	var stackStart = new BlurStack();
	var stack = stackStart;
	for ( i = 1; i < div; i++ )
	{
		stack = stack.next = new BlurStack();
		if ( i == radiusPlus1 ) var stackEnd = stack;
	}
	stack.next = stackStart;
	var stackIn = null;
	var stackOut = null;
	
	yw = yi = 0;
	
	var mul_sum = mul_table[radius];
	var shg_sum = shg_table[radius];
	
	for ( y = 0; y < height; y++ )
	{
		r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
		
		r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
		g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
		b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
		a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );
		
		r_sum += sumFactor * pr;
		g_sum += sumFactor * pg;
		b_sum += sumFactor * pb;
		a_sum += sumFactor * pa;
		
		stack = stackStart;
		
		for( i = 0; i < radiusPlus1; i++ )
		{
			stack.r = pr;
			stack.g = pg;
			stack.b = pb;
			stack.a = pa;
			stack = stack.next;
		}
		
		for( i = 1; i < radiusPlus1; i++ )
		{
			p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
			r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
			g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
			b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
			a_sum += ( stack.a = ( pa = pixels[p+3])) * rbs;
			
			r_in_sum += pr;
			g_in_sum += pg;
			b_in_sum += pb;
			a_in_sum += pa;
			
			stack = stack.next;
		}
		
		
		stackIn = stackStart;
		stackOut = stackEnd;
		for ( x = 0; x < width; x++ )
		{
			pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
			if ( pa != 0 )
			{
				pa = 255 / pa;
				pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
				pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
				pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
			} else {
				pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
			}
			
			r_sum -= r_out_sum;
			g_sum -= g_out_sum;
			b_sum -= b_out_sum;
			a_sum -= a_out_sum;
			
			r_out_sum -= stackIn.r;
			g_out_sum -= stackIn.g;
			b_out_sum -= stackIn.b;
			a_out_sum -= stackIn.a;
			
			p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;
			
			r_in_sum += ( stackIn.r = pixels[p]);
			g_in_sum += ( stackIn.g = pixels[p+1]);
			b_in_sum += ( stackIn.b = pixels[p+2]);
			a_in_sum += ( stackIn.a = pixels[p+3]);
			
			r_sum += r_in_sum;
			g_sum += g_in_sum;
			b_sum += b_in_sum;
			a_sum += a_in_sum;
			
			stackIn = stackIn.next;
			
			r_out_sum += ( pr = stackOut.r );
			g_out_sum += ( pg = stackOut.g );
			b_out_sum += ( pb = stackOut.b );
			a_out_sum += ( pa = stackOut.a );
			
			r_in_sum -= pr;
			g_in_sum -= pg;
			b_in_sum -= pb;
			a_in_sum -= pa;
			
			stackOut = stackOut.next;

			yi += 4;
		}
		yw += width;
	}

	
	for ( x = 0; x < width; x++ )
	{
		g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
		
		yi = x << 2;
		r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
		g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
		b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
		a_out_sum = radiusPlus1 * ( pa = pixels[yi+3]);
		
		r_sum += sumFactor * pr;
		g_sum += sumFactor * pg;
		b_sum += sumFactor * pb;
		a_sum += sumFactor * pa;
		
		stack = stackStart;
		
		for( i = 0; i < radiusPlus1; i++ )
		{
			stack.r = pr;
			stack.g = pg;
			stack.b = pb;
			stack.a = pa;
			stack = stack.next;
		}
		
		yp = width;
		
		for( i = 1; i <= radius; i++ )
		{
			yi = ( yp + x ) << 2;
			
			r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
			g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
			b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
			a_sum += ( stack.a = ( pa = pixels[yi+3])) * rbs;
		   
			r_in_sum += pr;
			g_in_sum += pg;
			b_in_sum += pb;
			a_in_sum += pa;
			
			stack = stack.next;
		
			if( i < heightMinus1 )
			{
				yp += width;
			}
		}
		
		yi = x;
		stackIn = stackStart;
		stackOut = stackEnd;
		for ( y = 0; y < height; y++ )
		{
			p = yi << 2;
			pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
			if ( pa > 0 )
			{
				pa = 255 / pa;
				pixels[p]   = ((r_sum * mul_sum) >> shg_sum ) * pa;
				pixels[p+1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
				pixels[p+2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
			} else {
				pixels[p] = pixels[p+1] = pixels[p+2] = 0;
			}
			
			r_sum -= r_out_sum;
			g_sum -= g_out_sum;
			b_sum -= b_out_sum;
			a_sum -= a_out_sum;
		   
			r_out_sum -= stackIn.r;
			g_out_sum -= stackIn.g;
			b_out_sum -= stackIn.b;
			a_out_sum -= stackIn.a;
			
			p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;
			
			r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
			g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
			b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
			a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3]));
		   
			stackIn = stackIn.next;
			
			r_out_sum += ( pr = stackOut.r );
			g_out_sum += ( pg = stackOut.g );
			b_out_sum += ( pb = stackOut.b );
			a_out_sum += ( pa = stackOut.a );
			
			r_in_sum -= pr;
			g_in_sum -= pg;
			b_in_sum -= pb;
			a_in_sum -= pa;
			
			stackOut = stackOut.next;
			
			yi += width;
		}
	}
	
	context.putImageData( imageData, top_x, top_y );
	
}

function BlurStack()
{
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 0;
	this.next = null;
}
