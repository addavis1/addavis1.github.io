window.onresize = function(){ init(); location.reload(); }

function init() {
  let container = document.getElementById('canvas').parentNode;
  let container_size = container.getBoundingClientRect();
  let c = document.getElementById('canvas');
  let ctx = c.getContext('2d');
 
  c.width = container_size.width;
  c.height = container_size.height;
 
  // slit the canvas into 11 partitions where each partition is 100ly
  let dx = c.width/12;
  let x0 = dx;
  
    // add the star
  let img = new Image(); // raw image is 98x84 pixels
  let img_size = c.height*0.15;  
  let x = x0-0.5*img_size;
  let y = c.height*0.5-0.5*img_size;
  img.onload = function() { ctx.drawImage(img, x, y,img_size,img_size); }
  img.src = 'images/star.png';
  
  // add the observer
  let img2 = new Image(); // ram image is 369x633 pixels
  let img2_h = c.height*0.6;
  let img2_w = img2_h*369/633;
  let x2 = x0+3*dx-0.5*img2_w;
  let y2 = c.height*0.05;
  img2.onload = function() { ctx.drawImage(img2, x2, y2,img2_w,img2_h); }
  img2.src = 'images/lookback1.png';
  
  // add the distance indicator
  // for convenience, these variables will be dynamic
  let lx1 = x0;
  let ly1 = c.height*0.75;
  let lx2 = x2+img2_w*0.5;
  let ly2 = ly1;
  let dl = c.height*0.02;
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx1,ly1);
  ctx.lineTo(lx2,ly2);
  ctx.moveTo(lx1,ly1-dl);
  ctx.lineTo(lx1,ly1+dl);
  ctx.moveTo(lx2,ly2-dl);
  ctx.lineTo(lx2,ly2+dl);  
  ctx.stroke();
  
  // now distance indicator text
  ctx.font = 'bold '+0.1*c.height+'px Calibri';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  let txt = '3000 ly';
  ctx.fillText(txt, (lx1+lx2)/2,ly1+dl+0.1*c.height); 
  
  
}

function goSupernova(id) {
	let button1 = document.getElementById('button1');
	let button2 = document.getElementById('button2');
	
	if(button1.value == 0 && id == 'button1' ) {
		positionTag();
		button1.value = 1;		
		button1.disabled = true;
		button1.innerHTML = 'reset';
				
		button2.innerHTML = 'pause';
		button2.value = 1;
		button2.disabled = false;
		
		document.getElementById('sn_occurs').style.display='hidden';
	} else if ( button2.value == 1 && id == 'button2' ) {
		button1.value = 1;
		button1.disabled = false;
		
		button2.value = 2;
		button2.innerHTML = 'resume';		
	} else if ( button1.value == 1 && id == 'button1' ) {
		button1.value = 0;
		button1.disabled = false;
		button1.innerHTML = 'go supernova';
		
		button2.innerHTML = '&hellip;'
		button2.disabled = true;
		button2.value = 0;
		document.getElementById('sn_occurs').style.display='none';		
	} else if ( button2.value == 2 && id == 'button2' ) {
		button1.value = 1;		
		button1.disabled = true;
		button1.innerHTML = 'reset';
				
		button2.innerHTML = 'pause';
		button2.value = 1;
		button2.disabled = false;		
	}
}

function positionTag() {
	let slider_container = document.getElementById('slider_container');
	let slider = document.getElementById('slider');
	let sn_occurs = document.getElementById('sn_occurs');
	sn_occurs.style.display='block';
	
	sc_w = slider_container.getBoundingClientRect().width;
	s_w = slider.getBoundingClientRect().width;
	sn_w = sn_occurs.getBoundingClientRect().width;	
	
	sn_occurs.style.top =  (-0.5*sn_occurs.getBoundingClientRect().height+2)+'px';
	let dx = (sc_w-s_w)/2;
	
	let year = convertYear(document.getElementById('sn_year').innerHTML,0);
	let x = (year+8000)/18000*s_w;
	
	sn_occurs.style.left = (-sn_w/2+dx+x)+'px';
}

function moveSlider(val) {
	let year = convertYear(val,true);
	document.getElementById('sn_year').innerHTML = year;
}

function convertYear(val,opt) {
	let year;
	if( opt == undefined || opt == false ) { /* convert text to number */
			let n = val.length;
			year = val.substring(0,n-3);
			year *= val.substring(n-2,n) == 'BC' ? -1 : 1;
	} else {
		if( val == 0 ) { year = '1 AD'; }
		else if( val < 0 ) { year = Math.abs(val)+' BC'; }
		else { year = val + ' AD'; }
	}
	return year;
}