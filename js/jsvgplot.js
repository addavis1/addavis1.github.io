// some extra math functions to add to the default ones
Math.sinh = function(x) {	return(0.5*(Math.exp(x)-Math.exp(-x))); }
Math.cosh = function(x) {	return(0.5*(Math.exp(x)+Math.exp(-x))); }
Math.tanh = function(x) {	return( (Math.exp(2*x)-1)/(Math.exp(2*x)+1) ); }
Math.log10=function(x){ return Math.log(x)/Math.LN10; }


// create a coordinate system [x,y] and allows it reference to the svg coordinate system [u,v]
// has greater flexibility than the svg transform 
function createCoords(svgid,parameters) {
	this.svgid = svgid;
	this.svg = document.getElementById(svgid);
	this.fontSize = parseFloat(getComputedStyle(this.svg).fontSize);
	let rem = this.fontSize;
	let re = new RegExp("rem");
	
		// MARGINS
	let margin = new Array();
	let marginTop,marginRight,marginBottom,marginLeft;	
	if( parameters['margin'] != undefined ) { margin = parameters['margin']; }	
	marginTop = re.test(margin[0]) ? parseFloat(margin[0])*rem : parseFloat(margin[0]);
	marginRight = re.test(margin[1]) ? parseFloat(margin[1])*rem : parseFloat(margin[1]);
	marginBottom = re.test(margin[2]) ? parseFloat(margin[2])*rem : parseFloat(margin[2]);
	marginLeft = re.test(margin[3]) ? parseFloat(margin[3])*rem : parseFloat(margin[3]);
	margin = [marginTop,marginRight,marginBottom,marginLeft];
	this.margin = margin;
	this.marginTop = marginTop; this.marginRight = marginRight; this.marginBottom = marginBottom; this.marginLeft = marginLeft;
	
		// svg area [min-u,max-v,width,height] of the plotBox		
	this.plotBox = [marginLeft,marginTop,this.svg.clientWidth-(marginRight+marginLeft),this.svg.clientHeight-(marginTop+marginBottom)];
		// svg coordinate Range
	this.uMin = this.plotBox[0];
	this.uMax = this.plotBox[0]+this.plotBox[2];
	this.vMin = this.plotBox[1];
	this.vMax = this.plotBox[1]+this.plotBox[3];
	
	this.defineCoords(parameters);
	
	  // define two special groups for this coordinate system
  var g1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  var g2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	
  /* this.g1.id = this.id+'_g1'; this.g2.id = this.id+'_g2';  */
  this.svg.g1 = g1; // default for plots
  this.svg.g2 = g2;  // default for axes
  this.svg.appendChild(g2);
  this.svg.appendChild(g1);
	
	if( parameters['clip'] == true ) { this.plotObject('clip',{'x1':this.xMin,'x2':this.xMax,'y1':this.yMin,'y2':this.yMax}); }
} // END function createCoords()

createCoords.prototype.defineCoords = function(parameters) {
			// plot coordinates Range
	if( parameters == undefined ) { var parameters = {}; }
	if( parameters['coordsRange'] == undefined ) { parameters['coordsRange'] = {}; }
	this.xMin = parameters['coordsRange'][0] != undefined ? parameters['coordsRange'][0] : 0;
	this.yMin = parameters['coordsRange'][1] != undefined ? parameters['coordsRange'][1] : 0;
	this.xMax = parameters['coordsRange'][2] != undefined ? parameters['coordsRange'][2] : this.plotBox.width-this.xMin;
	this.yMax = parameters['coordsRange'][3] != undefined ? parameters['coordsRange'][3] : this.plotBox.height-this.yMin;
	this.width = this.xMax - this.xMin;
	this.height = this.yMax - this.yMin;
	this.coordsRange = [this.xMin,this.yMin,this.xMax,this.yMax,this.width,this.height];
	this.y0 = ( this.yMin <= 0 && this.yMax >= 0 ) ? 0 : this.yMin;
	this.x0 = ( this.xMin <= 0 && this.xMax >= 0 ) ? 0 : this.xMin;
	
	// define simple linear coordinate transformation    
	let a,b,c,d,e,f;
	b = c = 0;
	a = (this.uMax-this.uMin)/(this.xMax-this.xMin);
	d = (this.vMin-this.vMax)/(this.yMax-this.yMin);
	e = (this.uMax*this.xMin - this.uMin*this.xMax)/(this.xMin-this.xMax);
	f = (this.vMin*this.yMin - this.vMax*this.yMax)/(this.yMin-this.yMax);
	
	this.u = function(x,y) { if( y === undefined ) { y = 0; } return( a*x+e ); }
	this.v = function(y,x) { if( x === undefined ) { x = 0; } return( d*y+f ); }	
	this.x = function(u,v) { if( v === undefined ) { v = 0; } return( (u-e)/a ); }
  this.y = function(v,u) { if( u === undefined ) { u = 0; } return( (v-f)/d ); }
	
	  // logarithmic options  
  this.log = parameters['log'] != undefined ? parameters['log'] : 'linear';
  if( this.log == 'x' || this.log == 'xy') {    
    a = (this.uMax-this.uMin)/Math.log10(this.xMax/this.xMin);
    e = (this.uMin*Math.log10(this.xMax)-this.uMax*Math.log10(this.xMin))/Math.log10(this.xMax/this.xMin);
    this.u = function (x,y) { return(a*Math.log10(x)+e); }
    this.x = function (u,v) { return(Math.pow(10,(u-e)/a)); }    
  }
  else if ( this.log == 'y' || this.log == 'xy' ) { 
    d = -1*(this.vMax-this.vMin)/Math.log10(this.yMax/this.yMin);
    f = (this.vMax*Math.log10(this.yMax)-this.vMin*Math.log10(this.yMin))/Math.log10(this.yMax/this.yMin);
    this.v = function (y,x) { return(d*Math.log10(y)+f); }
    this.y = function (v,u) { return(Math.pow(10,(v-f)/d)); }
  }
	
	// define a ratio of lengths for a scalable coordinate radius
	let ruv = Math.sqrt( (this.uMax-this.uMin)*(this.uMax-this.uMin)+(this.vMax-this.vMin)*(this.vMax-this.vMin) );
  let rxy = Math.sqrt( (this.xMax-this.xMin)*(this.xMax-this.xMin)+(this.yMax-this.yMin)*(this.yMax-this.yMin) );
	this.r = function(r) { return( r*ruv/rxy ); }
	this.uv = function( uv ) { return( uv*rxy/ruv ); }
}


function setAttributes(obj,attributes) { for( attribute in attributes ) { obj.setAttributeNS(null,attribute,attributes[attribute]); } }

createCoords.prototype.plotAxis = function (axis,attributes,axisSVG,minorSVG,labelSVG) {
	let xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	let xLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	let yLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');  

	// set Default values and add any new definitions
	if( attributes == undefined ) { var attributes = {}; }
	if( axisSVG == undefined ) { var axisSVG = {}; }
	if( minorSVG == undefined ) { var minorSVG = {}; }
	if( labelSVG == undefined ) { var labelSVG = {}; }
	if( gridSVG == undefined ) { var gridSVG = {}; }
	
	let x0 = this.xMin <= 0 && this.xMax >= 0 || this.xMin == 0 ? 0 : this.xMin;
	let y0 = this.yMin <= 0 && this.yMax >= 0 || this.yMin == 0 ? 0 : this.yMin;	
	attributes = Object.assign({'x0':x0,'y0':y0,'x1':this.xMin,'x2':this.xMax,'y1':this.yMin,'y2':this.yMax,'tick':1,'tickL':this.fontSize,},attributes); // coordinate stuff
	attributes = Object.assign({'minorL':attributes['tickL']*2/3,'minorN':0,'append':this.svg.g2,'grid':false},attributes);
	axisSVG = Object.assign({'stroke':'black','stroke-width':3,'stroke-linecap':'square'},axisSVG );
	labelSVG = Object.assign({'font-size':'2rem'},labelSVG);
	gridSVG = Object.assign({'stroke':'grey','stroke-dasharray':'10 10'},gridSVG);
	
	this.x0 = attributes['x0'];
	this.axisfontSize = labelSVG['font-size'];
	this.tickL = attributes['tickL'];
	this.xaxisLabelsShow = attributes['xaxisLabelsShow'] != undefined ? attributes['xaxisLabelsShow'] : attributes['axisLabelsShow'] != undefined ? attributes['axisLabelsShow'] : true;
	this.yaxisLabelsShow = attributes['yaxisLabelsShow'] != undefined ? attributes['yaxisLabelsShow'] : attributes['axisLabelsShow'] != undefined ? attributes['axisLabelsShow'] : true;
	
	
	let i,d,x1,x2,y1,y2,x,y,dx,dy,t0,xt,yt,dg;
	x0 = attributes['x0']; y0 = attributes['y0'];
	x1 = attributes['x1']; y1 = attributes['y1'];
	x2 = attributes['x2']; y2 = attributes['y2'];
	let n,n1,n2,showX0,showY0,dm;
	let xtickL = attributes['xtickL'] != undefined ? attributes['xtickL'] : attributes['tickL']; this.xtickL = xtickL;
	let tickNx = attributes['tickNx'] != undefined ? attributes['tickNx'] : attributes['tickN'];
	let ytickL = attributes['ytickL'] != undefined ? attributes['ytickL'] : attributes['tickL']; this.ytickL = ytickL;
	let tickNy = attributes['tickNy'] != undefined ? attributes['tickNy'] : attributes['tickN'];	
	let gridx = attributes['gridx'] != undefined ? attributes['gridx'] : attributes['grid'];	
	let gridy = attributes['gridy'] != undefined ? attributes['gridy'] : attributes['grid'];	
	
	// PLOT X AXIS
	if( (axis == 'xy' || axis == 'x') && !(this.log == 'x' || this.log == 'xy') ) {
		let xtxt = new Array();
		let xpts = new Array();
		// xtickL and tickNx defined earlier
		let minorLx = attributes['minorLx'] != undefined ? attributes['minorLx'] : attributes['minorL'];
		let minorNx = attributes['minorNx'] != undefined ? attributes['minorNx'] : attributes['minorN'];
		dx = attributes['tickX'] != undefined ? attributes['tickX'] : attributes['tick'];
		dm = minorNx > 0 ? dx/(minorNx+1) : false;
		
		// get X axis points		
		if( attributes['xpts'] != undefined ) { xpts = attributes['xpts']; }
		else { // auto generate the major tick points
			n1 = Math.floor( Math.abs(x0-x1)/dx );
			n2 = Math.floor( Math.abs(x0-x2)/dx );
			if( y0 == this.yMin ) { showX0 = ( attributes['showX0'] == undefined || attributes['showX0'] == true  ) ? true : false; }
			else { showX0 = ( attributes['showX0'] == true ) ? true : false; }			
			n = n1+n2+ ( y0 == this.yMin || attributes['showX0'] == true ) ? 1 : 0;
			i = 0; for( x = x0-n1*dx; x < x0; x+= dx ) { xpts[i] = x; i++; }
			if( showX0 || true ) { xpts[i] = x0; i++; }
			for( x = x0+dx; x <= x0+n2*dx; x+= dx ) { xpts[i] = x; i++; }
			n = i;		
		}
		n = xpts.length;
		// get X axis labels
		if( attributes['xaxisLabels'] != undefined && attributes['xaxisLabels'].length >= n ) { xtxt = attributes['xaxisLabels']; }
		else { for( i = 0; i < n; i++ ) { xtxt[i] = toHTML(xpts[i],2); } }		
		// plot x-axis
		d=''; dg = '';
		yt = attributes['yt'] != undefined ? attributes['yt'] : this.v(y0)+xtickL+1	;
		let dv = attributes['dv'] != undefined ? attributes['dv'] : 0;
		for( i = 0; i < n; i++ ) { // plot major ticks and labels
			x = xpts[i];
			if( x != x0 || attributes['showX0'] == true ) {	
				d += 'M '+this.u(x)+' '+this.v(y0)+' v '+(xtickL)+' ';
				dg += 'M '+x+' '+this.yMin+' V '+this.yMax+' ';
				if( this.xaxisLabelsShow !== false ) {
					this.plotText(xtxt[i],{'x':this.u(x),'y':yt,'append':xAxis,'dv':dv,'coords':'svg'},Object.assign({'dominant-baseline':'hanging'},labelSVG)	);
				}
			}
			// add last few minor axis
			for ( let j = 1; j <= minorNx; j++ ) {
				if( x-j*dm >= x1 ) {
					d += 'M '+this.u(x-j*dm)+' '+' '+this.v(y0)+' v '+(minorLx)+' ';			
				}
			}
		}
	
		// add last few minor axis
		x = xpts[n-1];
		for ( let j = 1; j <= minorNx; j++ ) {
			if( x+j*dm <= x2 ) {
				d += 'M '+this.u(x+j*dm)+' '+this.v(y0)+' v '+(minorLx)+' ';			
			}
		}
		if( gridx != false ) { this.plotObject('path',{'d':dg,'append':xAxis},gridSVG); }
		this.plotObject('path',{'d':d,'append':xAxis,'coords':'svg'},axisSVG);
		this.plotObject('path',{'d':'M '+x1+' '+y0+' H '+x2,'append':xAxis},axisSVG);
		axisGroup.appendChild(xAxis);
		axisGroup.appendChild(xLabels);
	} // END plot x Axis	
	
	// PLOT Y AXIS
	if( axis == 'xy' || axis == 'y' ) { 
		let ytxt = new Array();
		let ypts = new Array();
		// ytickL and tickNy defined earlier
		let minorLy = attributes['minorLy'] != undefined ? attributes['minorLy'] : attributes['minorL'];
		let minorNy = attributes['minorNy'] != undefined ? attributes['minorNy'] : attributes['minorN'];
		dy = attributes['tickY'] != undefined ? attributes['tickY'] : attributes['tick'];
		dm = minorNy > 0 ? dy/(minorNy+1) : false;
		
		// get y axis points
		if( x0 == this.xMin ) { showY0 = ( attributes['showY0'] == undefined || attributes['showY0'] == true  ) ? true : false; }
		else { showY0 = ( attributes['showY0'] == true ) ? true : false; }	
		
		if( attributes['ypts'] != undefined ) { ypts = attributes['ypts']; }
		else if ( this.log == 'y' || this.log == 'xy' ) {
			n2 = Math.ceil(Math.log10(this.yMax));
			n1 = Math.floor(Math.log10(this.yMin));
			n = n2-n1;
			i = 0; for( y = Math.pow(10,n1); y <= this.yMax; y *= 10 ) {
				ypts[i] = y; i++;
			}
			n = ypts.length;
		}
		else { // auto generate the major tick points
			n1 = Math.floor( Math.abs(y0-y1)/dy );
			n2 = Math.floor( Math.abs(y0-y2)/dy );		
			n = n1+n2+ ( x0 == this.xMin || attributes['showY0'] == true ) ? 1 : 0;
			i = 0; for( y = y0-n1*dy; y < y0; y+= dy ) { ypts[i] = y; i++; }
			if( showY0 || true ) { ypts[i] = y0; i++; }
			for( y = y0+dy; y <= y0+n2*dy; y+= dy ) { 
				ypts[i] = y; i++;				
			}			
		}
		n = ypts.length;
				
		// get Y axis labels
		if( attributes['yaxisLabels'] != undefined && attributes['yaxisLabels'].length >= n ) { ytxt = attributes['yaxisLabels']; }
		else { for( i = 0; i < n; i++ ) { ytxt[i] = ypts[i]; } }
		ytxt = fixNumbers(ytxt);
		
		// plot y-axis
		d=''; dg = '';
		xt = attributes['xt'] != undefined ? attributes['xt'] : this.u(x0)-ytickL-2;
		let du = attributes['du'] != undefined ? attributes['du'] : 0;
		for( i = 0; i < n; i++ ) { // plot major ticks and labels
			y = ypts[i];
			if( y != y0 || showY0 == true ) {	
				d += 'M '+this.u(x0)+' '+' '+this.v(y)+' h '+(-ytickL)+' ';
				dg += 'M '+this.xMin+' '+y+' H '+this.xMax+' ';
				if( this.yaxisLabelsShow != false ) {					
					this.plotText(ytxt[i],{'x':xt,'y':this.v(y),'append':yAxis,'du':du,'coords':'svg'},Object.assign({'text-anchor':'end'},labelSVG)	);
				}
			}
			// add minor axis points
			for ( let j = 1; j <= minorNy; j++ ) {
				if( this.log == 'y' || this.log == 'xy' ) {
					d += 'M '+this.u(x0)+' '+this.v(y+y*j*9/(minorNy+1))+' h '+(-minorLy)+' ';			
				} else {
					if( y-j*dm >= y1 ) { d += 'M '+this.u(x0)+' '+this.v(y-j*dm)+' h '+(-minorLy)+' '; 	}
				}
			}
		}	
		// add last few minor axis
		y = ypts[n-1];
		for ( let j = 1; j <= minorNy; j++ ) {
			if( y+j*dm <= y2 ) { 
				d += 'M '+this.u(x0)+' '+' '+this.v(y+j*dm)+' h '+(-minorLy)+' ';			
			}
		}
		if( gridy != false ) { this.plotObject('path',{'d':dg,'append':yAxis},gridSVG); }
		this.plotObject('path',{'d':d,'append':yAxis,'coords':'svg'},axisSVG);
		this.plotObject('path',{'d':'M '+x0+' '+y1+' V '+y2,'append':yAxis},axisSVG);
		yAxis.id = 'yAxisPlot';
		axisGroup.appendChild(yAxis);
		axisGroup.appendChild(yLabels);
	} // END plot y Axis
		
	attributes['append'].appendChild(axisGroup);
}
createCoords.prototype.plotAxes = createCoords.prototype.plotAxis;
/* END plotAxis */

createCoords.prototype.plotAxisText = function (axis,attributes,textSVG) {	
	textSVG = Object.assign({'stroke':'black','stroke-width':1,'fill':'black','font-size':'2rem','font-family':'Calibri'},textSVG == undefined ? {} : textSVG );
	attributes = Object.assign({'position':'axis','xaxis':'this is the x-axis','yaxis':'this is the y-axis','axisH':0.5,'axisV':0.5,'append':this.svg.g2},attributes == undefined ? {} : attributes);
	let append = attributes['append'];
	
	let xaxisBox = new Array(); // [x1,y1,x2,y2];
	let yaxisBox = new Array();
	let re = new RegExp("rem");
	let axisfontSize = re.test(textSVG['font-size']) ? parseFloat(textSVG['font-size'])*this.fontSize : parseFloat(textSVG['font-size']);
	let axisGap = attributes['axisGap'] != undefined ? attributes['axisGap'] : axisfontSize + this.tickL-4;
	let xaxisGap = attributes['xaxisGap'] != undefined ? attributes['xaxisGap'] : axisGap;
	let yaxisGap = attributes['yaxisGap'] != undefined ? attributes['yaxisGap'] : axisGap-0.25*axisfontSize;

	if( axis == 'x' || axis == 'xy' ) { 
		// defines the space below the tickmark labels and the edge of the graph, expect parameters as a fraction of this space
		if( this.xaxisLabelsShow == false ) { xaxisGap -= axisfontSize-4; }
		if( attributes['xposition'] == 'bottom' ) {
			if( this.y0 == this.yMin ) { xaxisBox = [this.uMin,this.vMax+xaxisGap,this.uMax,this.vMax+this.marginBottom];	} 
			else { xaxisBox = [this.uMin,this.vMax,this.uMax,this.vMax+this.marginBottom]; }	
		} else { xaxisBox = [this.uMin,this.v(this.y0)+xaxisGap,this.uMax,this.vMax+this.marginBottom]; }
		let xaxisH = attributes['xaxisH'] != undefined ? attributes['xaxisH'] : attributes['axisH'];
		let xaxisV = attributes['xaxisV'] != undefined ? attributes['xaxisV'] : 0;
		let x = xaxisBox[0]+xaxisH*(xaxisBox[2]-xaxisBox[0]);
		let y = xaxisBox[1]-xaxisV*(xaxisBox[3]-xaxisBox[1]);
		let du = (attributes['xdu'] != undefined) ? attributes['xdu'] : (attributes['du'] != undefined ? attributes['du'] : 0);
		let dv = (attributes['xdv'] != undefined) ? attributes['xdv'] : (attributes['dv'] != undefined ? attributes['dv'] : 0);
		let temp = {'x':x,'y':y,'coords':'svg','du':du,'dv':dv,'append':append}
		if( attributes['rotatex'] != undefined ) { temp = Object.assign({'rotate':attributes['rotatex']},temp); }
		this.plotText(attributes['xaxis'],temp,Object.assign({'dominant-baseline':'hanging','text-anchor':'middle'},textSVG));	
		//this.plotObject('rect',{'x1':xaxisBox[0],'y1':xaxisBox[1],'x2':xaxisBox[2],'y2':xaxisBox[3],'append':this.svg.g2,'coords':'svg'},{'fill':'blue','fill-opacity':0.2});
	}
	if( axis == 'y' || axis == 'xy' ) {
		// defines the space below the tickmark labels and the edge of the graph, expect parameters as a fraction of this space
		if( this.yaxisLabelsShow == false ) { yaxisGap -= axisfontSize; }
		if( attributes['yposition'] == 'left' ) {
			if( this.x0 == this.xMin ) { yaxisBox = [this.uMin-this.marginLeft,this.vMin,this.uMin-yaxisGap,this.vMin];	} 
			else { yaxisBox = [this.uMin-this.marginLeft,this.vMax,this.uMin,this.vMin]; }	
		} else { yaxisBox = [this.uMin-this.marginLeft,this.vMin,this.u(this.x0)-yaxisGap,this.vMax+this.marginBottom]; }
		let yaxisH = attributes['yaxisH'] != undefined ? attributes['yaxisH'] : 0;
		let yaxisV = attributes['yaxisV'] != undefined ? attributes['yaxisV'] : attributes['axisV'];
		let x = yaxisBox[2]+yaxisH*(yaxisBox[2]-yaxisBox[0]);
		let y = yaxisBox[3]-(1-yaxisV)*(yaxisBox[3]-yaxisBox[1]);
		let rotate = attributes['rotatey'] != undefined ? attributes['rotatey'] : ( attributes['rotate'] != undefined ? attributes['rotate'] : '-90' );
		let du = (attributes['ydu'] != undefined) ? attributes['ydu'] : (attributes['du'] != undefined ? attributes['du'] : 0);
		let dv = (attributes['ydv'] != undefined) ? attributes['ydv'] : (attributes['dv'] != undefined ? attributes['dv'] : 0);
		let temp = {'x':x,'y':y,'rotate':rotate,'coords':'svg','du':du,'dv':dv,'append':append}

		this.plotText(attributes['yaxis'],temp,Object.assign({'dominant-baseline':'','text-anchor':'middle'},textSVG));	
		//this.plotObject('rect',{'x1':yaxisBox[0],'y1':yaxisBox[1],'x2':yaxisBox[2],'y2':yaxisBox[3],'append':this.svg.g2,'coords':'svg'},{'fill':'blue','fill-opacity':0.2});
		//this.plotObject('circle',{'cx':x,'cy':y,'append':this.svg.g2,'coords':'svg'},{'r':10,'fill':'red','fill-opacity':0.2});
	}
	
	
}
createCoords.prototype.plotAxesText = createCoords.prototype.plotAxesText;

createCoords.prototype.plotText = function(text,attributes,textSVG) { 
	let obj = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	let x = attributes['x'];
  let y = attributes['y'];
	let du = attributes['du'] != undefined ? attributes['du'] : 0;
	let dv = attributes['dv'] != undefined ? attributes['dv'] : 0;
	let dx = attributes['dx'] != undefined ? attributes['dx'] : 0;
	let dy = attributes['dy'] != undefined ? attributes['dy'] : 0;
	let subx = attributes['subx'] != undefined ? attributes['subx'] : 0; 
	let suby = attributes['suby'] != undefined ? attributes['suby'] : 8;
	let supx = attributes['supx'] != undefined ? attributes['supx'] : 0; 
	let supy = attributes['supy'] != undefined ? attributes['supy'] : 12; 	
	
	
	if( textSVG == undefined ) { var textSVG = {}; }	
	textSVG = Object.assign({'font-size':'2rem','dominant-baseline':'central','text-anchor':'middle','font-family':'Calibri'},textSVG == undefined ? {} : textSVG );
	
	let re1 = new RegExp("[_]");
	let re2 = new RegExp("[\\^]");
	if(re1.test(text) == true ) { // subscript
		let str = text.split(/_/g);
		// before the subscript
		let tspan0 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');				
		setAttributes(tspan0,{'dy':0});
		tspan0.appendChild(document.createTextNode(str[0]));
		obj.appendChild(tspan0);
		// subscript
		let tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');				
		setAttributes(tspan1,{'font-size':'65%','dominant-baseline':'central','dy':1*suby});
		tspan1.appendChild(document.createTextNode(str[1]));
		obj.appendChild(tspan1);
		// after the subscript
		if( str[2] != undefined ) { 
			let tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');				
			setAttributes(tspan2,{'dy':-1*suby});
			tspan2.appendChild(document.createTextNode(str[2]));
			obj.appendChild(tspan2);
		}			
	}
	else if(re2.test(text)) { // superscript
		let str = text.split(/\^/g);
		// before the superscript
		let tspan0 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');				
		setAttributes(tspan0,{'dy':0});
		tspan0.appendChild(document.createTextNode(str[0]));
		obj.appendChild(tspan0);
		// superscript
		let tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');				
		setAttributes(tspan1,{'font-size':'65%','dominant-baseline':'central','dy':-1*supy});
		tspan1.appendChild(document.createTextNode(str[1]));
		obj.appendChild(tspan1);
		// after the superscript
		if( str[2] != undefined ) {
			let tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');				
			setAttributes(tspan2,{'dy':1*supy});
			tspan2.appendChild(document.createTextNode(str[2]));
			obj.appendChild(tspan2);
		}			
	}
  else { obj.appendChild(document.createTextNode(text)); }

	let u,v,r;
	if( attributes['coords'] == 'svg' ) { u = v = r = function(x) { return x; } }
	else { u = this.u; v = this.v; r = this.r; }
	
	if( attributes['rotate'] != undefined ) {
		let rotate = 'rotate('+attributes['rotate']+' '+(u(x)+du)+' '+(v(y)+dv)+')';
		textSVG = Object.assign({'transform':rotate},textSVG == undefined ? {} : textSVG );
	}
	
	setAttributes(obj,{'x':u(x+dx,y)+du,'y':v(y+dy,x)+dv});
	setAttributes(obj,textSVG);
	let append = attributes['append'] != undefined ? attributes['append'] : this.svg.g1;
	append.appendChild(obj);  
}



createCoords.prototype.plotObject = function(objType,attributes,objSVG) {
	let obj = document.createElementNS('http://www.w3.org/2000/svg', objType);
	let re = new RegExp("[A-z]{1,2}"); // matches non-numeric characters
	if( objSVG == undefined ) { var objSVG = {}; }
	if ( attributes == undefined ) { var attributes = {}; }	
	attributes = Object.assign({'append':this.svg.g1,'clip':this.svg.g1,'coords':'canvas'},attributes );
	let append = attributes['append'];
	
	let u,v,r;
	if( attributes['coords'] == 'svg' ) { u = v = r = function(x) { return x; } }
	else { u = this.u; v = this.v; r = this.r; }
	
  if( objType == 'circle' ) { /* CIRCLE */
    let tempx = attributes['cx'] != undefined ? attributes['cx'] : attributes['x'];
    let tempy = attributes['cy'] != undefined ? attributes['cy'] : attributes['y'];  	
    objSVG['cx'] = u(tempx,tempy);
    objSVG['cy'] = v(tempy,tempx);
		if( attributes['r'] != undefined ) { objSVG['r'] = r(attributes['r']); }
  }
	else if ( objType == 'line' ) { /* LINE */
    objSVG['x1'] = u(attributes['x1']);
    objSVG['y1'] = v(attributes['y1']);
    objSVG['x2'] = u(attributes['x2']);
    objSVG['y2'] = v(attributes['y2']); 
  }
	else if ( objType == 'rect' || objType == 'image' ) {    
    let u1,u2,v1,v2;        
    if( attributes['width'] !== undefined ) {
      u1 =  u(attributes['x'],attributes['y']);
      u2 =  u(attributes['x']+attributes['width'],attributes['y']);
      v1 =  v(attributes['y'],attributes['x']);
      v2 =  v(attributes['y']+attributes['height'],attributes['x']);    
    } else {
      u1 =  u(attributes['x1'],attributes['y1']);
      u2 =  u(attributes['x2'],attributes['y2']);
      v1 =  v(attributes['y1'],attributes['x1']);
      v2 =  v(attributes['y2'],attributes['x2']);
      delete attributes['x1']; delete attributes['x2'];
      delete attributes['y1']; delete attributes['y2'];
    }
    if( !re.test(attributes['rx']) ) { objSVG['rx'] =  r(attributes['rx']); } 
    if( !re.test(attributes['ry']) ) { objSVG['ry'] =  r(attributes['ry']); } 
      
    objSVG['x'] = u2 > u1 ? u1 : u2;
    objSVG['width'] = Math.abs(u2-u1);      
    objSVG['y'] = v2 > v1 ? v1 : v2;
    objSVG['height'] = Math.abs(v2-v1);
		if( attributes['href'] ) { objSVG['href'] = attributes['href'];	}
		
		
  }
	else if( objType == 'clip' ) { // CLIP
    let clippath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    let cliprect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');	
		let u1,u2,v1,v2;        
    if( attributes['width'] !== undefined ) {
      u1 = u(attributes['x'],attributes['y']); u2 = u(attributes['x']+attributes['width'],attributes['y']);
      v1 = v(attributes['y'],attributes['x']); v2 = v(attributes['y']+attributes['height'],attributes['x']);    
    } else if ( attributes['x1'] != undefined ) {
      u1 = u(attributes['x1'],attributes['y1']); u2 = u(attributes['x2'],attributes['y2']);
      v1 = v(attributes['y1'],attributes['x1']); v2 = v(attributes['y2'],attributes['x2']);
      delete attributes['x1']; delete attributes['x2']; delete attributes['y1']; delete attributes['y2'];
    } else { u1 = uMin; u2 = uMax; v1 = vMin; v2 = vMax; 		}
		setAttributes(cliprect,{'x':u2>u1?u1:u2, 'y':v2>v1?v1:v2, 'width':Math.abs(u2-u1),'height':Math.abs(v2-v1)});
    clippath.appendChild(cliprect);
    clippath.id = this.svg.id+'_clip'+Math.round(Math.random()*1000);
    this.svg.appendChild(clippath);       
    setAttributes(append,{'clip-path':'url(#'+clippath.id+')'});        
	}
	else if( objType == 'use' ) {  // HAVEN'T TESTED THIS NEW VERSION YET   
    let dx = attributes['dx'] !== undefined ? attributes['dx'] : 0;
    let dy = attributes['dy'] !== undefined ? attributes['dy'] : 0;
    let id = attributes['id']; 
    objSVG['x'] = u(attributes['x']+dx,attributes['y']+dy);
    objSVG['y'] = v(attributes['y']+dy,attributes['x']+dx);        
    obj.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#'+id);
  }
  else if( objType == 'g' ) { } // might do something with this later
	else if( objType == 'path' ) {  
    objSVG['d'] = this.parsePath(attributes['d'],attributes['coords']);                
  }
	
	// SET attributes of the SVG object using the SVG parameters
	for( attribute in objSVG ) { obj.setAttributeNS(null,attribute,objSVG[attribute]); }
	append.appendChild(obj);
}

// takes a properly formatted d string, breaks it into an array and then reassembles the d string with SVG coords
createCoords.prototype.parsePath = function(d,coords) {
	var i,d,re,dstring,darray,isx,x,y,cmd,x1,y1,x2,y2;
	isx = true;        
	dstring = '';   
	re = new RegExp("[\\s,]+");
	darray = d.split(re);
	let u,v,r;
	if( coords == 'svg' ) { u = v = r = function(x) { return x; } }
	else { u = this.u; v = this.v; r = this.r; }
	
	for( i=0; i<darray.length; i++ ) {
		if( /[MmLlTt]/.test(darray[i]) ) {
			if( /[ml]/.test(darray[i]) ) {
				cmd = darray[i].toUpperCase();
				x = x*1+darray[i+1]*1;
				y = y*1+darray[i+2]*1;
			}
			else {
				cmd = darray[i];
				x = darray[i+1]*1;
				y = darray[i+2]*1;
			}        
			dstring+=cmd+' ';
			dstring+=u(x,y).toFixed(3)+' ';
			dstring+=v(y,x).toFixed(3)+' ';
			i+=2;
		}
		else if( /[Hh]/.test(darray[i]) ) {
			if( /[h]/.test(darray[i]) ) {
				cmd = darray[i].toUpperCase();
				x = x*1+darray[i+1]*1;
			}
			else {
				cmd = darray[i];
				x = darray[i+1]*1;          
			}        
			dstring+=cmd+' ';
			dstring+=u(x,y).toFixed(3)+' ';        
			i+=1;
		}
		else if( /[Vv]/.test(darray[i]) ) {
			if( /[v]/.test(darray[i]) ) {
				cmd = darray[i].toUpperCase();
				y = y*1+darray[i+1]*1;
			}
			else {
				cmd = darray[i];
				y = darray[i+1]*1;          
			}        
			dstring+=cmd+' ';
			dstring+=v(y,x).toFixed(3)+' ';        
			i+=1;
		}
		if( /[SsQq]/.test(darray[i]) ) {
			if( /[sq]/.test(darray[i]) ) {
				cmd = darray[i].toUpperCase();
				x1 = x*1+darray[i+1]*1;
				y1 = y*1+darray[i+2]*1;
				x = x*1+darray[i+3]*1;
				y = y*1+darray[i+4]*1;
			}
			else {
				cmd = darray[i];
				x1 = darray[i+1]*1;
				y1 = darray[i+2]*1;
				x = darray[i+3]*1;
				y = darray[i+4]*1;
			}        
			dstring+=cmd+' ';
			dstring+=u(x1,y1).toFixed(3)+' ';
			dstring+=v(y1,x1).toFixed(3)+' ';
			dstring+=u(x,y).toFixed(3)+' ';
			dstring+=v(y,x).toFixed(3)+' ';
			i+=4;
		} 
		else if( /[Cc]/.test(darray[i]) ) {
			if( /[c]/.test(darray[i]) ) {
				cmd = darray[i].toUpperCase();
				x1 = x*1+darray[i+1]*1;
				y1 = y*1+darray[i+2]*1;
				x2 = x*1+darray[i+3]*1;
				y2 = y*1+darray[i+4]*1;
				x = x*1+darray[i+5]*1;
				y = y*1+darray[i+6]*1;
			}
			else {
				cmd = darray[i];
				x1 = darray[i+1]*1;
				y1 = darray[i+2]*1;
				x2 = darray[i+3]*1;
				y2 = darray[i+4]*1;
				x = darray[i+5]*1;
				y = darray[i+6]*1;
			}        
			dstring+=cmd+' ';
			dstring+=u(x1,y1).toFixed(3)+' ';
			dstring+=v(y1,x1).toFixed(3)+' ';
			dstring+=u(x2,y2).toFixed(3)+' ';
			dstring+=v(y2,x2).toFixed(3)+' ';
			dstring+=u(x,y).toFixed(3)+' ';
			dstring+=v(y,x).toFixed(3)+' ';
			i+=6;
		}      
		else if( /[Aa]/.test(darray[i]) ) { // works, but don't find it very useful
			if( /[a]/.test(darray[i]) ) {
				cmd = darray[i].toUpperCase();
				x = x*1+darray[i+6]*1;
				y = y*1+darray[i+7]*1;
			}
			else {
				cmd = darray[i].toUpperCase();
				x = darray[i+6]*1;
				y = darray[i+7]*1;
			}
			dstring+=cmd+' ';
			dstring+=r(darray[i+1]).toFixed(3)+' '; // rx
			dstring+=r(darray[i+2]).toFixed(3)+' ' // ry
			dstring+=darray[i+3]+' '; // x-axis-rotation
			dstring+=darray[i+4]+' '; // large arc flag
			dstring+=darray[i+5]+' '; // sweep flag
			dstring+=u(x,y).toFixed(3)+' ';
			dstring+=v(y,x).toFixed(3)+' ';
			i+=7;        
		}
		else if ( /[Zz]/.test(darray[i]) ) { dstring+=' Z'; }
	}   	
  return dstring;
} /* PARSE PATH */

createCoords.prototype.plotFunction = function(func,funcParam,pathParam,pathSVG,pointsParam,pointsSVG) {
  let pathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let plotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');  

	if( funcParam == undefined ) { var funcParam = {}; }
	pathParam = Object.assign({'n':100,'z':false,'x1':this.xMin,'x2':this.xMax}, pathParam == undefined ? {} : pathParam );	
	pathSVG = Object.assign({'stroke':'black','stroke-width':1,'fill':'none'}, pathSVG == undefined ? {} : pathSVG );
	pointsParam = Object.assign({'i0':0,'dn':2,'points':false}, pointsParam == undefined ? {} : pointsParam );
	pointsSVG = Object.assign({'fill-opacity':0.5,'r':5}, pointsSVG == undefined ? {} : pointsSVG );
	
	let xpts = new Array(); let ypts = new Array(); let lpts = new Array();
  let path,i,j,n;
  
  if( pathParam['xpts'] !== undefined ) { xpts = pathParam['xpts']; }
  if( pathParam['ypts'] !== undefined ) { ypts = pathParam['ypts']; }  
	
	/* PATH */
	/* acquire points from the function between x1 and x2 inclusive */
  if( (pathParam['xpts'] === undefined || pathParam['ypts'] === undefined) ) { 
    let x1 = pathParam['x1'];
    let x2 = pathParam['x2']; 
    n = pathParam['n'] !== undefined ? pathParam['n'] : 50;
    for( i = 0; i <= n; i++ ) {
      xpts[i] = x1+i*(x2-x1)/n;
      ypts[i] = func(xpts[i],funcParam);    
    }    
  } else { n = xpts.length; } 
	
	path = ( pathParam['close'] == true ) ? 'M '+xpts[0]+' '+this.y0+' L '+xpts[0]+','+ypts[0] : 'M '+xpts[0]+','+ypts[0];
	for( i=1; i <= n; i++ ) { path+=' L '+xpts[i]+','+ypts[i]; }
	if( pathParam['close'] == true  ) { path+=' L '+xpts[n]+' '+this.y0; }
	if( pathParam['z'] == true || pathParam['Z'] == true ) { path+=' Z'; }		
	this.plotObject('path',{'d':path,'append':pathGroup},pathSVG);		
	plotGroup.appendChild(pathGroup);
	
	/* POINTS */
	let xpts2 = new Array();
	let ypts2 = new Array();
	if( pathParam['points'] == undefined || !(pathParam['points'] == false) ) { 
		// if the points are defined, use those instead
		n = 0;
		if( pointsParam['xpts'] !== undefined ) { xpts2 = pointsParam['xpts']; n = xpts2.length; }
		if( pointsParam['ypts'] !== undefined ) { ypts2 = pointsParam['ypts']; }  
		// else, use the plot points
		if( n == 0 ) { xpts2 = xpts; ypts2 = ypts; n = xpts.length; }
		let i0 = pointsParam['i0'] != undefined ? pointsParam['i0'] : 0;
		let dn = pointsParam['dn'] != undefined ? pointsParam['dn'] : 2;
				
		let r = false;
		if( pointsParam['r'] != undefined ) { r = pointsParam['r']; }
		else if ( pointsSVG['r'] == undefined ) { r = (this.xMax-this.xMin)/100; }

		for( i = i0; i < n; i += dn ) { 
			if( r != false ) { temp = {'cx':xpts2[i],'cy':ypts2[i],'r':r}; }
			else { temp = {'cx':xpts2[i],'cy':ypts2[i]}; }			
			this.plotObject('circle',temp,pointsSVG);
		}
	}
  let append = pathParam['append'] != undefined ? pathParam['append'] : this.svg.g1;
	if( pathParam['id'] ) { plotGroup.id = pathParam['id'];  }
	append.appendChild(plotGroup);
	
} // END plotFunction



// MATH FUNCTIONS
function toNumber(val) {
  let x,y,num;
  if( typeof(Number(val)) === 'number' && isFinite(val) ) { num = Number(val); /* no problem */ }
  else {
    val = val.replace(",","");
    if( val.substring(0,1) == '−'  && val.substring(val.length-1,val.length) == '°' ) { num = -1*Number(val.substring(1,val.length-1)); }
    else if( val.substring(0,1) == '−' ) { num = Number(-1*(val.substring(1))); }
    else if( val.substring(val.length-1,val.length) == '°' ) { num = Number(val.substring(0,val.length-1)); }
    else if( typeof(Number(val)) === 'number' ) { num = val; }
    else { num = NaN; }    
  } 
  return(num);
}

function toHTML(val,prec,deg) {
  if( !Number.isInteger(val) ) { val = val.toPrecision(prec); }
  else if( prec != undefined && prec != 0 ) { val = Math.round( (val.toFixed(prec,0))*Math.pow(10,prec) )/Math.pow(10,prec); }
  if( val < 0 ) { val = '−'+Math.abs(val); }
  if( deg != undefined ) { val += '°'; }
  return val; 
}

function fixNumbers(val) {
	for ( let i = 0; i < val.length; i++ ) {
			val[i] = Math.round(val[i]*1E12)/1E12;	
	}	
	return val;
}

