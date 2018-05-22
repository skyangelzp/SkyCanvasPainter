/**
 * Canvas painter
 */
'use strict';
var painter = {
	mainCanvas : '',
	mainContext : '',
	brush: new Object,
	points : [ ],
	buffer : '',
	isDrawing : false,
	init: function(canvas) {		
		this.mainCanvas = canvas;
		this.mainContext = this.mainCanvas.getContext('2d');
		this.mainCanvas.width = $(window).width();
		this.mainCanvas.height = $(window).height()-220;
		this.getbrushOption();
	},
	getbrushOption: function() {
		this.brush.color = $('.painter-color.is-active').data('color');
		this.brush.opacity = $('.group-range [data-opacity]').val()/100;
		this.brush.colorRGB = this.hexToRgb(this.brush);
		this.brush.size = $('.group-range [data-size]').val();
		this.brush.rigidity = $('.group-range [data-rigidity]').val()/100;
		this.setBrushOutput(this.brush);
		this.drawBrushPreview();
	},
	setBrushOutput: function(brush) {
		$('.group-range [data-size]').siblings('.range-value').text(brush.size);
		$('.group-range [data-opacity]').siblings('.range-value').text(Math.ceil(brush.opacity*100));
		$('.group-range [data-rigidity]').siblings('.range-value').text(Math.ceil(brush.rigidity*100));
	},
	drawBrushPreview: function() {
		var canvas = document.getElementById('brush-preview');		
		var context = canvas.getContext('2d');		
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.beginPath();
		context.fillStyle = this.getBrushGradient(context,this.brush,50,50);
		context.arc(canvas.width/2, canvas.height/2, this.brush.size/2, 0, 2 * Math.PI);
		context.closePath();
		context.fill();
	},
	hexToRgb: function(brush){
	    var c;
	    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(brush.color)){
	        c= brush.color.substring(1).split('');
	        if(c.length== 3){
	            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
	        }
	        c= '0x'+c.join('');
	        return ''+[(c>>16)&255, (c>>8)&255, c&255].join(',');
	    }
	},
	getBrushGradient : function(context,brush,x,y){
		var radgrad = context.createRadialGradient(x,y,0,x,y,brush.size/2);
		radgrad.addColorStop(0, 'rgba('+brush.colorRGB+','+brush.opacity+')');
		radgrad.addColorStop(brush.rigidity, 'rgba('+brush.colorRGB+','+brush.opacity+')');
		radgrad.addColorStop(1, 'rgba('+brush.colorRGB+',0)');
		return radgrad;
	},
	distanceBetween2Points: function ( point1, point2 ) {		
		var dx = point2.x - point1.x;
		var dy = point2.y - point1.y;
		return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );	
	},	
	angleBetween2Points: function ( point1, point2 ) {	
		var dx = point2.x - point1.x;
		var dy = point2.y - point1.y;	
		return Math.atan2( dx, dy );
	},
	writePoints: function(coord){
		this.points.push({ x: coord.x, y: coord.y });
		//first click
		if (this.points.length < 2){
			this.points.push({ x: coord.x, y: coord.y });
		}
	},
	softDraw : function(start,end){
		var distance = parseInt( this.distanceBetween2Points( start, end ) );
		var angle = this.angleBetween2Points( start, end );
		var x,y;
	    	for ( var z = 0; (z <= distance || z == 0); z++ ){
				x = start.x + (Math.sin(angle) * z);
				y = start.y + (Math.cos(angle) * z);
				var halfBrush = this.brush.size/2;			
				this.mainContext.fillStyle = this.getBrushGradient(this.mainContext,this.brush,x,y);
				this.mainContext.fillRect(x-halfBrush,y-halfBrush,this.brush.size,this.brush.size);
			}
	},
	draw : function(coord){
		if (!this.isDrawing) {
			return;
		}			
		this.writePoints(coord);
		
		if (this.brush.rigidity == 1){
			/*draw with opacity*/
			this.mainContext.clearRect(0, 0, this.mainCanvas.width,  this.mainCanvas.height);
			if (this.buffer != ''){
				this.mainContext.drawImage(this.buffer,0,0);
			}	
			this.mainContext.beginPath();
			this.mainContext.moveTo(this.points[0].x, this.points[0].y);
			this.mainContext.lineWidth = this.brush.size;
			this.mainContext.lineJoin = this.mainContext.lineCap = 'round';	
			this.mainContext.strokeStyle = 'rgba('+this.brush.colorRGB+','+this.brush.opacity+')';
			for (var i = 1; i < this.points.length; i++) {
			   this.mainContext.lineTo(this.points[i].x, this.points[i].y);
			}
			this.mainContext.stroke();
		}else{	
			/*draw with rigidity*/
		    var length = this.points.length;
		    this.softDraw(this.points[length-2], this.points[length-1]);		    	
		}		

	},
	clear : function(canvas){		
		this.buffer = '';		
		var context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.reset();
	},
	saveImg : function(){
	    var image = new Image();
	    image.src = this.mainCanvas.toDataURL("image/png");
	    var link = document.createElement("a");
	    link.setAttribute("href", image.src);
    	link.setAttribute("download", "canvasImage");
    	link.click();
	},
	saveBuffer : function(){
		this.buffer = new Image();
	    this.buffer.src = this.mainCanvas.toDataURL("image/png");	    
	},
	reset: function(){		
		this.isDrawing = false;
		this.points = [];	
		this.saveBuffer();
	}
}



$(document).ready(function() {	
	var canvas = document.getElementById('painter');
	painter.init(canvas);	

	$('.painter-color').on('click', function() {
		$(this).addClass('is-active').siblings().removeClass('is-active');
		painter.getbrushOption();
	});

	/*Update rage value on change*/
	$('.group-range [type="range"]').on('change', function(){
		painter.getbrushOption();
	});
	/*control*/
	$('.painter-action [data-clear]').on('click', function() {		
		painter.clear(canvas);
	});
	$('.painter-action [data-save]').on('click', function() {		
		painter.saveImg();
	});



	/*Drawing*/
	$('#painter').on('mousemove', function() {
		painter.draw({'x': event.clientX, 'y': event.clientY});	
	});
    canvas.addEventListener('touchmove', function(event) {            
        painter.draw({'x': event.touches[0].clientX, 'y': event.touches[0].clientY});	
    }, false);
	$('#painter').on('mousedown', function() {
		painter.isDrawing = true;  		  
		painter.draw({'x': event.clientX, 'y': event.clientY});				
	});	 
    canvas.addEventListener('touchstart', function (event) {
		painter.isDrawing = true;	  	  		  
		painter.draw({x: event.touches[0].clientX, y: event.touches[0].clientY});					
    }, false);
	$('#painter').on('mouseup touchend mouseout', function() {
		painter.reset();
	});	
});