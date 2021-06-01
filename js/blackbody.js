
var coords; // global scope
function bbinit(id,param) {
  if ( param == undefined ) { var param = {}; }
  param = Object.assign({'coordsRange':[100,0,3200,14]},param); 	
	coords = new createCoords(id,{'coordsRange':param['coordsRange'],'clip':true,'margin':['1rem','1.5rem','5rem','8rem']});

	let y2 = coords.y0 - coords.rv(coords.fontSize);
	coords.plotObject('image',{'x1':380,'y1':0,'x2':750,'y2':y2,'href':'https://addavis1.github.io/images/Linear_visible_spectrum.svg','append':coords.svg.g2,});
	let xpts = [100,500,1000,1500,2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500,8000,8500,9000,9500,10000];
	coords.plotAxis('x',{'minorNx':4,'grid':true,'tickX':500,'x0':100,'xpts':xpts,'xaxisLabelsShow':true,'showX0':true,'dv':5},{},{'stroke':'black','stroke-width':5},{'font-size':'1.25rem'});
	coords.plotAxisText('xy',{'xaxis':'wavelength (nm)','yaxis':'spectral radiance^\u2020','xposition':'bottom','xaxisV':-0.2,'xaxisH':0.5,'yaxisV':0.45,'yaxisH':-0.75},{'font-size':'1.5rem'});
	if( param['coordsRange'][3] == 14 ) { drawbbCurves(); }
	else { drawbbCurves(undefined,1); }
}

function blackbody(lambda,param) {
	// B = 2hc^2/lambda^5*1/(e^(h*c/(lambda*kb*T))-1)
	// unis Watts / m^3 / steradian
	lambda = lambda*1E-9;
	let T = param['T'];
	let h = 6.62607015*1E-34; // exact
	let c = 299792458; // exact
	let kb = 1.380649E-23; 	// exact
	let B = 2*h*c*c/Math.pow(lambda,5)/(Math.exp(h*c/(lambda*kb*T))-1);
	B = B/1E12; // convert to kW/m^2/nm;
	return B;
}

function scalebbCurve(axis,dx) {    
	if( axis == 'x' ) {	
		coords.xMax += dx*1;		
		if( coords.xMax <= 800 ) { document.getElementById('minuslambda').disabled = true; }
		else { document.getElementById('minuslambda').disabled = false; }
		
		if( coords.xMax >= 10000 ) { document.getElementById('pluslambda').disabled = true; }
		else { document.getElementById('pluslambda').disabled = false; }
	
		let svg = document.getElementById('bbsvg');
		while (svg.lastChild) { svg.removeChild(svg.lastChild); };
		
		bbinit('bbsvg',{'coordsRange':[coords.xMin,coords.yMin,coords.xMax,coords.yMax]});
	}
	if( axis == 'y' ) {
		drawbbCurves(undefined,dx);
	}  
}


let bbcids

function drawbbCurves(T,scaleY) {
	let bbplots = document.getElementsByClassName('plotid');
	// first, remove curves
	for ( let i = 0; i < bbplots.length; i++ ) {
		if( document.getElementById(bbplots[i].value) != null ) { document.getElementById(bbplots[i].value).remove(); }
	}
	let maxTemp = 0;
	// identify the active curves
	curves = new Array();
	let bbspans = document.getElementsByClassName('bbcurve');
	let k = bbspans.length;
	j = 0;
	for( let i = 0; i < bbspans.length; i++ ) {
		let active = bbspans[i].getElementsByClassName('active')[0];
		let area = bbspans[i].getElementsByClassName('area')[0];
		let curveT = bbspans[i].getElementsByClassName('temp')[0].value*1;
		let plotid = bbspans[i].getElementsByClassName('plotid')[0].value;
		if( active.value == 'true' ) {
			curves[j] = bbspans[i];
			curves[j].plot = bbplots[i];
			curves[j].temp = curveT;
			curves[j].plotid = plotid;
			bbspans[i].style.border = '2px solid black';
			area.style.visibility = 'visible';
			let curveArea = 5.670367*1E-8*Math.pow(curveT,4)/1E6;			
			let pow = Math.floor(Math.log10(curveArea));
			let base = (curveArea/Math.pow(10,pow)).toFixed(2);
			if( base == 10 ) { base = (base/10).toFixed(1); pow+=1; }
			curveArea = base+'\u00d7'+'10<sup>'+pow+'</sup>';						
			area.innerHTML = "A="+curveArea+" km<sup>2</sup>";
			if( curveT > maxTemp ) { maxTemp = curveT; } 
			let index = Math.round((curveT-1000)/100);
			let color = index >= 0 ? bbcolors[index][1] : '#ffffff';
			bbspans[i].style.background=color;
			j++;
		} else {
			bbspans[i].style.border = '1px solid black';
			area.style.display='hidden';
		}
	}

	// plot y axis from the active curve
	let scaleoption = document.getElementById('scaleoption').checked;
	if( T == undefined && document.getElementById('scaleoption').value == 0 ) { T = maxTemp; }
	else if ( T != undefined && scaleoption == true ) { /* do nothing */ }
	else if ( T != undefined && scaleoption == false ) { T = document.getElementById('scaleoption').value; }
	else { T = maxTemp; }	
	document.getElementById('scaleoption').value = T;
	
	let peakx = 2.897771955*1E6/T; // 2.897771955E3 m*K
	let peaky = blackbody(peakx,{'T':T});		
	let yMax;
	if ( scaleY != undefined ) { yMax = scaleY > 0 ? coords.yMax*scaleY : -coords.yMax/scaleY; }
	else if ( !scaleoption ) { yMax = coords.yMax; }
	else { yMax = peaky*1.2; }
	coords.yMax = yMax;
	let dy = yMax/50;
	
	let ticky;
	if( Math.log10(yMax) > 1 ) { temp = Math.log10(yMax)%1 > 0.5 ? 1 : 2; }	
	else if ( Math.log10(yMax) > 0.1 ) { temp = Math.log10(10*yMax)%1 > 0.5 ? 1 : 2; }
	else{ temp = Math.log10(100*yMax)%1 > 0.5 ? 1 : 2; }
	ticky = Math.pow(10,Math.floor(Math.log10(yMax)))/temp;
	if( document.getElementById('yAxisPlot') != null ) { document.getElementById('yAxisPlot').remove(); }	

	coords.defineCoords({'coordsRange':[100,0,coords.xMax,yMax]});	
	coords.plotAxis('y',{'minorNy':3,'tickY':ticky,'grid':true,'scientific':true},{},{'stroke':'black','stroke-width':5},{});	
	// end y axis plotted

	// sort the curves by temperature
	let n = curves.length;
	for ( let j = 0; j < n-1; j++) {
		if ( curves[j].temp < curves[j+1].temp ) {
			let temp = curves[j+1];
			curves[j+1] = curves[j];
			curves[j] = temp;
			j = -1;
		}	
	}
	
	// START THTE PLOTTING
	for ( let i = 0; i < n; i++) {
		T = curves[i].temp;
		peakx = 2.897771955*1E6/T; // 2.897771955E3 m*K
		peaky = blackbody(peakx,{'T':T});;
		let index = Math.round((T-1000)/100);
		let color = index >= 0 ? bbcolors[index][1] : '#000000';
		let id = curves[i].plotid;
		coords.plotObject('g',{'append':coords.svg.g1},{'id':id});
		let curve = document.getElementById(id);
		coords.plotFunction(blackbody,{'T':T},{'n':800,'points':false,'x1':99,'x2':coords.xMax*1+50,'z':false,'close':true,'append':curve},{'stroke':'black','stroke-opacity':0.5,'stroke-width':2,'fill':color},{'i0':0,'dn':40},{'stroke':'black','stroke-width':2,'stroke-opacity':1});
		
		// peak values
		if( document.getElementById('showpeak').checked == true ) {
			coords.plotObject('path',{'d':'M '+peakx+' '+(peaky+dy)+' v '+(-2*dy),'append':curve},{'stroke':'black','stroke-width':3,'stroke-opacity':0.5});
			if( peaky > 0.02*coords.yMax ) {
				let curveid = id.substring(id.length-1);
				let peaktext = k > 1 ? '\u03bb_'+curveid+'_='+toHTML(peakx,5)+'nm' : '\u03bb='+toHTML(peakx,5)+'nm' ;
				coords.plotText(peaktext,{'x':peakx,'y':peaky,'du':4,'dv':-20,'append':curve},{'text-anchor':'start','font-size':'1.5rem','font-family':'Chivo'});
			}
		}
	}
}

function toggleCurves(spanid) {
	let inputs, inputTemp = 0;
	let bbspan = document.getElementById(spanid);
	let plotid = bbspan.getElementsByClassName('plotid')[0].value;
	let plot = document.getElementById(plotid);
	if( plot == undefined ) { 
		bbspan.getElementsByClassName('active')[0].value = 'true';
		bbspan.getElementsByClassName('area')[0].style.visibility = 'visible';		
		drawbbCurves(bbspan.getElementsByClassName('temp')[0].value); return; }
	if( plot != undefined ) {
		plot.remove();
		bbspan.getElementsByClassName('active')[0].value = 'false';
		bbspan.getElementsByClassName('area')[0].style.visibility = 'hidden';
		bbspan.style.border = '1px solid black';
		bbspan.style.background = 'white';
	}
}

function slideCurves(id) { 
	let inputTemp = 0;
	let bbspan = document.getElementById(id).parentNode.parentNode;
	let curveLabel = (bbspan.id).substring(bbspan.id.length-1);
	let bbrange = document.getElementById(id); 
	let plotid = bbspan.getElementsByClassName('plotid')[0].value; 
	let plot = document.getElementById(plotid);
	bbspan.getElementsByClassName('spanText')[0].innerHTML = 'T<sub>'+curveLabel+'</sub>='+bbrange.value+' K';
	bbspan.getElementsByClassName('temp')[0].value = bbrange.value;	
	
	if( plot != undefined ) { plot.remove(); }
		bbspan.getElementsByClassName('active')[0].value = 'true';
		//bbspan.getElementsByClassName('area')[0].style.display = 'block';		
		drawbbCurves(bbspan.getElementsByClassName('temp')[0].value); 
}

let testT;
function toggleCurves2(id) {
	testT = document.getElementById(id).getElementsByClassName('form-range')[0].value;
}
function toggleCurves3(id) {
	let testT2 = document.getElementById(id).getElementsByClassName('form-range')[0].value;
	if( testT == testT2 ) { toggleCurves(id);	}
}