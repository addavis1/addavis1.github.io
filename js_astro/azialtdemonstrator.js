// question 
// media fix question from portrait to landscape
// check that question drag handler is removed for iphone
// update documentation on question window

// global variables
let container;
let camera;
let control;
let renderer;
let scene;
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
var star;
let onClickPosition = new THREE.Vector2();
let textObjects = new Array();
let starmovable = true;
let current_div;
let box_question = document.getElementById('box_question');
let submit_id;
let submit_id_old;

  
  /* DEFINE object with the parameters */
let options = new Object({ r:10, rr:9.925, });

function init() {
 
  /* INITIALIZE THE THREE.JS */
  // CONTAINER for the CANVAS object
  container = document.querySelector( '#container_scene' );
  
  // SCENE
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );

  createCamera(); 
  createControls(); 
  createLights();
  createMeshes();
  createRenderer();
  toggleElement();
  
  dragElement('box_question');
  dragElement('box_response');

  // start the animation loop
  window.requestAnimationFrame(render);
  renderer.setAnimationLoop( () => { update(); render(); } );
  
  let azi = document.getElementById('azi_value').value;
  let alt = document.getElementById('alt_value').value;
  moveStar({azi:azi,alt:alt});
    // END THREE.jS initialize
    
  // behavior, if the ?q tag is present, it should start and stay in question mode unless specifically exited (and that'll clear the url)
  // the questions will move the # tag, however, with just the hash tag, it will load into normal mode
  
  // test for question mode with the 
  let $_GET = readURL();
  if( $_GET['q'] ) { toggleQuestionMode(1); }  
  
 
  if( $_GET['file'] ) { 
    let $file = $_GET["file"].concat(".html");
    loadXMLDoc($file,"qtext");    
  }
  else { loadXMLDoc("azialtquestions.html","qtext"); }
  
  
} // END INIT():

function toggleMenu(id,opt) { document.getElementById(id).style.display = document.getElementById(id).style.display == 'block' ? 'none' : 'block'; }

function readURL() { // produce a $_GET array much as PHP does
	var $_GET = new Object();
	var $qry_str = location.search.substr(1);

	var $i = 0; var $j = $qry_str.indexOf('&',$i);
	var $qry_sub;
	while( $j != -1 ) {
	  $sub = $qry_str.substring($i,$j);
    $i = $j+1; $j = $qry_str.indexOf('&',$i);
    $k = $sub.indexOf("=");
    if( $k != -1 ) { $_GET[$sub.substring(0,$k)] = $sub.substring($k+1); }
    else { $_GET[$sub] = true };
  }
	$sub = $qry_str.substring($i);
	$k = $sub.indexOf("=");
	if( $k != -1 ) { $_GET[$sub.substring(0,$k)] = $sub.substring($k+1); }
  else { $_GET[$sub] = true };

	//for(key in $_GET) { a_lert([key,$_GET[key]]); }
	return($_GET);
}

function loadXMLDoc(file_name,id) {
var xmlhttp = new XMLHttpRequest();  
xmlhttp.onreadystatechange=function() {
  if (xmlhttp.readyState==4 && xmlhttp.status==200) { document.getElementById(id).innerHTML=xmlhttp.responseText; }
}
xmlhttp.open("GET",file_name,false);
xmlhttp.send();
}
/////////////////////////////////////
// ASTRONOMY CALCULATION FUNCTIONS //
/////////////////////////////////////

function convertCoords(param) { 
  // +x:E , +z:S , +y:N
  let x,y,z,xz,alt,azi,q1,q2,r;
  r = param.r != undefined ? param.r : options.r;

  if ( param.alt != undefined ) { // altitude and azimuth to sphere coords
    azi = param.azi, alt = param.alt;
    q1 = azi*Math.PI/180; q2 = alt*Math.PI/180;
    x = r*Math.sin(q1)*Math.cos(q2);
    y = r*Math.sin(q2);
    z = -r*Math.cos(q1)*Math.cos(q2);
    return([x,y,z]);      
  } else if ( param.x != undefined ) { // sphere coords to altitude and azimuth
    x = param.x, y = param.y, z = param.z;  
    xz = Math.sqrt(x*x+z*z);    
    alt = Math.atan(y/xz)*180/Math.PI;
    if( z < 0 && x >= 0 ) { azi = Math.atan( Math.abs(x/z) )*180/Math.PI; }
    else if ( z >= 0 && x >= 0 ) { azi = 180-Math.atan( Math.abs(x/z) )*180/Math.PI; }
    else if ( z >= 0 && x < 0 ) { azi = 180+Math.atan( Math.abs(x/z) )*180/Math.PI; }
    else if ( z < 0 && x < 0 ) { azi = 360-Math.atan( Math.abs(x/z) )*180/Math.PI; }
    r = Math.sqrt( x*x+y*y+z*z );
    return([azi,alt,r]);  
  }
}

function moveStar(param) {
  let alt,azi,x,y,z;
  
  // if they are present need to remove and then redraw
  let objects = ['azimuth line','azimuth line2','altitude line','altitude line2','coordsTextAzi','coordsTextAlt'];
  for ( let i = 0; i < objects.length; i++ ) {
    if( scene.getObjectByName(objects[i]) != undefined ) { scene.remove(scene.getObjectByName(objects[i])); }
  }
  
  let button_toggle = document.getElementById('button_toggle');
  
  /* CREATES A MEMORY LEAK, so removed
  if( button_toggle.value == 0 && starmovable == false ) {
    scene.remove(scene.getObjectByName('star'));
    createStarMesh({'extrudeColor':0x000000});
  } else {
    scene.remove(scene.getObjectByName('star'));
    createStarMesh({'extrudeColor':0x515333});  
  }
  */
  

  // get parameters either is as cartesian or celestial
  if( param != undefined ) { 
    if ( param.x != undefined ) {
      x = param.x;
      y = param.y;
      z = param.z;        
    } else if( param.alt != undefined || param.azi != undefined ) {
      alt = param.alt != undefined ? param.alt : star.alt;
      azi = param.azi != undefined ? param.azi : star.azi;
      [x,y,z] = convertCoords({azi:azi,alt:alt});    
    } else {
      alt = 180;
      azi = 0;
      [x,y,z] = convertCoords({azi:azi,alt:alt});    
    }
  }
 
  // move star
  let startVector = new THREE.Vector3;
  startVector.x = star.position.x;
  startVector.y = star.position.y;
  startVector.z = star.position.z;
  startVector.normalize();
  startVector.multiplyScalar(options.rr);
  
  let endVector = new THREE.Vector3;  
  endVector.x = x;
  endVector.y = y;
  endVector.z = z;
  endVector.normalize();
  endVector.multiplyScalar(options.rr);

  star.position.set(endVector.x,endVector.y,endVector.z);
  [star.azi,star.alt] = convertCoords({x:endVector.x,y:endVector.y,z:endVector.z});
  
  // rotate star so the plane of the star is flat
  let q = new THREE.Quaternion;
  q.setFromUnitVectors(startVector.normalize(), endVector.normalize());
  star.applyQuaternion(q);

  addAziAltLines();
}

function addAziAltLines() {
  // check for the question options
  let q_list, opt_input, azi_opt = 0, alt_opt = 0; // default values;
  if( document.getElementById('q_list') != null ) {    
    q_list = document.getElementById('q_list').children;
    let q_num = ( location.hash == "" || location.hash == undefined ) ? 1 : (location.hash).substring(1,3);
    let current_div = q_list.item(q_num-1);
    opt_input = current_div.getElementsByClassName('options').item(0);
    if( opt_input != null ) {  
      let opt = JSON.parse(opt_input.value);
      azi_opt = opt.azi;
      alt_opt = opt.alt;    
    }
  }
  let q_mode = document.getElementById('button_toggle').value; // q_mode = 0 == question mode
  
  // ALTITUDE AND AZIMUTH LINES
  const q_azi = star.azi == 0 ? 1E-9 : star.azi*Math.PI/180;
  const geometry_azi = new THREE.TorusBufferGeometry( options.r, 0.05, 8, 100, q_azi );
  const material_azi = new THREE.MeshBasicMaterial( { color: 0x000088,transparent:true,opacity:0.75 } );
  const torus_azi = new THREE.Mesh( geometry_azi, material_azi );   
  // torus is drawn the xy plane -- need to rotate it (order matters!)
  torus_azi.rotateX(Math.PI/2);
  torus_azi.rotateZ(-Math.PI/2);
  if( azi_opt == 1 || azi_opt == 2 || q_mode == 1 ) { scene.add( torus_azi ); }
  torus_azi.name = 'azimuth line';
  
  const geometry_azi2 = new THREE.TorusBufferGeometry( options.r, 0.04, 8, 100 );
  const material_azi2 = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.25 } );
  const torus_azi2 = new THREE.Mesh( geometry_azi2, material_azi2 );
  torus_azi2.rotateY(Math.PI/2-q_azi);
  scene.add( torus_azi2 );
  torus_azi2.name = 'azimuth line2';  

  // ALTITUDE AND AZIMUTH LINES    
  const q_alt = star.alt == 0 ? 1E-9 : star.alt*Math.PI/180;
  const geometry_alt = new THREE.TorusBufferGeometry( options.r, 0.05, 8, 100, q_alt );
  const material_alt = new THREE.MeshBasicMaterial( { color: 0x880000} );
  const torus_alt = new THREE.Mesh( geometry_alt, material_alt );   
  // torus is drawn the xy plane -- need to rotate it (order matters!)
  torus_alt.rotateY(Math.PI/2-q_azi);
  if( alt_opt == 1 || alt_opt == 2 || q_mode == 1 ) { scene.add( torus_alt ); }
  torus_alt.name = 'altitude line';
  
  const geometry_alt2 = new THREE.TorusBufferGeometry( options.r*Math.cos(q_alt), 0.04, 8, 100 );
  const material_alt2 = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.25 } );
  const torus_alt2 = new THREE.Mesh( geometry_alt2, material_alt2 );
  torus_alt2.rotateX(Math.PI/2);
  torus_alt2.translateZ(-options.r*Math.sin(q_alt));
  scene.add( torus_alt2 );
  torus_alt2.name = 'altitude line2';  
  
  // Add COORDINATE TEXT
  if( azi_opt == 2 || q_mode == 1 ) { createCoordsText('azi'); }
  if( alt_opt == 2 || q_mode == 1 ) { createCoordsText('alt'); }
    
  // CHANGE TEXT BOXES
  document.getElementById('aziBox').value = (star.azi).toFixed(1);
  document.getElementById('altBox').value = (star.alt).toFixed(1);
  /* document.getElementById('aziSlider').value = (star.azi).toFixed(1);
  document.getElementById('altSlider').value = (star.alt).toFixed(1); */
  document.getElementById('azi_value').value = (star.azi).toFixed(1);
  document.getElementById('alt_value').value = (star.alt).toFixed(1);
  
} // end scene.getObjectByName('coordsTextAlt') == undefined check   
  

function toggleElement(id,opt) {
  let label_array= ['Zenith_label','Nadir_label','Horizon Plane_label','Meridian_label'];
  let id_array = ['zenithCheckbox','nadirCheckbox','horizonCheckbox','meridianCheckbox'];

  if( id == 'all' || id == 'none' ) {
    for( let i = 0; i < label_array.length; i++ ) {
      scene.getObjectByName(label_array[i]).visible = id == 'all' ? true : false;
      document.getElementById(id_array[i]).checked = id == 'all' ? true : false;
    }
  } else {
    if( opt == 1 ) {
      let menu_item = document.getElementById(id);
      menu_item.checked = !(menu_item.checked);    
    }
    
    for( let i = 0; i < label_array.length; i++ ) {
      scene.getObjectByName(label_array[i]).visible = document.getElementById(id_array[i]).checked;
    } 
  }
}



/////////////////////////
// GEOMETRIES AND TEXT //
///////////////////////// 

function createMeshes() {
  // MESHES
  let r = options.r, radius = options.r;
  
  // cube
  /*
  let cs = 0.5;
  const cubeGeometry = new THREE.BoxBufferGeometry( cs,cs,cs );
  //const material = new THREE.MeshStandardMaterial( { color: 0x800080 } );  
  let cubeMaterialArray = []; // order to add materials: x+,x-,y+,y-,z+,z-	
	cubeMaterialArray.push( new THREE.MeshStandardMaterial( { color: 0xff3333 } ) );
	cubeMaterialArray.push( new THREE.MeshStandardMaterial( { color: 0xff8800 } ) );
	cubeMaterialArray.push( new THREE.MeshStandardMaterial( { color: 0xffff33 } ) );
	cubeMaterialArray.push( new THREE.MeshStandardMaterial( { color: 0x33ff33 } ) );
	cubeMaterialArray.push( new THREE.MeshStandardMaterial( { color: 0x3333ff } ) );
	cubeMaterialArray.push( new THREE.MeshStandardMaterial( { color: 0x8833ff } ) );
  
  let cube = new THREE.Mesh( cubeGeometry, cubeMaterialArray );
  cube.name = 'cube';
  //cube.translateX(-1);
  //cube.translateY(0.25);
  cube.position.set(0, 0, 0);
  //scene.add( cube );
  */ 
    
  // CELESTIAL SPHERE  
	let sphereGeometry = new THREE.SphereGeometry( options.r, 32, 32 );	
	let sphereMaterial = new THREE.MeshLambertMaterial( {color: 0x000000, transparent: true, opacity: 0.1, reflectivity: 0 }); 
	let celSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	celSphere.position.set( 0, 0, 0 );
	scene.add( celSphere );
  celSphere.name = 'celestial sphere';
  celSphere.renderOrder = 1; // three.js handles transperency in a funny way for computational reasons ... this seems to help

  // GROUND  
  let groundGeometry = new THREE.CylinderBufferGeometry( options.r, options.r, 0.03, 32 );
  let groundMeshMaterial_param = { color: 0x006600,transparent:true,opacity:1, reflectivity: 0 }; 
  let groundMeshMaterial_param2 = { color: 0x002200,transparent:true,opacity:1, reflectivity: 0 };
  	
  let groundMaterialArray = [];  // order to add materials: side, top, bottom   // BasicMaterial is the non-shiny version
	groundMaterialArray.push( new THREE.MeshBasicMaterial( groundMeshMaterial_param ) );
	groundMaterialArray.push( new THREE.MeshBasicMaterial( groundMeshMaterial_param ) );
	groundMaterialArray.push( new THREE.MeshBasicMaterial( groundMeshMaterial_param2 ) );
  //let groundMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ); 
  let ground = new THREE.Mesh( groundGeometry, groundMaterialArray );
  ground.name = 'horizon';
  scene.add(ground);  
  
  // HORIZON PERSON
  let person = new THREE.Group();
  let personMaterial = new THREE.MeshBasicMaterial( { color:'black' } );
  let personMaterial2 = new THREE.MeshBasicMaterial( { color:'white' } );
  let yVec = new THREE.Vector3(0,1,0);
  let xVec = new THREE.Vector3(1,0,0);
  let zVec = new THREE.Vector3(0,0,1);
  
  // body
  let bodyGeo = new THREE.CylinderBufferGeometry( 0.08, 0.1, 0.9, 32 );  
  let body = new THREE.Mesh( bodyGeo, personMaterial );
  
  // left leg
  let q1 = 15*Math.PI/180;
  let llegGeo = new THREE.CylinderBufferGeometry( 0.1,0.08,1,32 );
  let lleg = new THREE.Mesh( llegGeo, personMaterial );
  lleg.rotateZ(-q1);
  lleg.translateOnAxis(yVec,-0.8);
  lleg.translateOnAxis(xVec,0.055);
  
  // right leg
  let rlegGeo = new THREE.CylinderBufferGeometry( 0.1,0.08,1,32 );
  let rleg = new THREE.Mesh( rlegGeo, personMaterial );
  rleg.rotateZ(q1);
  rleg.translateOnAxis(yVec,-0.8);
  rleg.translateOnAxis(xVec,-0.055);
    
    // left arm
  let q2 = 65*Math.PI/180;
  let larmGeo = new THREE.CylinderBufferGeometry( 0.09,0.07,0.6,32 );
  let larm = new THREE.Mesh( larmGeo, personMaterial );
  larm.rotateZ(-q2);
  larm.translateOnAxis(xVec,-0.22);
  larm.translateOnAxis(yVec,-0.23);
  
  // right arm
  let rarmGeo = new THREE.CylinderBufferGeometry( 0.09,0.07,.5,32 );
  let rarm = new THREE.Mesh( rarmGeo, personMaterial );
  rarm.rotateZ(q2);
  rarm.translateOnAxis(xVec,0.22);
  rarm.translateOnAxis(yVec,-0.18);
  
  // head (2 parts )
  let headGeo1 = new THREE.TorusBufferGeometry( 0.225, 0.08, 32, 50 );
  let head1 = new THREE.Mesh( headGeo1, personMaterial );
  head1.translateOnAxis(yVec,0.65);
  
    // head (2 parts )
  let headGeo2 = new THREE.CylinderBufferGeometry( 0.225, 0.225, .03, 32 );
  let head2 = new THREE.Mesh( headGeo2, personMaterial2 );
  head2.rotateX(Math.PI/2);
  head2.translateOnAxis(zVec,-0.65);
  
  person.add( body );
  person.add( lleg );
  person.add( rleg );
  person.add( larm );
  person.add( rarm );
  person.add( head1 );
  person.add( head2 );
  person.translateY(1.38);
  scene.add( person );
  person.name = 'person'; 
  
  // MERIDIAN and EW CIRCLE
  let geometry_mer = new THREE.TorusBufferGeometry( options.r, 0.04, 16, 100 );
  let material_mer = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.5 } );
  let torus_mer = new THREE.Mesh( geometry_mer, material_mer );   
  torus_mer.rotateY(Math.PI/2);  
  scene.add( torus_mer );
  torus_mer.name = 'meridian';
  
  // MERIDIAN and EW CIRCLE
  let geometry_mer2 = new THREE.TorusBufferGeometry( options.r, 0.04, 16, 100 );
  let material_mer2 = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.15 } );
  let torus_mer2 = new THREE.Mesh( geometry_mer2, material_mer2 );   
  // torus is drawn the xy plane -- no need to rotate this time
  scene.add( torus_mer2 );
  torus_mer2.name = 'meridian2';
  
  // POLES
  let pole_Zenith = new THREE.Group();
  
  let poleMaterial = new THREE.MeshBasicMaterial( { color:'black',transparent:true,opacity:0.5,side: THREE.DoubleSide } );
  let poleGeometry = new THREE.CylinderBufferGeometry( 0.04, 0.04, 1.5, 32  );  
  let poleZenith = new THREE.Mesh( poleGeometry, poleMaterial );
  poleZenith.translateY(0.75);
  
  let poleGeometry2 = new THREE.CircleBufferGeometry( 0.25, 32 );  
  let poleCircle = new THREE.Mesh( poleGeometry2, poleMaterial );
  poleCircle.rotateX(Math.PI/2);
  
  pole_Zenith.add(poleZenith);
  pole_Zenith.add(poleCircle);
  pole_Zenith.name = 'zenith';
  
  pole_Zenith.translateY(options.r+0.05);
  scene.add( pole_Zenith );
  
  let pole_Nadir = new THREE.Group();
  let poleNadir = new THREE.Mesh( poleGeometry, poleMaterial );
  poleNadir.translateY(-0.75);
  
  let poleCircle2 = new THREE.Mesh( poleGeometry2, poleMaterial );
  poleCircle2.rotateX(Math.PI/2);
  
  pole_Nadir.add(poleNadir);
  pole_Nadir.add(poleCircle2);
  
  pole_Nadir.translateY(-options.r-0.05);
  scene.add( pole_Nadir );
  pole_Nadir.name = 'nadir';
 
  // CREATE STAR
  createStarMesh();
  
  // CREATE SPHERE TEXT
  createSphereText();
}

function createStarMesh (opt) {
  if (opt == undefined) { var opt = {}; }
  opt.extrudeColor = opt.extrudeColor == undefined || starmovable == true ? 0x515333 : opt.extrudeColor;
  
  
  // STAR  
  let R1 = 0.6;
  let R2 = R1*Math.sin(18*Math.PI/180)/Math.sin(52*Math.PI/180);
  let x1,y1,R;
  let star1Shape = new THREE.Shape();
  star1Shape.moveTo(0,R1);
  for( let i = 1; i < 12; i++ ) {
    let q = i*36*Math.PI/180;
    R = i%2 == 1 ? R2 : R1;    
    star1Shape.lineTo( R*Math.sin(q),R*Math.cos(q) );
  }   
  let extrudeSettings = { steps: 1, depth: 0.15, bevelEnabled: false }
  let starMeshBasic_param = { color: 0xFDFD33 };
  let starMeshBasic_param2 = { color: opt.extrudeColor };  
  //let starMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00,side: THREE.DoubleSide } );
  //let starGeometry = new THREE.ShapeGeometry( starShape );
  let starMaterialArray = [];  // order to add materials: side, top, bottom
	starMaterialArray.push( new THREE.MeshBasicMaterial( starMeshBasic_param ) );
	starMaterialArray.push( new THREE.MeshBasicMaterial( starMeshBasic_param2 ) );
	starMaterialArray.push( new THREE.MeshBasicMaterial( starMeshBasic_param ) );
  let starGeometry = new THREE.ExtrudeBufferGeometry( star1Shape, extrudeSettings );
  star1 = new THREE.Mesh( starGeometry, starMaterialArray );
  star1.name = 'star1'; 
  
  let R3 = 0.6*0.75;
  let R4 = R3*Math.sin(18*Math.PI/180)/Math.sin(52*Math.PI/180);
  let star2Shape = new THREE.Shape();
  star2Shape.moveTo(0,R3);
  for( let i = 1; i < 12; i++ ) {
    let q = i*36*Math.PI/180;
    R = i%2 == 1 ? R4 : R3;    
    star2Shape.lineTo( R*Math.sin(q),R*Math.cos(q) );
  }
  let star2Geometry = new THREE.ExtrudeBufferGeometry( star2Shape, extrudeSettings );
  star2 = new THREE.Mesh( star2Geometry, starMaterialArray );   
  
  /* let star2 = star1.clone();
  let scale = 0.75;
  star2.scale.set(scale,scale,scale);  */
  star2.rotateZ(36*Math.PI/180);
  star2.name = 'star2';
 
  star = new THREE.Group();
  star.add(star1);
  star.add(star2);
  scene.add(star);

  //star.renderOrder = 1;
  star.name = 'star';
  star.position.set(0,0,options.rr);
  [star.azi,star.alt] = convertCoords({x:0,y:0,z:options.rr});
}

function createSphereText() {
  // cardinal directions
  createHorizonText('N');
  createHorizonText('E');
  createHorizonText('S');
  createHorizonText('W');

  createLabelText('Zenith',[0,90],{'q':30,'dt':2.5});
  createLabelText('Nadir',[0,-90],{'q':-30,'dt':2.5});
  createLabelText('Meridian',[180,50],{'q':60,'dt':2});
  createLabelText('Horizon Plane',[250,0],{'q':30,'dt':6});
}

function createLabelText(txt,[azi,alt],param) {
    // txt is the text to display
    // azi,alt is the coordinate of the text
    // q is the rotation about the z-axis
    // dr is the extra space between sphere and line
    // dt is the extra space between line and text
    
    if ( param == undefined ) { var param = {}; }
    let dr = param['dr'] == undefined ? 0.25 : param['dr'];
    let r = param['r'] == undefined ? 2 : param['r'];
    let dt = param['dt'] == undefined ? 3: param['dt'];
    let q = param['q'] == undefined ? q : param['q'];
 
  let sprite = new THREE.TextSprite({
    fillStyle: 'rgba(0,0,0,1)',
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 0.8,
    fontStyle: 'normal',
    text: txt
  });
  
  let x,y,z,radius;
  radius = options.rr;
  [x,y,z] = convertCoords({alt:alt,azi:azi,r:r});
  
    // add label text line  
  let lineMaterial = new THREE.MeshBasicMaterial( { color:'black',transparent:true,opacity:0.5,side: THREE.DoubleSide } );
  let lineGeometry = new THREE.CylinderBufferGeometry( 0.04, 0.04,r, 32  ); // radius 1,radius 2, height, radial segments 
  let line = new THREE.Mesh( lineGeometry, lineMaterial );
  
  line.translateY(r/2+dr);
  line.translateX(-(r/2+dr)*Math.sin(q*Math.PI/180));
  line.rotateZ(q*Math.PI/180);
  
  sprite.translateY(r+dt*dr);
  sprite.translateX(-(r+dt*dr)*Math.sin(q*Math.PI/180));
  
  let textGroup = new THREE.Group();
  textGroup.add(sprite);
  textGroup.add(line);

   // move start
  let startVector = new THREE.Vector3;
  startVector.x = 0;
  startVector.y = 1;
  startVector.z = 0;
  startVector.normalize();
  startVector.multiplyScalar(radius);
  
  let endVector = new THREE.Vector3;  
  endVector.x = x;
  endVector.y = y;
  endVector.z = z;
  endVector.normalize();
  endVector.multiplyScalar(radius);

  textGroup.position.set(endVector.x,endVector.y,endVector.z);  
  
  // rotate star so the plane of the star is flat
  let qn = new THREE.Quaternion;
  qn.setFromUnitVectors(startVector.normalize(), endVector.normalize());
  textGroup.applyQuaternion(qn); 

  scene.add(textGroup);
  textGroup.name = txt+'_label';  
  
}

function createHorizonText(txt) {
  let loader = new THREE.FontLoader(); 
  let font = loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) { 
 	  let textGeometry = new THREE.TextGeometry(txt, {
		  font: font,
		  size: 1.25,
	    height: 0.05 // thickness
	  });  

    let textMaterial = new THREE.MeshBasicMaterial({
      color: 'white',
      wireframe: false,
      //opacity: 0.4,
      transparent: false
    });
 
    let textMesh = new THREE.Mesh( textGeometry, textMaterial );
    textMesh.name = 'horizon text '+txt;
    scene.add(textMesh);    
      
    let bbox = new THREE.Box3().setFromObject(textMesh);
    let dX = -0.5*(bbox.max.x-bbox.min.x);
    let dY = -0.5*(bbox.max.y-bbox.min.y);
    let dZ = -0.5*(bbox.max.z-bbox.min.z); 
        
    // rotate first
    textMesh.rotateX(-Math.PI/2);
    
    textMesh.translateX(dX);    
    textMesh.translateY(dY);
    textMesh.translateZ(dZ);
    
    let delta = 8.5;   
    if( txt === 'N' ) { textMesh.translateY(delta); }
    if( txt === 'E' ) { textMesh.translateX(delta); }
    if( txt === 'S' ) { textMesh.translateY(-delta); }
    if( txt === 'W' ) { textMesh.translateX(-delta); }
                
  } );
}


function createCoordsText(opt) {
  let color_alt = '#880000';
  let color_azi = '#000088';
  
  if( opt == undefined ) { let opt = 'alt'; }
    
  if( opt == 'azi' ) {
    var color = color_azi;
    var txt = (star.azi).toFixed(1)+'\u00b0';
    var q_azi = star.azi*Math.PI/180-Math.PI/2;
    var q2_azi = q_azi-0*Math.PI/180;
    var textAxis = new THREE.Vector3(-Math.cos(q2_azi),-2.0*Math.PI/180,-Math.sin(q2_azi));
    textAxis.normalize();   
  } else if( opt == 'alt' ) {
    var color = color_alt;
    var txt = (star.alt).toFixed(1)+'\u00b0';
    var q_alt = star.alt*Math.PI/180;
    var q2_alt = q_alt/2;                   
    var q_azi = star.azi*Math.PI/180-Math.PI/2;
    // NEED to change how the text axis is calculated
    var q2_azi = q_azi+15*Math.PI/180;
    var textAxis = new THREE.Vector3(-Math.cos(q2_azi),-q2_alt,-Math.sin(q2_azi));
    textAxis.normalize();   
  } 

  let loader = new THREE.FontLoader(); 
  let font = loader.load( 'fonts/helvetiker_bold.typeface.json', function ( font ) {
 	  let textGeometry = new THREE.TextGeometry(txt, {
		  font: font,
		  size: 0.75,
	    height: 0.05 // thickness
	  });  
    let textMaterial = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: false,
      //opacity: 0.4,
      transparent: false
    });
 
    let textMesh = new THREE.Mesh( textGeometry, textMaterial );

    let bbox = new THREE.Box3().setFromObject(textMesh);
    let dX = 0.5*(bbox.max.x-bbox.min.x);
    let dY = 0.5*(bbox.max.y-bbox.min.y);
    let dZ = 0.5*(bbox.max.z-bbox.min.z);

    if( opt == 'azi' ) {
      textMesh.translateX(dX/2);    
      textMesh.translateY(dY);
      textMesh.translateZ(dZ);
    } else if ( opt == 'alt' ) {
      textMesh.translateX(-dX/2);    
      textMesh.translateY(0);
      textMesh.translateZ(dZ);
    }    
    
    var helper = new THREE.Box3Helper( bbox, 0xff0000 );
    var coordGroup = new THREE.Group();
    //coordGroup.add(helper);
    coordGroup.add(textMesh);   
    
    if( opt == 'azi' ) {
      coordGroup.translateOnAxis(textAxis,-options.r);
      coordGroup.rotateY(Math.PI/2-q2_azi+5*Math.PI/180);
      coordGroup.rotateX(-5*Math.PI/180);    
      coordGroup.name = 'coordsTextAzi';
     } else if( opt == 'alt' ) {
      coordGroup.translateOnAxis(textAxis,-options.r);
      coordGroup.rotateY(Math.PI/2-q2_azi+5*Math.PI/180);
      coordGroup.rotateX(-q_alt/2);    
      coordGroup.name = 'coordsTextAlt';
     }      
     scene.add(coordGroup);       
  } );
}  
  
 



/////////////////////////////
// CAMERA, LIGHT, RENDERER //
/////////////////////////////


// perform any updates to the scene, called once per frame
// avoid heavy computation here
function update() { /* Don't delete this function! */ }
function render() { renderer.render( scene, camera ); }

function createCamera() {
  // CAMERA
  const fov = 35;
  const aspect = container.clientWidth / container.clientHeight;
  const near = 0.1;
  const far = 100;
  camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
  let x,y,z;
  [x,y,z] = convertCoords({'azi':170,'alt':20,'r':60});
  camera.position.set( x,y,z );
  camera.lookAt(0,0,0 ); // default, can omit unless changed
}

function createLights() {

  const ambientLight = new THREE.HemisphereLight(
    0xddeeff, // sky color
    0x202020, // ground color
    1 // intensity
  ); 
  const mainLight = new THREE.DirectionalLight( 0xffffff, 5 );
  mainLight.position.set( 30, 30, 30 );
  ambientLight.name = 'ambient light';
  mainLight.name = 'main light';

  scene.add( ambientLight, mainLight );
}



function createRenderer() {
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( container.clientWidth, container.clientHeight );
  //renderer.setSize( window.innerWidth, window.innerHeight );
  
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.physicallyCorrectLights = true;                                        
  container.appendChild( renderer.domElement ); 
  
  renderer.domElement.addEventListener("pointerdown", onpointerDown, true);
}

///////////////////////
// CONTROL FUNCTIONS //
///////////////////////


// the mouse drag when not on the star
function createControls() { 
  controls = new THREE.OrbitControls( camera, container ); 
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minDistance = 30;
  controls.maxDistance = 80;
  //controls.addEventListener( 'change', () => renderer.render( scene, camera ) );
}


// a function that will be called every time the window gets resized. It can get called a lot, so don't put any heavy computation in here!
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(opt){
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( container.clientWidth, container.clientHeight );
 
  // check if question box is outside of the view 
  let rect = box_question.getBoundingClientRect();
  if( rect.left > window.innerWidth ) { box_question.style.left = (window.innerWidth - (rect.right-rect.left)-10)+'px'; }
  if( rect.top > window.innerHeight ) { box_question.style.top = (window.innerHeight - (rect.bottom-rect.top)-10)+'px'; } 
 
}

function onpointerDown( event ) {
	pointer.x = ( (event.clientX - container.offsetLeft + window.scrollX) / container.clientWidth ) * 2 - 1; // works with 
	pointer.y = - ( (event.clientY - container.offsetTop + window.scrollY) / container.clientHeight ) * 2 + 1;
  pointer_start = [pointer.x,pointer.y];
  
  	// update the picking ray with the camera and pointer position                                               
	raycaster.setFromCamera( pointer, camera );
  let intersects = raycaster.intersectObjects( scene.children, true );
  
  for ( let i = 0; i < intersects.length; i++ ) { 
    if( (intersects[i].object.name === 'star1' || intersects[i].object.name === 'star2') && i < 1) { 
      // i=0 means its the foreground object and so won't trigger movement if it is behind   
      i = intersects.length;
      controls.enabled = false; }
  }
  
  renderer.domElement.addEventListener("pointermove",onpointerMove,true);
  renderer.domElement.addEventListener("pointerup", onpointerUp, true);

}

let pointerUpdateCounter = 0;
function onpointerMove( event ) {
  // the pointerUpdateCounter lets the scence update only on every few movements to reduce rendering glitches
  if( controls.enabled == false && pointerUpdateCounter % 5 == 0 ) {  
    event.preventDefault();
    /* LOCATE THE POINT ON THE SPHERE THAT IT INTERSECT */
    let array = getpointerPosition( container, event.clientX, event.clientY );
	  onClickPosition.fromArray( array );
    let intersects = getIntersects( onClickPosition, scene.children, true );
    if( starmovable == true && intersects[0] != undefined ) { moveStar({x:intersects[0].point.x,y:intersects[0].point.y, z:intersects[0].point.z}); }
    pointerUpdateCounter = 1;
  }
  pointerUpdateCounter++;
}

function getIntersects ( point, objects, opt ) {
				pointer.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
				raycaster.setFromCamera( pointer, camera );
				return raycaster.intersectObjects( objects, opt );
};


function onpointerUp( event ) {
  pointer.x = ( (event.clientX - container.offsetLeft + window.scrollX) / container.clientWidth ) * 2 - 1; // works with 
	pointer.y = - ( (event.clientY - container.offsetTop + window.scrollY) / container.clientHeight ) * 2 + 1;
  pointer_end = [pointer.x,pointer.y];
  
  let x = 0.05; // adjust this for sensitivity to touch (whether to drag sphere or move star)
  if( Math.abs(pointer_start[0]-pointer_end[0]) < x && Math.abs(pointer_start[1]-pointer_end[1]) < x ) {
    let array = getpointerPosition( container, event.clientX, event.clientY );
	  onClickPosition.fromArray( array );
    var intersects = getIntersects( onClickPosition, scene.children, true );
    if( intersects[0] != undefined && starmovable == true ) { moveStar({x:intersects[0].point.x,y:intersects[0].point.y, z:intersects[0].point.z}); }
  }
  renderer.domElement.removeEventListener("pointermove",onpointerMove,true);
  renderer.domElement.removeEventListener("pointerup", onpointerUp, true);  
  controls.enabled = true;
}

function getpointerPosition( dom, x, y ) {
  let rect = dom.getBoundingClientRect();
	return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
};


//////////////////////////
// QUESTION FUNCTIONS //
/////////////////////////
function toggleQuestionMode(opt) {
  let box_opt = document.getElementById('box_options');
  let box_que = document.getElementById('box_question');
  let button_toggle = document.getElementById('button_toggle');
  
  if( opt == undefined || opt == false || opt == 0 ) { // exit question mode
    box_opt.style.display = 'block';
    box_que.style.display = 'none';
    button_toggle.value = 1;
    button_toggle.innerHTML = 'enter question mode';
    starmovable = true;
    moveStar({azi:star.azi,alt:star.alt});
   
  } else if ( opt == true || opt == 1 ) { // enter question mode
    box_opt.style.display = 'none';
    box_que.style.display = 'block';
    box_que.style.visibility = 'visible';
    button_toggle.value = 0;
    button_toggle.innerHTML = 'exit question mode';
    starmovable = false; // default behavior in question mode
    window.location 
    window.setTimeout(function() { loadQuestion(); }, 0 );
  }
}

function toggleQuestionText() {
  let qtext = document.getElementById('qtext');
  let qArr = document.getElementById('qArr');
  let obj = document.getElementById('box_question');
  var rect = obj.getBoundingClientRect();
  obj.style.width = rect.width+'px';
  
  if( qtext.style.display == 'none' ) { 
    qtext.style.display = 'block';
    qArr.innerHTML = '&utrif;';
    obj.style.width = 'auto';
   }
  else { 
    qtext.style.display = 'none';
    qArr.innerHTML = '&dtrif;';
  }
}

function loadQuestion(q) {
  let obj_qnum = document.getElementById('question_number');
  let q_list = document.getElementById('q_list').children;  
  let hash = (location.hash).substring(1,4)*1;  

  q_num = ( hash > 0 && hash <= q_list.length ) ? hash : document.getElementById('question_number').value;
 
  if( q == 'prev' && q_num != 1 ) { q_num -= 1; }
  else if ( q == 'next' && q_num != q_list.length ) { q_num += 1; }
  location.hash = q_num;
  document.getElementById('question_number').value = q_num;
  
  // get all the questions in the question list    
  for( let i = 0; i < q_list.length; i++ ) { 
    //q_list.item(i).style.display = i == q_num - 1 ? 'block' : 'none';
    if( i == q_num - 1 ) {
      q_list.item(i).style.display = 'block';
      document.getElementById('qnum').innerHTML = q_num;
    } else {
      q_list.item(i).style.display = 'none';
    }
  }
  document.getElementById('qprev0').style.opacity = ( q_num == 1 ) ? 0.25 : 1;
  document.getElementById('qprev0').style.cursor = ( q_num == 1 ) ? 'default' : 'pointer';
  document.getElementById('qnext0').style.opacity = ( q_num == q_list.length ) ? 0.25 : 1;
  document.getElementById('qnext0').style.opacity = ( q_num == q_list.length ) ? 'default' : 'pointer';
  
  // initialize question  
  current_div = q_list.item(q_num-1);
  let param_input = current_div.getElementsByClassName('parameters').item(0);
  let opt_input = current_div.getElementsByClassName('options').item(0);
 
  if( param_input != null ) {
    let param = JSON.parse(param_input.value);
    initializeQuestion(param);
  }
  
  if( opt_input != null ) {
    let opt = JSON.parse(opt_input.value);
    starmovable = opt.starmovable != undefined ? opt.starmovable : false;
    initializeQuestionOptions(opt);
  } else {
    starmovable = false;
    initializeQuestionOptions();
  }

  /* indicator text */
  document.getElementById('disabled').style.display = starmovable ? 'none' : 'block';
  
  /* response box */
  document.getElementById('box_response').style.visibility = 'hidden';
  
}

function initializeQuestion(param) {
  let azi,alt,r,x,y,z,step,temp,i,j,n;
  let opt = {};
  if ( param === undefined ) { var param = {}; }
  azi = star.azi; alt = star.alt;
  
  if( param.movestar != undefined ) {    
    if( param.movestar == 'random' ) { param.movestar = {'azi':'random','alt':'random'}; }    
    
    if( param.movestar.azi == 'random' ) {
      if ( param.movestar.azirange ) { opt.azirange = param.movestar.azirange; }
      [azi,temp] = getRandomCoord(opt);
    } else if ( Array.isArray(param.movestar.azi) ) {
      temp = param.movestar.azi;
      i = Math.floor(Math.random()*temp.length);
      azi = temp[i];      
    } else { azi = param.movestar.azi; } 
    
    if( param.movestar.alt == 'random' ) {
      if ( param.movestar.altrange ) { opt.altrange = param.movestar.altrange; }
      [temp,alt] = getRandomCoord(opt);
    } else if ( Array.isArray(param.movestar.alt) ) {
      temp = param.movestar.alt;
      if( !(param.movestar.sync == true )) { i = Math.floor(Math.random()*temp.length); }
      alt = temp[i];      
    } else { alt = param.movestar.alt; }
    
   
    // check for a step size and if so, round to the step size
    azi = param.movestar.azistep != undefined ? Math.round(azi/param.movestar.azistep)*param.movestar.azistep : azi;
    alt = param.movestar.altstep != undefined ? Math.round(alt/param.movestar.altstep)*param.movestar.altstep : alt;      
  }
  moveStar({'azi':azi,'alt':alt});
  
  /* LOOKAT FUNCTION */
  if( param.lookat != undefined ) { // set the camera position
    r = param.lookat.r != undefined ? param.lookat.r : 60;
    if( param.lookat == 'star' ) {
      azi = star.azi;
      alt = star.alt;
    }  else if ( param.lookat == 'random' ) {
      [azi,alt] = getRandomCoord(opt);     
    }
    else {
      if( param.lookat.azi == 'random' || param.lookat.alt == 'random' ) {
        if ( param.lookat.azirange ) { opt.azirange = param.lookat.azirange; }
        if ( param.lookat.altrange ) { opt.altrange = param.lookat.altrange; }
        [azi,alt] = getRandomCoord(opt);
      }
      azi = param.lookat.azi != 'random' ? param.lookat.azi : azi;
      alt = param.lookat.alt != 'random' ? param.lookat.alt : alt;
      
    }
    [x,y,z] = convertCoords({'azi':azi,'alt':alt,'r':r});
    x = x.toFixed(3); y = y.toFixed(3); z = z.toFixed(3);
    camera.position.set(x,y,z);  
    camera.lookAt(0,0,0); // needed anytime the camera is moved
  } // END lookat  

  if ( param.answer != undefined ) { // answer question
    azi = param.answer.azi;
    alt = param.answer.alt;
    
    if( Array.isArray(azi) ) { azi = azi[Math.floor(Math.random()*azi.length)]; }
    if( Array.isArray(alt) ) { alt = alt[Math.floor(Math.random()*alt.length)]; }

    let coord1 = document.getElementById('coord1');
    let coord2 = document.getElementById('coord2');
    if ( coord1 ) { coord1.innerHTML = azi; }
    if ( coord2 ) { coord2.innerHTML = alt; }  
  }
  
  if ( param.text != undefined ) { // text
    // so far just works for the azimuth
    let answer_input = current_div.getElementsByClassName('answer').item(0);
    let txt = [];
    let n = Object.keys(param.text).length;
    for( i = 0; i < n; i++ ) {
      let name = Object.keys(param.text)[i];
      let val = param.text[name];   
      if( Array.isArray(val) ) {
        j = Math.floor(Math.random()*val.length);
        param.text[name] = val[j];
        txt[i] = val[j];        
      } else { txt[i] = val; }
      document.getElementById(name).innerHTML = val[j];
    }
    answer_input.value = txt;


  }
}

function initializeQuestionOptions(param) {
  let i;
  if ( param === undefined ) { var param = {}; }
  
  // togglelabels
  let label_array= ['Zenith_label','Nadir_label','Horizon Plane_label','Meridian_label'];
  let id_array = ['zenithCheckbox','nadirCheckbox','horizonCheckbox','meridianCheckbox'];
  
  if( param.labels != undefined ) {
    if( param.labels == 'all' ) { toggleElement('all'); }
    else if ( param.labels == 'none' ) { toggleElement('none'); }
    else if ( Array.isArray(param.labels) ) {
        for( let i = 0; i < label_array.length; i++ ) {
        scene.getObjectByName(label_array[i]).visible = param.labels[i] == 1 ? true : false;
        document.getElementById(id_array[i]).checked = param.labels[i] == 1 ? true : false;
      }      
    }
  } else { // default state for the labels 
    toggleElement('none');
  }
 
}

function submitQuestion(param,mode,obj) {
  if ( param == undefined ) { param = {}; }
  let dx = param.dx == undefined ? 5 : param.dx;
  let ddx = param.ddx == undefined ? 15 : param.ddx;
  if( param.mode != undefined ) { mode = param.mode; } 
    
  let ans = {};
  let response = {};
  let delta;
  
  // mode is the question type
  if( mode == 1 || mode == undefined ) { // compares star's location to a particular response         
      ans.azi = param.azi == "coord1" ? document.getElementById('coord1').innerHTML*1 : param.azi;
      ans.alt = param.alt == "coord2" ? document.getElementById('coord2').innerHTML*1 : param.alt;
      delta = Math.sqrt( Math.pow(star.azi-ans.azi,2) + Math.pow(star.alt-ans.alt,2) );
      if( delta < dx ) { alertBox('correct (or close enough at least)',obj); }
      else if ( delta < ddx ) { alertBox('close … try to refine the position',obj); }
      else { alertBox('incorrect',obj); }
  } else if ( mode == 2 ) {
      if( param.ans == true ) { alertBox('correct',obj); }
      else { alertBox('incorrect',obj); }    
  } else if ( mode == 3 ) {
    ans.azi = param.azi;
    ans.alt = param.alt;
    response.azi = document.getElementById(param.id1).value;
    response.alt = document.getElementById(param.id2).value;
    
    if( response.azi == ans.azi && response.alt == ans.alt ) { alertBox('correct',obj); }
    else if( (response.azi != ans.azi && response.alt == ans.alt) || (response.azi == ans.azi && response.alt != ans.alt) ) { alertBox('one correct, one incorrect',obj); }
    else if( response.azi != ans.azi && response.alt != ans.alt) { alertBox('both incorrect',obj); }    
  } else if ( mode == 'Lee1' ) { // football post question
    let Dx = 8.764,azi0,azi1,azi2,delta2;
    // Dx = half angle of goal post width (18.5ft)
    
    if( param.azi == 'text' ) {
      let answer_input = current_div.getElementsByClassName('answer').item(0);
      var answer = (answer_input.value).split(",");
      
      if( answer[0].toLowerCase() == 'north' ) { azi0 = 0; }
      else if ( answer[0].toLowerCase() == 'east' ) { azi0 = 90; }
      else if ( answer[0].toLowerCase() == 'south' )  { azi0 = 180; }
      else if ( answer[0].toLowerCase() == 'west' ) { azi0 = 270; }      
      azi2 = azi0;
      
      if( answer[1].toLowerCase() == 'left' ) {
        azi1 = azi0-Dx; azi2 = azi0+Dx;
        azi1 = azi1 < 0 ? 360+azi1 : azi1;
      } else if ( answer[1].toLowerCase() == 'right' ) {
        azi1 = azi0+Dx; azi2 = azi0-Dx;
        azi2 = azi2 < 0 ? 360+azi2 : azi2;        
      }
    }   
    ans.azi = azi1;
    let dl = document.getElementById(param.alt).innerHTML*1+10;
    ans.alt = (10/dl)*180/Math.PI;
    
    // now check to see if correct
    delta = Math.sqrt( Math.pow(star.azi-azi1,2) + Math.pow(star.alt-ans.alt,2) );
    delta2 = Math.sqrt( Math.pow(star.azi-azi2,2) + Math.pow(star.alt-ans.alt,2) );    
    let hint_txt = 'Be mindful of how left and right adjust when looking from outside the sphere vs looking from inside the sphere.';
    if( answer[1] == 'right' && (
        (azi0 == 90 && star.azi < 90 && delta2 < dx ) ||
        (azi0 == 180 && star.azi < 180 && delta2 < dx ) ||
        (azi0 == 270 && star.azi < 270 && delta2 < dx ) ||
        (azi0 == 0 && star.azi > 300 && delta2 < dx )
      ) ) { alertBox(hint_txt,obj); } 
    else if ( answer[1] == 'left' && ( 
        (azi0 == 90 && star.azi > 90 && delta2 < dx ) ||
        (azi0 == 180 && star.azi > 180 && delta2 < dx ) ||
        (azi0 == 270 && star.azi > 270 && delta2 < dx ) ||
        (azi0 == 0 && star.azi > 0 && delta2 < dx )
      ) ) { alertBox(hint_txt,obj); }          
    else if( delta < dx ) { alertBox('correct (or close enough to azimuth '+((ans.azi).toFixed(1))+'\xB0 and altitude '+((ans.alt).toFixed(1))+'\xB0)',obj); }
    else if ( delta < ddx ) { alertBox('close … try to refine the position',obj); }
    else { alertBox('incorrect',obj); }

  } // end Lee1
}

////////////////////
// MISC FUNCTIONS //
////////////////////

function getRandomCoord(param) {
  let azi,alt,u,v,test;
  test = true;
  
  if ( param === undefined ) { var param = {}; }
    param.azirange = param.azirange == undefined ? [0,360] : param.azirange;
    param.altrange = param.altrange == undefined ? [-90,90] : param.altrange;
  
    // just using random coordinates does not give a random distribution
    // start with u and v, random variables over 0 .. 1
 
    while ( test == true ) {
      u = Math.random(); 
      v = Math.random();  
  
      azi = 360*u;
      alt = Math.acos(2*v-1)*180/Math.PI-90;

      if( azi >= param.azirange[0] && azi <= param.azirange[1] && alt >= param.altrange[0] && alt <= param.altrange[1] ) { test = false; }
    }
  
  return([azi,alt]);
}

function toggleDisplay(id,submit_id) {
  let obj = document.getElementById(id);
  if( obj == undefined ) { obj.style.display = (obj.style.display == 'block') ? 'none' : 'block'; }  
  else {
    if( submit_id == '' || submit_id == submit_id_old || submit_id == undefined ) { obj.style.visibility = (obj.style.visibility == 'visible') ? 'hidden' : 'visible'; }
    else { obj.style.visibility = 'visible'; submit_id_old = submit_id; }
  }  
}

function alertBox(txt,submit_obj) {
  if( submit_obj != undefined ) {
    if (submit_obj.id == "" || submit_obj.id == undefined) { 
      submit_id = 'id'+Math.round(Math.random()*1E6); 
      submit_obj.id = submit_id;
    } else { submit_id = submit_obj.id; }
  } else { submit_id == ''; }
  
  let obj = document.getElementById('box_response');
  obj.children.item(1).innerHTML = txt;  
  toggleDisplay('box_response',submit_id);
}

// Make the DIV element draggable:
function dragElement(id,opt) {
  let obj,obj2, pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0; 
  obj = document.getElementById(id);
  obj2 = document.getElementById(id+'_header');
  
  if( opt == undefined ) {
    obj2.addEventListener("touchstart", touchStart,{capture:true,once:false});
    obj2.addEventListener("mousedown", mouseDown,{capture:true,once:false});
  } else {
    obj2.removeEventListener("touchstart", touchStart,{capture:true,once:false});
    obj2.removeEventListener("mousedown", mouseDown,{capture:true,once:false}); 
  }
 
  var rect = obj.getBoundingClientRect();
  obj.style.top = rect.top+'px';
  obj.style.bottom = '';  // get rid of the bottom element
  
  ///// START /////
  function touchStart(e) { 
    e = e || window.event;
    e.preventDefault();    
    // get the touch cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    document.addEventListener('touchend',touchEnd,false);
    document.addEventListener('touchmove',touchMove,false);
    
    // disable the sphere
    controls.enabled = false;
  }
  function mouseDown(e) { 
    e = e || window.event;
    e.preventDefault();    
    // get the touch cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    document.addEventListener('mouseup',mouseEnd,false);
    document.addEventListener('mousemove',mouseMove,false);
    
    // disable the sphere
    controls.enabled = false;
  }
  
  ///// MOVIING //////
  function touchMove(e) {
    e.preventDefault();    
    let touches = e.changedTouches;
    pos1 = pos3 - touches[0].pageX;
    pos2 = pos4 - touches[0].pageY;
    pos4 = touches[0].pageY;
    pos3 = touches[0].pageX; 
    obj.style.top = (obj.offsetTop - pos2) + 'px';
    obj.style.left = (obj.offsetLeft - pos1) + 'px';
  }
  function mouseMove(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    obj.style.top = (obj.offsetTop - pos2) + 'px';
    obj.style.left = (obj.offsetLeft - pos1) + 'px';
  }
  
  ///// ENDING /////
  function touchEnd() {
    document.removeEventListener('touchmove', touchMove, false);
    document.removeEventListener('touchend', touchEnd, false); 
    obj2.addEventListener("touchstart", touchStart,{capture:true,once:false});
    
    controls.enabled = true;
  }  
  function mouseEnd() {
    document.removeEventListener('mouseup',mouseEnd,false);
    document.removeEventListener('mousemove',mouseMove,false);
    obj2.addEventListener("mousedown", mouseDown,{capture:true,once:false});
    controls.enabled = true;
  }
  
}

