// global variables
let container;
let camera;
let control;
let renderer;
let scene;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
var star;
let onClickPosition = new THREE.Vector2();
let textObjects = new Array();
  
  /* DEFINE object with the parameters */
let options = new Object({
  r:10,
  rr:9.925,
});

function init() {

  // CONTAINER for the CANVAS object
  container = document.querySelector( '#scene-container' );   

  // SCENCE
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );
  
  createCamera();
  createControls();
  createLights();
  createMeshes();
  createRenderer();

  window.requestAnimationFrame(render);
  
  // start the animation loop
  renderer.setAnimationLoop( () => {
    update();
    render(); 
  } );

  let ra = document.getElementById('ra_value').value;
  let dec = document.getElementById('dec_value').value;
  moveStar({ra: ra, dec: dec});  
  
  
  setTimeout(function(){ toggleElement(); }, 0);
  
}


/////////////////////////////////////
// ASTRONOMY CALCULATION FUNCTIONS //
/////////////////////////////////////

function convertCoords(param) { 
  // +x:E , +z:S , +y:N
  let x,y,z,xz,dec,ra,q1,q2,r;
  r = options.rr; 
  if ( param.dec != undefined ) { // declination and right ascension to sphere coords
    ra = param.ra, dec = param.dec;
    q1 = ra*Math.PI/180*360/24; q2 = dec*Math.PI/180;
    x = r*Math.sin(q1)*Math.cos(q2);
    y = r*Math.sin(q2);
    z = r*Math.cos(q1)*Math.cos(q2);
    return([x,y,z]);      
  } else if ( param.x != undefined ) { // sphere coords to declination and ramuth
    x = param.x, y = param.y, z = param.z;  
    xz = Math.sqrt(x*x+z*z);    
    dec = Math.atan(y/xz)*180/Math.PI;
    if( z < 0 && x >= 0 ) { ra = 90+Math.atan( Math.abs(z/x))*180/Math.PI; }
    else if ( z >= 0 && x >= 0 ) { ra = Math.atan( Math.abs(x/z) )*180/Math.PI; }
    else if ( z >= 0 && x < 0 ) { ra = 360-Math.atan( Math.abs(x/z) )*180/Math.PI; }
    else if ( z < 0 && x < 0 ) { ra = 180+Math.atan( Math.abs(x/z) )*180/Math.PI; }
    ra = ra*24/360;    
    return([ra,dec]);  
  }
}


function moveStar(param) {
  let dec,ra,x,y,z;
  
    // if they are present need to remove and then redraw
  if( scene.getObjectByName('coordsTextDec') != undefined || true ) {   
    scene.remove(scene.getObjectByName('right ascension line'));
    scene.remove(scene.getObjectByName('right ascension line2'));    
    scene.remove(scene.getObjectByName('declination line'));
    scene.remove(scene.getObjectByName('declination line2'));
    scene.remove(scene.getObjectByName('coordsTextRA'));
    scene.remove(scene.getObjectByName('coordsTextDec'));
    
  }
  
  if( scene.getObjectByName('coordsTextDec') == undefined ) { 

  // get parameters either is as cartesian or celestial
  if( param != undefined ) { 
    if ( param.x != undefined ) {
      x = param.x;
      y = param.y;
      z = param.z;        
    } else if( param.dec != undefined || param.ra != undefined ) {
      dec = param.dec != undefined ? param.dec : star.dec;
      ra = param.ra != undefined ? param.ra : star.ra;
      [x,y,z] = convertCoords({ra:ra,dec:dec});    
    } else {
      dec = 180;
      ra = 0;
      [x,y,z] = convertCoords({ra:ra,dec:dec});    
    }
  }
 
  // move start
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
  [star.ra,star.dec] = convertCoords({x:endVector.x,y:endVector.y,z:endVector.z});
    
  // rotate star so the plane of the star is flat
  let q = new THREE.Quaternion;
  q.setFromUnitVectors(startVector.normalize(), endVector.normalize());
  star.applyQuaternion(q);

        
  // RIGHT ASCENSION AND DECLINATION
  let q_ra = star.ra == 0 ? 1E-9 : star.ra*Math.PI/180;
  q_ra = q_ra*360/24;
  let geometry_ra = new THREE.TorusBufferGeometry( options.r+0.01, 0.06, 8, 100, q_ra );
  let material_ra = new THREE.MeshBasicMaterial( { color: 0x0000ff,transparent:false,opacity:1 } );
  let torus_ra = new THREE.Mesh( geometry_ra, material_ra );   
  // torus is drawn the xy plane -- need to rotate it (order matters!)
  torus_ra.rotateX(-Math.PI/2);
  torus_ra.rotateZ(-Math.PI/2);            
  scene.add( torus_ra );
  torus_ra.name = 'right ascension line';
  
  let geometry_ra2 = new THREE.TorusBufferGeometry( options.r, 0.06, 8, 100 );
  let material_ra2 = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.25 } );
  let torus_ra2 = new THREE.Mesh( geometry_ra2, material_ra2 );
  torus_ra2.rotateY(-Math.PI/2+q_ra);
  scene.add( torus_ra2 );
  torus_ra2.name = 'right ascension line2';
   
  let q_dec = star.dec == 0 ? 1E-9 : star.dec*Math.PI/180;
  let geometry_dec = new THREE.TorusBufferGeometry( options.r+0.01, 0.05, 8, 100, q_dec );
  let material_dec = new THREE.MeshBasicMaterial( { color: 0xff0000,transparent:false,opacity:1} );
  let torus_dec = new THREE.Mesh( geometry_dec, material_dec );   
  // torus is drawn the xy plane -- need to rotate it (order matters!)
  torus_dec.rotateY(-Math.PI/2+q_ra);
  scene.add(torus_dec);    
  torus_dec.name = 'declination line';
  
  let geometry_dec2 = new THREE.TorusBufferGeometry( options.r*Math.cos(q_dec), 0.04, 8, 100 );
  let material_dec2 = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.25 } );
  let torus_dec2 = new THREE.Mesh( geometry_dec2, material_dec2 );
  torus_dec2.rotateX(Math.PI/2);
  torus_dec2.translateZ(-options.r*Math.sin(q_dec));
  scene.add( torus_dec2 );
  torus_dec2.name = 'declination line2';
  
    // Add COORDINATE TEXT
  createCoordsText('ra');
  createCoordsText('dec');


  // CHANGE TEXT BOXES
  document.getElementById('raBox').value = (star.ra).toFixed(1);
  document.getElementById('decBox').value = (star.dec).toFixed(1);
  document.getElementById('raSlider').value = (star.ra).toFixed(1);
  document.getElementById('decSlider').value = (star.dec).toFixed(1);
  document.getElementById('ra_value').value = (star.ra).toFixed(1);
  document.getElementById('dec_value').value = (star.dec).toFixed(1);
  
  } // end scene.getObjectByName('coordsTextAlt') == undefined check   
}  

function toggleElement(id) {
  let label_array= ['North Celestial Pole_label','South Celestial Pole_label','0h circle_label','Celestial Equator_label','Equator_label','Ecliptic_label','ecliptic line','North Earth Pole_label','South Earth Pole_label','coordsTextEast'];
  var id_array = ['earthpolesCheckbox','earthequatorCheckbox','celpolesCheckbox','celequatorCheckbox','zerohCheckbox','eastarrowCheckbox','eclipticCheckbox'];
  
  if( id == 'all' || id == 'none' ) {
    for( let i = 0; i < label_array.length; i++ ) { scene.getObjectByName(label_array[i]).visible = id == 'all' ? true : false; }
    for( let i = 0; i < id_array.length; i++ ) { document.getElementById(id_array[i]).checked = id == 'all' ? true : false; }
  } else {    
    if ( id == 'earthpolesCheckbox' || id == undefined ) { 
      label_array = ['North Earth Pole_label','South Earth Pole_label'];
      for( let i = 0; i < label_array.length; i++ ) { scene.getObjectByName(label_array[i]).visible = document.getElementById('earthpolesCheckbox').checked; }  
    }
    if ( id == 'celpolesCheckbox' || id == undefined ) {
      label_array =  ['North Celestial Pole_label','South Celestial Pole_label'];
      for( let i = 0; i < label_array.length; i++ ) { scene.getObjectByName(label_array[i]).visible = document.getElementById('celpolesCheckbox').checked; }
    }    
    if ( id == 'earthequatorCheckbox' || id == undefined ) { 
      label_array = ['Equator_label'];
      scene.getObjectByName(label_array[0]).visible = document.getElementById('earthequatorCheckbox').checked; 
    }
    if ( id == 'celequatorCheckbox' || id == undefined ) { 
      label_array = ['Celestial Equator_label'];
      scene.getObjectByName(label_array[0]).visible = document.getElementById('celequatorCheckbox').checked; 
    }
    if ( id == 'zerohCheckbox' || id == undefined ) { 
      label_array = ['0h circle_label'];
      scene.getObjectByName(label_array[0]).visible = document.getElementById('zerohCheckbox').checked; 
    }
    if ( id == 'eastarrowCheckbox' || id == undefined ) {
      label_array = ['coordsTextEast'];
      scene.getObjectByName(label_array[0]).visible = document.getElementById('eastarrowCheckbox').checked;
    }
    if ( id == 'eclipticCheckbox' || id == undefined ) { 
      label_array =  ['Ecliptic_label','ecliptic line'];
      for( let i = 0; i < label_array.length; i++ ) { scene.getObjectByName(label_array[i]).visible = document.getElementById('eclipticCheckbox').checked; }   
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
  let cs = 2;
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
  cube.position.set(0,0,0);
  //scene.add(cube);
  cube.name = 'cube';

  // CELESTIAL SPHERE  
	let sphereGeometry = new THREE.SphereGeometry( options.r, 32, 32 );	
	let sphereMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, transparent: true, opacity: 0.1 }); 
	let celSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	celSphere.position.set( 0, 0, 0 );
	scene.add( celSphere );
  celSphere.name = 'celestial sphere';
  celSphere.renderOrder = 1; // three.js handles transperency in a funny way for computational reasons ... this seems to help
  
    // CELESTIAL sphere2  
	let sphere2Geometry = new THREE.SphereGeometry( 2, 32, 32 );
  let sphere2Texture = new THREE.TextureLoader().load('textures/Equirectangular_projection_SW.jpg' );
	let sphere2Material = new THREE.MeshBasicMaterial( { map: sphere2Texture} );
	let earth = new THREE.Mesh(sphere2Geometry, sphere2Material);
	earth.position.set( 0, 0, 0 );
  scene.add( earth );
  earth.rotateY(-90*Math.PI/180);  
  earth.name = 'earth';
  
  // MERIDIAN and EW CIRCLE and EQUATOR
  let thick = 0.06;
  let geometry_mer = new THREE.TorusBufferGeometry( options.r, thick, 16, 100, Math.PI );
  let material_mer = new THREE.MeshBasicMaterial( { color: 0x224422,transparent:true,opacity:0.75 } );
  let torus_mer = new THREE.Mesh( geometry_mer, material_mer );    
  torus_mer.rotateY(Math.PI/2);
  //torus_mer.rotateX(Math.PI/2);  
  torus_mer.rotateZ(Math.PI/2);
  scene.add( torus_mer );
  torus_mer.name = 'meridian';
  
  let geometry_mer2 = new THREE.TorusBufferGeometry( options.r, thick, 16, 100, 2*Math.PI );
  let material_mer2 = new THREE.MeshBasicMaterial( { color: 0x000000,transparent:true,opacity:0.25 } );
  let torus_mer2 = new THREE.Mesh( geometry_mer2, material_mer2 );    
  //torus_mer2.rotateY(Math.PI/2);
  //torus_mer2.rotateX(Math.PI/2);  
  //torus_mer2.rotateZ(Math.PI/2);
  scene.add( torus_mer2 );
  torus_mer2.name = 'meridian2';
  
  let geometry_ceq = new THREE.TorusBufferGeometry( options.r, thick, 16, 100, 2*Math.PI );
  let material_ceq = new THREE.MeshBasicMaterial( { color: 0x224422,transparent:true,opacity:0.75 } );
  let torus_ceq = new THREE.Mesh( geometry_ceq, material_ceq );    
  //torus_ceq.rotateY(Math.PI/2);
  torus_ceq.rotateX(Math.PI/2);  
  //torus_ceq.rotateZ(Math.PI/2);
  scene.add( torus_ceq );
  torus_ceq.name = 'celestial equator';
  
  
  let geometry_eeq = new THREE.TorusBufferGeometry( 2, 0.03, 16, 100, 2*Math.PI );
  let material_eeq = new THREE.MeshBasicMaterial( { color: 0x0000ff,transparent:true,opacity:0.5 } );
  let torus_eeq = new THREE.Mesh( geometry_eeq, material_eeq );    
  //torus_eeq.rotateY(Math.PI/2);
  torus_eeq.rotateX(Math.PI/2);  
  //torus_eeq.rotateZ(Math.PI/2);
  scene.add( torus_eeq );
  torus_eeq.name = 'earth equator';
  
  let geometry_ecl = new THREE.TorusBufferGeometry( options.r, thick, 16, 100, 2*Math.PI );
  let material_ecl = new THREE.MeshBasicMaterial( { color: 0x9931DF,transparent:true,opacity:0.75 } );
  let torus_ecl = new THREE.Mesh( geometry_ecl, material_ecl );    
  torus_ecl.rotateY(-Math.PI/2);
  torus_ecl.rotateX(Math.PI/2+23.5*Math.PI/180);  
  //torus_ecl.rotateZ(Math.PI/2);
  scene.add( torus_ecl );
  torus_ecl.name = 'ecliptic line';
  

  // Celestial POLES
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
  pole_Zenith.name = 'North Celestial Pole';
  
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
  pole_Nadir.name = 'South Celestial Pole';
  
  
    // POLES
  let pole_north = new THREE.Group();
  
  //let poleMaterial = new THREE.MeshBasicMaterial( { color:'black',transparent:true,opacity:0.5,side: THREE.DoubleSide } );
  poleGeometry = new THREE.CylinderBufferGeometry( 0.04, 0.04, 0.75, 32  );  
  let polenorth = new THREE.Mesh( poleGeometry, poleMaterial );
  polenorth.translateY(0.375);
  
  pole_north.add(polenorth);
  pole_north.name = 'North Earth Pole';
  
  pole_north.translateY(2);
  scene.add( pole_north );
  
  let pole_south = new THREE.Group();
  let polesouth = new THREE.Mesh( poleGeometry, poleMaterial );
  polesouth.translateY(-0.375);
 
  pole_south.add(polesouth);
 
  pole_south.translateY(-2-0.05);
  scene.add( pole_south );
  pole_south.name = 'South Earth Pole';  
  
  // rotation arrow
  
  let geometry_arrow1 = new THREE.RingGeometry( 0.25, 0.45, 32, 32, Math.PI/4, 6*Math.PI/4 );
  let material_arrow1 = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.DoubleSide, opacity: 0.5, transparent: true } );
  let mesh_arrow1 = new THREE.Mesh( geometry_arrow1, material_arrow1 );
  
  let shape_arrow2 = new THREE.Shape();
  let x = 0, y = 0.25;
  shape_arrow2.moveTo(x,y);
  shape_arrow2.lineTo(0.2,0);
  shape_arrow2.lineTo(-0.2,0);
  shape_arrow2.lineTo(x,y);
  let geometry_arrow2 = new THREE.ShapeGeometry( shape_arrow2 );
   
  let mesh_arrow2 = new THREE.Mesh( geometry_arrow2, material_arrow1);
  mesh_arrow2.translateX(0.35/Math.sqrt(2));
  mesh_arrow2.translateY(-0.35/Math.sqrt(2));
  mesh_arrow2.rotateZ(-Math.PI/4);
  
  let rotation_arrow = new THREE.Group();
  rotation_arrow.add(mesh_arrow1,mesh_arrow2);
  
  rotation_arrow.rotateX(-Math.PI/2); 
  rotation_arrow.translateZ(3);
  scene.add( rotation_arrow );
  rotation_arrow.name = 'Rotation Arrow';
  



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
  let starMashBasic_param = { color: 0xFDFD33 };
  let starMashBasic_param2 = { color: 0x515333 };   
  //let starMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00,side: THREE.DoubleSide } );
  //let starGeometry = new THREE.ShapeGeometry( starShape );
  let starMaterialArray = [];  // order to add materials: side, top, bottom
	starMaterialArray.push( new THREE.MeshBasicMaterial( starMashBasic_param ) );
	starMaterialArray.push( new THREE.MeshBasicMaterial( starMashBasic_param2 ) );
	starMaterialArray.push( new THREE.MeshBasicMaterial( starMashBasic_param ) );
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
  //[star.ra,star.alt] = convertCoords({x:0,y:0,z:options.rr});
  
    // CREATE SPHERE TEXT
  createSphereText();
  createCoordsText('EAST');  
}

function createSphereText() {
  createLabelText('North Celestial Pole',[0,10,0],-60,[4,1.5],[1,1.5]);
  createLabelText('South Celestial Pole',[0,-10,0],60,[4,-1.5],[-1,1.5]);
  
  createLabelText('North Earth Pole',[0,2,0],-60,[4.5,1.5],[1,1.5]);
  createLabelText('South Earth Pole',[0,-2,0],60,[4.5,-1.5],[-1,1.5]);
  
  
  let dir = new THREE.Vector3();
  dir.x = 0; dir.y = 12; dir.z = 10;
  dir.normalize();
  dir.multiplyScalar(options.r);  
  createLabelText('0h circle',[dir.x,dir.y,dir.z],-60,[-4.75,-1.5],[-1,-1.5]);
  
  dir.x = -12; dir.y = 0; dir.z = 10;
  dir.normalize();
  dir.multiplyScalar(options.r);  
  createLabelText('Celestial Equator',[dir.x,dir.y,dir.z],-60,[-5.75,-1.5],[-1,-1.5]);
  
  dir.x = -12; dir.y = 0; dir.z = 10;
  dir.normalize();
  dir.multiplyScalar(2);  
  createLabelText('Equator',[dir.x,dir.y,dir.z],-60,[-4.1,-1.5],[-1,-1.5]);
  
  dir.x = 12; dir.y = 12*Math.sin(23.5*Math.PI/180); dir.z = 5;
  dir.normalize();
  dir.multiplyScalar(options.r);  
  createLabelText('Ecliptic',[dir.x,dir.y,dir.z],-60,[4,1.5],[1,1.5]);

}

function createLabelText(txt,pos,q,d1,d2) {

  // textSprite custom creation by another
  let sprite = new THREE.TextSprite({
    material: {
      color: 0x000000,
      fog: true,
    },
    redrawInterval: 250,
    textSize: 0.8,
      texture: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      text: txt,
    },  
  });
  sprite.translateX(d1[0]);
  sprite.translateY(d1[1]);
  
  // add label text line  
  let lineMaterial = new THREE.MeshBasicMaterial( { color:'black',transparent:true,opacity:0.5,side: THREE.DoubleSide } );
  let lineGeometry = new THREE.CylinderBufferGeometry( 0.04, 0.04,2, 32  );  
  let line = new THREE.Mesh( lineGeometry, lineMaterial );
  line.translateY(d2[0]);
  line.translateX(d2[1]);
  line.rotateZ(q*Math.PI/180);
   
  
  let textGroup = new THREE.Group();
  textGroup.add(sprite);
  textGroup.add(line);
  textGroup.position.set(pos[0],pos[1],pos[2]);
  
  scene.add(textGroup);
  textGroup.name = txt+'_label';
}


function createCoordsText(opt) {
  if( opt == undefined ) { let opt = 'EAST'; }
    
  if( opt == 'ra' ) {
    var color = 'blue';   
    var txt = (star.ra).toFixed(1)+' '+'h';
    var q_ra = 90-star.ra*360/24*Math.PI/180;
    var q2_ra = q_ra-0*Math.PI/180;
    var textAxis = new THREE.Vector3(-Math.cos(q2_ra),-2.0*Math.PI/180,-Math.sin(q2_ra));
    textAxis.normalize();   
  } else if( opt == 'dec' ) {
    var color = 'red';
    var txt = (star.dec).toFixed(1)+'\u00b0';
    var q_dec = star.dec*Math.PI/180;
    var q2_dec = q_dec/2;                   
    var q_ra = (90-star.ra*360/24)*Math.PI/180;
    // NEED to change how the text axis is calculated
    var q2_ra = q_ra+0*Math.PI/180;
    var textAxis = new THREE.Vector3(Math.cos(q2_ra),q2_dec,Math.sin(q2_ra));
    textAxis.normalize();   
  } else if ( opt == 'EAST' ) {
    var color = 'black';
    var txt = 'EAST >';
    var q_dec = 0;
    var q_ra = 0;
    var textAxis = new THREE.Vector3(0,0,10);
    textAxis.normalize();
  }

  let loader = new THREE.FontLoader(); 
  let font = loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
  //let font = loader.load( 'fonts/Calibri_Regular.typeface.json', function ( font ) {
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

    if( opt == 'ra' ) {
      textMesh.translateX(dX/2);    
      textMesh.translateY(dY);
      textMesh.translateZ(dZ);
    } else if ( opt == 'dec' ) {
      textMesh.translateX(dX/2);    
      textMesh.translateY(0);
      textMesh.translateZ(dZ);
    } else if ( opt == 'EAST' ) {
      textMesh.translateX(-dX);    
      textMesh.translateY(-dY);
      textMesh.translateZ(dZ);
    }

  
    var helper = new THREE.Box3Helper( bbox, 0xff0000 );
    var coordGroup = new THREE.Group();
    //coordGroup.add(helper);
    coordGroup.add(textMesh);
    scene.add(coordGroup)
    
    if( opt == 'ra' ) {
      coordGroup.translateOnAxis(textAxis,-options.r);
      coordGroup.rotateY(Math.PI/2-q2_ra+5*Math.PI/180);
      coordGroup.rotateX(-5*Math.PI/180);     
      coordGroup.name = 'coordsTextRA';
     } else if( opt == 'dec' ) {
      coordGroup.translateOnAxis(textAxis,options.r);
      coordGroup.rotateY(Math.PI/2-q2_ra+5*Math.PI/180);
      coordGroup.rotateX(-q_dec/2);    
      coordGroup.name = 'coordsTextDec';
     } else if( opt == 'EAST' ) {
      coordGroup.translateOnAxis(textAxis,options.r+2);
      coordGroup.name = 'coordsTextEast'; 
     } 
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
  camera.position.set( 10, 20, 60 );
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

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.physicallyCorrectLights = true;                                        
  container.appendChild( renderer.domElement );  
   
  renderer.domElement.addEventListener("mousedown", onMouseDown, true);
  renderer.domElement.addEventListener("mouseup", onMouseUp, true);
  renderer.domElement.addEventListener("mousemove",onMouseMove,true);

}


///////////////////////
// CONTROL FUNCTIONS //
///////////////////////


///////////////////////
// CONTROL FUNCTIONS //
///////////////////////


// the mouse drag when not on the star
function createControls() { 
  controls = new THREE.OrbitControls( camera, container ); 
  controls.enablePan = false;
  controls.enableZoom = true;
  //controls.addEventListener( 'change', () => renderer.render( scene, camera ) );
}


// a function that will be called every time the window gets resized. It can get called a lot, so don't put any heavy computation in here!
function onWindowResize() {  
  camera.aspect = container.clientWidth / container.clientHeight; // set the aspect ratio to match the new browser window aspect ratio  
  camera.updateProjectionMatrix(); // update the camera's frustum  
  renderer.setSize( container.clientWidth, container.clientHeight ); // update the size of the renderer AND the canvas
}
window.addEventListener( 'resize', onWindowResize );
 
function onMouseDown( event ) {
	mouse.x = ( (event.clientX - container.offsetLeft + window.scrollX) / container.clientWidth ) * 2 - 1; // works with 
	mouse.y = - ( (event.clientY - container.offsetTop + window.scrollY) / container.clientHeight ) * 2 + 1;

  	// update the picking ray with the camera and mouse position                                               
	raycaster.setFromCamera( mouse, camera );
  let intersects = raycaster.intersectObjects( scene.children, true );
  
  for ( let i = 0; i < intersects.length; i++ ) {
    if( (intersects[i].object.name === 'star1' || intersects[i].object.name === 'star2') && i < 1) { // i=0 means its the foreground object and so won't trigger movement if it is behind   
      i = intersects.length;
      controls.enabled = false; }
  }
}

let mouseUpdateCounter = 0;
function onMouseMove( event ) {
  // the mouseUpdateCounter lets the scence update only on every few movements to reduce rendering glitches
  //if( controls.enabled == false && mouseUpdateCounter % 3 == 0 ) {  
  if( controls.enabled == false ) {
    event.preventDefault();
    /* LOCATE THE POINT ON THE SPHERE THAT IT INTERSECT */
    let array = getMousePosition( container, event.clientX, event.clientY );
	  onClickPosition.fromArray( array );
    let intersects = getIntersects( onClickPosition, scene.children, true );
    moveStar({x:intersects[0].point.x,y:intersects[0].point.y, z:intersects[0].point.z});
    mouseUpdateCounter = 0;
  }
  mouseUpdateCounter++;
}

function getIntersects ( point, objects ) {
				mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
				raycaster.setFromCamera( mouse, camera );
				return raycaster.intersectObjects( objects );
};


function onMouseUp( event ) {
  controls.enabled = true;
}

function getMousePosition( dom, x, y ) {
  let rect = dom.getBoundingClientRect();
	return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
};

//////////////////
// START THINGS //
//////////////////

// call the init function to set everything up
init();
