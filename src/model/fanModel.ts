import * as THREE from "three";

export interface FanRuntime {
  root: THREE.Group;
  tick: (delta: number, elapsed: number) => void;
  onClick: (hit: THREE.Intersection) => void;
  isClickable: (hit: THREE.Intersection) => boolean;
  setSpeed: (speed: number) => void;
}

// Auto-generated Retro Desk Fan (v6 - Final Interactive Model)
// 68 Meshes | 46,496 Triangles | Speed 0-3 | Airflow Particle Ribbons

export function createRetroDeskFan(THREE, ctx) {
const __base = (function (THREE, ctx) {
const __base = (function (THREE, ctx) {
const __base = (function (THREE, ctx) {
const __base = (function (THREE, ctx) {
const __base = (function (THREE, ctx) {
// MODE: FULL
const root = new THREE.Group(); root.name = 'RetroDeskFan';
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(1234);
const V3 = THREE.Vector3;

// ---------- materials ----------
const gm = new THREE.DataTexture(new Uint8Array([90,170,255]), 3, 1, THREE.RedFormat);
gm.minFilter = gm.magFilter = THREE.NearestFilter; gm.needsUpdate = true;
const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: gm });
const mMain = toon(0xF23A0E), mShade = toon(0xC42A08), mHi = toon(0xFF6A3A), mKnob = toon(0xD8300A);
const mOutline = new THREE.MeshBasicMaterial({ color: 0x7A1A0B, side: THREE.BackSide });
const mRim = new THREE.MeshStandardMaterial({ color: 0xE2381A, metalness: 0.3, roughness: 0.45 });
const mWire = new THREE.MeshStandardMaterial({ color: 0xB8402C, metalness: 0.3, roughness: 0.5 });
const mBlade = new THREE.MeshStandardMaterial({ color: 0xF2E8DA, roughness: 0.6, side: THREE.DoubleSide });

function merge(gs){
  const pos=[],nor=[],idx=[];let off=0;
  gs.forEach(g=>{
    const p=g.attributes.position,n=g.attributes.normal;
    for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));}
    if(g.index){for(let i=0;i<g.index.count;i++)idx.push(g.index.getX(i)+off);}
    else{for(let i=0;i<p.count;i++)idx.push(i+off);}
    off+=p.count;
  });
  const m=new THREE.BufferGeometry();
  m.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  m.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  m.setIndex(idx);return m;
}
function addBody(name, geo, mat, pos, outlined, parent){
  const m=new THREE.Mesh(geo,mat); m.name=name; m.castShadow=m.receiveShadow=true;
  if(pos) m.position.copy(pos);
  (parent||root).add(m);
  if(outlined){
    const g=geo.clone(),p=g.attributes.position,n=g.attributes.normal;
    for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*0.0015,p.getY(i)+n.getY(i)*0.0015,p.getZ(i)+n.getZ(i)*0.0015);
    const o=new THREE.Mesh(g,mOutline); o.name=name+'_outline';
    o.position.copy(m.position);o.quaternion.copy(m.quaternion);o.scale.copy(m.scale);
    (parent||root).add(o);
  }
  return m;
}

// ---------- base ----------
const baseProf=[[0.0001,0],[0.12,0],[0.118,0.010],[0.105,0.022],[0.075,0.036],[0.035,0.044],[0.0001,0.045]].map(a=>new THREE.Vector2(a[0],a[1]));
addBody('base',new THREE.LatheGeometry(baseProf,48),mMain,null,true);
const foot=new THREE.TorusGeometry(0.118,0.006,10,48);foot.rotateX(Math.PI/2);
addBody('footRing',foot,mShade,new V3(0,0.006,0),false);

// knob
const knob=new THREE.Group();knob.name='knob';
const kc=new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.013,0.010,20),mKnob);kc.position.y=0.005;
const kd=new THREE.Mesh(new THREE.SphereGeometry(0.013,20,10,0,Math.PI*2,0,Math.PI/2),mKnob);kd.position.y=0.010;
knob.add(kc,kd);
const kdir=new V3(-0.6,0,0.8).normalize();
knob.position.set(kdir.x*0.085,0.029,kdir.z*0.085);
knob.quaternion.setFromUnitVectors(new V3(0,1,0),new V3(kdir.x*0.45,1,kdir.z*0.45).normalize());
knob.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.knob=true;}});
root.add(knob);

// ---------- stand ----------
const standProf=[[0.060,0.040],[0.040,0.060],[0.030,0.090],[0.024,0.150],[0.021,0.230],[0.023,0.245]].map(a=>new THREE.Vector2(a[0],a[1]));
addBody('stand',new THREE.LatheGeometry(standProf,40),mMain,null,true);
addBody('collar',new THREE.CylinderGeometry(0.026,0.026,0.015,32),mShade,new V3(0,0.2525,0),true);
const neckCurve=new THREE.QuadraticBezierCurve3(new V3(0,0.255,0),new V3(0,0.300,-0.010),new V3(0,0.330,-0.040));
addBody('neck',new THREE.TubeGeometry(neckCurve,16,0.018,16,false),mShade,null,true);

// ---------- housing ----------
const hs=addBody('housing',new THREE.SphereGeometry(1,40,28),mMain,new V3(0,0.37,-0.05),false);
hs.scale.set(0.065,0.065,0.08);
{const o=new THREE.Mesh(hs.geometry.clone(),mOutline);o.name='housing_outline';o.position.copy(hs.position);o.scale.set(0.0665,0.0665,0.0815);root.add(o);}
addBody('rearCap',new THREE.SphereGeometry(0.045,28,20),mMain,new V3(0,0.37,-0.115),true);
const nose=new THREE.CylinderGeometry(0.030,0.030,0.020,28);nose.rotateX(Math.PI/2);
addBody('nose',nose,mShade,new V3(0,0.37,0.030),true);

// ---------- rotor ----------
const rotor=new THREE.Group();rotor.name='rotor';rotor.position.set(0,0.37,0.045);root.add(rotor);
const shaft=new THREE.CylinderGeometry(0.006,0.006,0.025,12);shaft.rotateX(Math.PI/2);
addBody('shaft',shaft,mShade,new V3(0,0,-0.005),false,rotor);
const hub=new THREE.CylinderGeometry(0.028,0.028,0.020,28);hub.rotateX(Math.PI/2);
addBody('hub',hub,mMain,new V3(0,0,0.010),false,rotor);
const sp=new THREE.SphereGeometry(0.028,28,12,0,Math.PI*2,0,Math.PI/2);sp.rotateX(Math.PI/2);
const spinner=addBody('spinner',sp,mMain,new V3(0,0,0.020),false,rotor);spinner.scale.z=0.6;

const bs=new THREE.Shape();
bs.moveTo(-0.0175,0.02);
bs.bezierCurveTo(-0.03,0.07,-0.0525,0.09,-0.0525,0.108);
bs.bezierCurveTo(-0.0525,0.13,-0.025,0.14,0,0.14);
bs.bezierCurveTo(0.025,0.14,0.0525,0.13,0.0525,0.108);
bs.bezierCurveTo(0.0525,0.09,0.03,0.07,0.0175,0.02);
bs.closePath();
const bgeo=new THREE.ExtrudeGeometry(bs,{depth:0.003,bevelEnabled:true,bevelThickness:0.0006,bevelSize:0.0006,bevelSegments:1,curveSegments:14});
bgeo.translate(0,0,-0.0015);
{const p=bgeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)/0.0525;p.setZ(i,p.getZ(i)+0.010*x*x*(p.getY(i)/0.14));}}
bgeo.rotateY(25*Math.PI/180);
const bl=[];for(let k=0;k<4;k++){const g=bgeo.clone();g.rotateZ(k*Math.PI/2);g.computeVertexNormals();bl.push(g);}
addBody('blades',merge(bl),mBlade,null,false,rotor);

const blur=new THREE.Mesh(new THREE.CircleGeometry(0.14,48),new THREE.MeshBasicMaterial({color:0xF2E8DA,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
blur.name='motionBlur';blur.position.z=0.004;rotor.add(blur);

// ---------- cage ----------
const cage=new THREE.Group();cage.name='cage';cage.position.set(0,0.37,0);root.add(cage);
const rimG=[[0.145,-0.005],[0.158,0.045],[0.150,0.095]].map(a=>{const g=new THREE.TorusGeometry(a[0],0.0045,10,72);g.translate(0,0,a[1]);return g;});
addBody('cageRims',merge(rimG),mRim,null,false,cage);
const wg=[];
const tube=(pts,r)=>wg.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,r,6,false));
for(let i=0;i<16;i++){
  const a=i/16*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
  const P=(r,z)=>new V3(c*r,s*r,z);
  tube([P(0.150,0.095),P(0.09,0.115),P(0.03,0.125),P(0.0225,0.127)],0.0012);
  tube([P(0.145,-0.005),P(0.09,-0.025),P(0.035,-0.035)],0.0012);
  tube([P(0.145,-0.005),P(0.158,0.045),P(0.150,0.095)],0.0012);
}
const ir=new THREE.TorusGeometry(0.083,0.0012,6,64);ir.translate(0,0,0.118);wg.push(ir);
const rr=new THREE.TorusGeometry(0.08,0.0012,6,64);rr.translate(0,0,-0.025);wg.push(rr);
const rc=new THREE.TorusGeometry(0.035,0.003,8,32);rc.translate(0,0,-0.035);wg.push(rc);
addBody('cageWires',merge(wg),mWire,null,false,cage);
const bt=new THREE.TorusGeometry(0.0225,0.004,10,32);bt.translate(0,0,0.127);
addBody('badgeRing',bt,mRim,null,false,cage);
const bd=addBody('badgeDisc',new THREE.CircleGeometry(0.020,28),mMain,new V3(0,0,0.1275),false,cage);
[-1,1].forEach(sx=>addBody('clamp',new THREE.BoxGeometry(0.012,0.02,0.02),mShade,new V3(sx*0.035,0,-0.03),false,cage));

// ---------- shadow ----------
{
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(74,46,36,1)');g.addColorStop(0.6,'rgba(74,46,36,0.5)');g.addColorStop(1,'rgba(74,46,36,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);
  const sg=new THREE.PlaneGeometry(1,1);sg.rotateX(-Math.PI/2);
  const sm=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0.55,depthWrite:false}));
  sm.name='shadow';sm.scale.set(0.6,1,0.2);sm.position.set(0.15,0.0008,-0.06);sm.rotation.y=0.25;root.add(sm);
}

// ---------- UI (3D buttons + speed pill) ----------
const names=['Off','Low','Med','High'],pillTxt=['Speed: Off','Speed: Low','Speed: Medium','Speed: High'];
const T=[0,8,18,32],COUNT=[0,8,16,24];
let mode=0,pulse=0;
function rrect(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();}
const panel=new THREE.Group();panel.name='speedButtons';panel.position.set(0,0.02,0.26);panel.rotation.x=-1.0;root.add(panel);
const btns=[];
names.forEach((n,i)=>{
  const c=document.createElement('canvas');c.width=224;c.height=88;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(0.1,0.0393),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
  m.name='btn_'+n;m.position.x=(i-1.5)*0.11;m.userData.btn=i;panel.add(m);btns.push({c,t});
});
const pc=document.createElement('canvas');pc.width=320;pc.height=80;
const pt=new THREE.CanvasTexture(pc);pt.colorSpace=THREE.SRGBColorSpace;
const pill=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.04),new THREE.MeshBasicMaterial({map:pt,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
pill.name='speedPill';pill.position.set(-0.2,0.6,0.06);root.add(pill);
function redraw(){
  btns.forEach((b,i)=>{
    const x=b.c.getContext('2d');x.clearRect(0,0,224,88);
    const act=i===mode;
    rrect(x,3,3,218,82,16);x.fillStyle=act?'#FF3A00':'#3E2E29';x.fill();
    if(!act){x.lineWidth=3;x.strokeStyle='#C2361A';x.stroke();}
    x.fillStyle=act?'#FFFFFF':'#F3E6DA';x.font='600 34px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(names[i],112,46);
    b.t.needsUpdate=true;
  });
  const x=pc.getContext('2d');x.clearRect(0,0,320,80);
  rrect(x,2,2,316,76,38);x.fillStyle='#FF3A00';x.fill();
  x.fillStyle='#FFFFFF';x.font='bold 34px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(pillTxt[mode],160,42);
  pt.needsUpdate=true;
}
function setMode(m){mode=m;pulse=0.15;redraw();}
redraw();

// ---------- airflow ----------
const N=24;
const vs='varying float vU;uniform float uTime,uAmp,uSeed;void main(){vU=uv.x;vec3 p=position;p.x+=sin(uv.x*8.0+uTime*5.0+uSeed)*uAmp*uv.x;p.y+=cos(uv.x*7.0+uTime*4.0+uSeed*1.7)*uAmp*uv.x*0.7;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
const fs='varying float vU;uniform float uHead,uOp;void main(){float a=smoothstep(uHead-0.35,uHead-0.22,vU)*(1.0-smoothstep(uHead-0.08,uHead,vU))*smoothstep(0.0,0.08,vU);gl_FragColor=vec4(mix(vec3(0.525,0.78,0.871),vec3(0.718,0.878,0.933),vU),a*uOp);}';
const ribbons=[];
let s=0;
function rebuild(r){
  const reach=0.3+0.7*Math.max(s,0.2),spread=(6+16*Math.max(s,0.2))*Math.PI/180;
  const ang=rng()*Math.PI*2,rad=rng()*0.03,x0=Math.cos(ang)*rad,y0=0.37+Math.sin(ang)*rad,z0=0.13;
  const amp=(0.02+rng()*0.04)*(0.5+0.5*Math.max(s,0.2)),ph=rng()*6.28,da=rng()*6.28,ts=Math.tan(spread*rng());
  const pts=[];
  for(let i=0;i<6;i++){
    const t=i/5;
    pts.push(new V3(x0+Math.cos(da)*ts*reach*t+amp*Math.sin(ph+t*6)*t,y0+Math.sin(da)*ts*reach*t+amp*0.7*Math.cos(ph*1.3+t*5)*t,z0+reach*t));
  }
  if(r.hook){pts[4].y-=0.03;pts[5]=pts[4].clone().add(new V3(0.01,-0.05,-0.04));}
  if(r.mesh.geometry)r.mesh.geometry.dispose();
  r.mesh.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),64,r.rad,5,false);
}
for(let i=0;i<N;i++){
  const mat=new THREE.ShaderMaterial({vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{uTime:{value:0},uAmp:{value:0.01},uSeed:{value:rng()*6.28},uHead:{value:0},uOp:{value:0}}});
  const mesh=new THREE.Mesh(new THREE.BufferGeometry(),mat);mesh.name='airflow_'+i;mesh.visible=false;mesh.frustumCulled=false;
  const r={mesh,mat,p:i/N,f:0,hook:rng()<0.25,rad:rng()<0.3?0.006:0.0025};
  rebuild(r);root.add(mesh);ribbons.push(r);
}

// ---------- animation ----------
let w=0,time=0;
function update(dt,el){
  dt=Math.min(dt,0.05);time+=dt;
  const tgt=T[mode];
  w+=(tgt-w)*(1-Math.exp(-dt/(tgt>w?0.6:1.4)));
  if(w<0.01&&tgt===0)w=0;
  s=w/32;
  rotor.rotation.z+=w*dt;
  blur.material.opacity=0.35*s;
  // vibration at high
  const vib=0.0006*s*s*Math.sin(time*Math.PI*60);
  rotor.position.y=0.37+vib;cage.position.y=0.37+vib;
  // pill pulse
  if(pulse>0){pulse=Math.max(0,pulse-dt);pill.scale.setScalar(1+0.08*Math.sin(Math.PI*(1-pulse/0.15)));}
  // airflow
  const rate=0.3+1.2*s,op=(0.35+0.55*s)*Math.min(1,s*6),amp=0.004+0.024*s;
  for(let i=0;i<N;i++){
    const r=ribbons[i];
    const active=i<COUNT[mode];
    r.f+=((active?1:0)-r.f)*Math.min(1,dt/0.25*(active?1:1.2));
    if(!active&&r.f<0.01)r.f=0;
    if(r.f<=0||s<0.01){r.mesh.visible=false;continue;}
    r.mesh.visible=true;
    r.p+=dt*rate;
    if(r.p>=1){r.p-=1;rebuild(r);}
    const u=r.mat.uniforms;
    u.uHead.value=r.p*1.35;u.uOp.value=op*r.f;u.uAmp.value=amp;u.uTime.value=time;
  }
}
function onClick(hit){
  const o=hit.object;
  if(o.userData.btn!==undefined)setMode(o.userData.btn);
  else if(o.userData.knob)setMode((mode+1)%4);
}
function isClickable(hit){return hit.object.userData.btn!==undefined||!!hit.object.userData.knob;}

return {root,update,onClick,isClickable,hoverLabel:'Click a button or the knob to change speed'};
}).call(null, THREE, ctx);
const __add = (function (THREE, ctx, base) {
// MODE: PATCH
const root = base.root, V3 = THREE.Vector3;
const rotor = root.getObjectByName('rotor');

// remove the old narrow airflow
const old = [];
root.traverse(o => { if (o.name && o.name.indexOf('airflow_') === 0) old.push(o); });
old.forEach(o => { root.remove(o); if (o.geometry) o.geometry.dispose(); });

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(777);
const frac = x => x - Math.floor(x);
const N = 48, COUNT = [0, 16, 32, 48];
let mode = 0, s = 0, time = 0, lastRot = rotor.rotation.z;

const vs='varying float vU;uniform float uTime,uAmp,uSeed;void main(){vU=uv.x;vec3 p=position;p.x+=sin(uv.x*8.0+uTime*5.0+uSeed)*uAmp*uv.x;p.y+=cos(uv.x*7.0+uTime*4.0+uSeed*1.7)*uAmp*uv.x*0.7;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
const fs='varying float vU;uniform float uHead,uOp;void main(){float a=smoothstep(uHead-0.35,uHead-0.22,vU)*(1.0-smoothstep(uHead-0.08,uHead,vU))*smoothstep(0.0,0.08,vU);gl_FragColor=vec4(mix(vec3(0.525,0.78,0.871),vec3(0.718,0.878,0.933),vU),a*uOp);}';

const ribbons = [];
function rebuild(r) {
  const sm = Math.max(s, 0.2);
  const reach = 0.4 + 0.8 * sm;
  const k = 0.08 + 0.25 * s, k2 = 0.01 + 0.02 * s, swirl = 0.6 * s;
  const rad0 = Math.max(0, r.slotRad + (rng() * 2 - 1) * 0.008);
  const ang0 = r.slotAng + (rng() * 2 - 1) * 0.12;
  const amp = (0.008 + rng() * 0.017) * (0.5 + 0.5 * sm);
  const ph = rng() * 6.28, z0 = 0.13;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const rr = rad0 * (1 + k * t) + k2 * t;
    const th = ang0 + swirl * t;
    const w1 = amp * Math.sin(ph + t * 6) * t, w2 = amp * 0.7 * Math.cos(ph * 1.3 + t * 5) * t;
    pts.push(new V3(rr * Math.cos(th) + w1, Math.max(0.03, 0.37 + rr * Math.sin(th) + w2), z0 + reach * t));
  }
  if (r.hook) {
    pts[4].y = Math.max(0.03, pts[4].y - 0.03);
    pts[5] = pts[4].clone().add(new V3(0.01, -0.05, -0.04));
    pts[5].y = Math.max(0.03, pts[5].y);
  }
  if (r.mesh.geometry) r.mesh.geometry.dispose();
  r.mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r.rad, 4, false);
}
for (let i = 0; i < N; i++) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.01 }, uSeed: { value: rng() * 6.28 }, uHead: { value: 0 }, uOp: { value: 0 } }
  });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.name = 'airflow_' + i; mesh.visible = false; mesh.frustumCulled = false;
  const thick = rng() < 0.3;
  const slotRad = 0.150 * Math.sqrt(frac((i + 0.5) * 0.618034));
  const r = {
    mesh, mat, p: frac(i * 0.381966), f: 0, hook: rng() < 0.25,
    rad: thick ? 0.005 : 0.0022,
    gain: (thick ? 1 : 0.85) * (slotRad < 0.04 ? 0.75 : 1),
    slotAng: i * 2.39996, slotRad
  };
  rebuild(r); root.add(mesh); ribbons.push(r);
}

function update(dt, el) {
  dt = Math.min(dt, 0.05); if (dt <= 0) return;
  time += dt;
  const rz = rotor.rotation.z;
  const w = Math.max(0, (rz - lastRot) / dt); lastRot = rz;
  s = Math.min(1, w / 32);
  const rate = 0.3 + 1.2 * s, op = (0.35 + 0.55 * s) * Math.min(1, s * 6), amp = 0.004 + 0.024 * s;
  for (let i = 0; i < N; i++) {
    const r = ribbons[i];
    const active = i < COUNT[mode];
    r.f += ((active ? 1 : 0) - r.f) * Math.min(1, dt / 0.25 * (active ? 1 : 1.2));
    if (!active && r.f < 0.01) r.f = 0;
    if (r.f <= 0 || s < 0.01) { r.mesh.visible = false; continue; }
    r.mesh.visible = true;
    r.p += dt * rate;
    if (r.p >= 1) { r.p -= 1; rebuild(r); }
    const u = r.mat.uniforms;
    u.uHead.value = r.p * 1.35; u.uOp.value = op * r.f * r.gain; u.uAmp.value = amp; u.uTime.value = time;
  }
}
function onClick(hit) {
  const o = hit.object;
  if (o.userData.btn !== undefined) mode = o.userData.btn;
  else if (o.userData.knob) mode = (mode + 1) % 4;
}

return { update, onClick };
}).call(null, THREE, ctx, __base) || {};
const __chain = (a, b) => (a && b ? function (...args) { a.apply(this, args); b.apply(this, args); } : a || b);
return {
  root: __base.root,
  update: __chain(__base.update, __add.update),
  onClick: __chain(__base.onClick, __add.onClick),
  hoverLabel: __add.hoverLabel || __base.hoverLabel,
  isClickable: __add.isClickable && __base.isClickable ? (h) => __add.isClickable(h) || __base.isClickable(h) : __add.isClickable || __base.isClickable,
};
}).call(null, THREE, ctx);
const __add = (function (THREE, ctx, base) {
// MODE: PATCH
const root = base.root;
const isAir = o => !!o.name && (o.name.indexOf('airflow_') === 0 || o.name === 'motionBlur');
const noShadow = () => root.traverse(o => {
  if (isAir(o)) { o.castShadow = false; o.receiveShadow = false; }
});
noShadow();
let first = true;
function update() {
  if (first) { first = false; noShadow(); }
}
return { update };
}).call(null, THREE, ctx, __base) || {};
const __chain = (a, b) => (a && b ? function (...args) { a.apply(this, args); b.apply(this, args); } : a || b);
return {
  root: __base.root,
  update: __chain(__base.update, __add.update),
  onClick: __chain(__base.onClick, __add.onClick),
  hoverLabel: __add.hoverLabel || __base.hoverLabel,
  isClickable: __add.isClickable && __base.isClickable ? (h) => __add.isClickable(h) || __base.isClickable(h) : __add.isClickable || __base.isClickable,
};
}).call(null, THREE, ctx);
const __add = (function (THREE, ctx, base) {
// MODE: PATCH
const root = base.root, V3 = THREE.Vector3;
const rotor = root.getObjectByName('rotor');

const old = [];
root.traverse(o => { if (o.name && o.name.indexOf('airflow_') === 0) old.push(o); });
old.forEach(o => { root.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(4242);
const frac = x => x - Math.floor(x);
const N = 48, COUNT = [0, 16, 32, 48];
let mode = 0, s = 0, time = 0, P = 0, wasOn = false, lastRot = rotor.rotation.z, first = true;

const vs = 'varying float vU;uniform float uTime,uAmp;void main(){vU=uv.x;vec3 p=position;p.x+=sin(uv.x*8.0+uTime*5.0)*uAmp*uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
const fs = 'varying float vU;uniform float uHead,uOp;void main(){float a=smoothstep(uHead-0.35,uHead-0.22,vU)*(1.0-smoothstep(uHead-0.08,uHead,vU))*smoothstep(0.0,0.08,vU);gl_FragColor=vec4(mix(vec3(0.525,0.78,0.871),vec3(0.718,0.878,0.933),vU),a*uOp);}';

const ribbons = [];
function rebuild(r) {
  const reach = 0.4 + 0.8 * Math.max(s, 0.2);
  const rad = Math.min(0.155, Math.max(0, r.slotRad + (rng() * 2 - 1) * 0.004));
  const ang = r.slotAng + (rng() * 2 - 1) * 0.05;
  const x0 = rad * Math.cos(ang), y0 = Math.max(0.03, 0.37 + rad * Math.sin(ang));
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push(new V3(x0, y0, 0.13 + reach * i / 5));
  if (r.mesh.geometry) r.mesh.geometry.dispose();
  r.mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r.rad, 4, false);
}
for (let i = 0; i < N; i++) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.002 }, uHead: { value: 0 }, uOp: { value: 0 } }
  });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.name = 'airflow_' + i; mesh.visible = false; mesh.frustumCulled = false;
  mesh.castShadow = false; mesh.receiveShadow = false;
  const thick = rng() < 0.3;
  const slotRad = 0.150 * Math.sqrt(frac((i + 0.5) * 0.618034));
  const r = {
    mesh, mat, f: 0, rad: thick ? 0.005 : 0.0022,
    gain: (thick ? 1 : 0.85) * (slotRad < 0.04 ? 0.75 : 1),
    slotAng: i * 2.39996, slotRad
  };
  rebuild(r); root.add(mesh); ribbons.push(r);
}

function noShadow() {
  root.traverse(o => {
    if (o.name && (o.name.indexOf('airflow_') === 0 || o.name === 'motionBlur')) { o.castShadow = false; o.receiveShadow = false; }
  });
}

function update(dt) {
  dt = Math.min(dt, 0.05); if (dt <= 0) return;
  if (first) { first = false; noShadow(); }
  time += dt;
  const rz = rotor.rotation.z;
  const w = Math.max(0, (rz - lastRot) / dt); lastRot = rz;
  s = Math.min(1, w / 32);
  const on = s > 0.01;
  if (on && !wasOn) { P = 0; ribbons.forEach(rebuild); }
  wasOn = on;
  const rate = 0.3 + 1.2 * s, op = (0.35 + 0.55 * s) * Math.min(1, s * 6), amp = 0.002 + 0.003 * s;
  if (on) {
    P += dt * rate;
    if (P >= 1) { P -= 1; ribbons.forEach(rebuild); }
  }
  for (let i = 0; i < N; i++) {
    const r = ribbons[i];
    const active = i < COUNT[mode];
    r.f += ((active ? 1 : 0) - r.f) * Math.min(1, dt / 0.25 * (active ? 1 : 1.2));
    if (!active && r.f < 0.01) r.f = 0;
    if (r.f <= 0 || !on) { r.mesh.visible = false; continue; }
    r.mesh.visible = true;
    const u = r.mat.uniforms;
    u.uHead.value = P * 1.35; u.uOp.value = op * r.f * r.gain; u.uAmp.value = amp; u.uTime.value = time;
  }
}
function onClick(hit) {
  const o = hit.object;
  if (o.userData.btn !== undefined) mode = o.userData.btn;
  else if (o.userData.knob) mode = (mode + 1) % 4;
}

return { update, onClick };
}).call(null, THREE, ctx, __base) || {};
const __chain = (a, b) => (a && b ? function (...args) { a.apply(this, args); b.apply(this, args); } : a || b);
return {
  root: __base.root,
  update: __chain(__base.update, __add.update),
  onClick: __chain(__base.onClick, __add.onClick),
  hoverLabel: __add.hoverLabel || __base.hoverLabel,
  isClickable: __add.isClickable && __base.isClickable ? (h) => __add.isClickable(h) || __base.isClickable(h) : __add.isClickable || __base.isClickable,
};
}).call(null, THREE, ctx);
const __add = (function (THREE, ctx, base) {
// MODE: PATCH
const root = base.root, V3 = THREE.Vector3;
const rotor = root.getObjectByName('rotor');

const old = [];
root.traverse(o => { if (o.name && o.name.indexOf('airflow_') === 0) old.push(o); });
old.forEach(o => { root.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(9157);
const frac = x => x - Math.floor(x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const COUNT = [0, 10, 20, 30];
let mode = 0, s = 0, time = 0, P = 0, wasOn = false, first = true, ringF = 0;
let lastRot = rotor.rotation.z;

const TPL = {
  A: [[0,0],[0.25,0.01],[0.5,0.025],[0.75,0.045],[1,0.07]],
  B: [[0,0],[0.3,0],[0.6,-0.015],[0.82,-0.05],[0.9,-0.11],[0.84,-0.17],[0.78,-0.19]],
  C: [[0,0],[0.35,-0.01],[0.65,-0.04],[0.75,-0.14],[0.74,-0.26],[0.70,-0.30]],
  D: [[0,0],[0.22,-0.02],[0.32,-0.09],[0.28,-0.22],[0.15,-0.36],[0.02,-0.46]],
  E: [[0,0],[0.15,0.01],[0.3,-0.03],[0.38,-0.09],[0.34,-0.14],[0.40,-0.16]],
  F: [[0,0],[0.35,0.02],[0.7,0.07],[0.95,0.13]],
  G: [[0,0],[0.25,0.006],[0.5,-0.004],[0.75,0.005],[1,0]]
};
const ORDER = ('ABGCDEFBGG' + 'ABGCDEFBGG' + 'ABEFFFGGGG').split('');
const TYPE = {
  A: { r: 0.0034, g: 1.0, c: 0x7FBFDA }, B: { r: 0.0034, g: 1.0, c: 0x7FBFDA },
  C: { r: 0.0034, g: 1.0, c: 0x7FBFDA }, D: { r: 0.0034, g: 1.0, c: 0x7FBFDA },
  E: { r: 0.0022, g: 0.9, c: 0x8CC8DF }, F: { r: 0.0011, g: 0.65, c: 0xA6D5E8 },
  G: { r: 0.0011, g: 0.65, c: 0xA6D5E8 }
};

const vs = 'varying float vU;uniform float uTime,uAmp;void main(){vU=uv.x;vec3 p=position;p.y+=sin(uv.x*9.0+uTime*6.0)*uAmp*smoothstep(0.6,1.0,uv.x);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
const fs = 'varying float vU;uniform float uHead,uTail,uOp;uniform vec3 uColor;void main(){float a=smoothstep(uTail,uTail+0.05,vU)*(1.0-smoothstep(uHead-0.04,uHead,vU))*uOp;gl_FragColor=vec4(mix(uColor,vec3(0.718,0.878,0.933),vU*0.4),a);}';
function mkMat(col) {
  return new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.003 }, uHead: { value: 0 }, uTail: { value: 0 }, uOp: { value: 0 }, uColor: { value: new THREE.Color(col) } }
  });
}
function mkMesh(name, mat) {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  m.name = name; m.visible = false; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
  root.add(m); return m;
}
function tube(curve, segs, rad) {
  const g = new THREE.TubeGeometry(curve, segs, rad, 5, false);
  const p = g.attributes.position, R = 6;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, c = curve.getPointAt(u);
    let f = 0.2 + 0.8 * Math.pow(Math.sin(Math.PI * u), 0.6);
    if (u > 0.8) f *= 0.85;
    for (let j = 0; j < R; j++) {
      const k = i * R + j;
      p.setXYZ(k, c.x + (p.getX(k) - c.x) * f, c.y + (p.getY(k) - c.y) * f, c.z + (p.getZ(k) - c.z) * f);
    }
  }
  p.needsUpdate = true;
  return g;
}

const ribbons = [];
let tickN = 0, fN = 0;
function rebuild(r) {
  const L = 0.22 + 0.33 * s, droop = 1.25 - 0.5 * s;
  const rad = Math.min(0.152, Math.max(0, r.slotRad + (rng() * 2 - 1) * 0.004));
  const ang = r.slotAng + (rng() * 2 - 1) * 0.05;
  const x0 = rad * Math.cos(ang), y0 = 0.37 + rad * Math.sin(ang);
  const lf = 0.8 + 0.3 * rng();
  const ymax = Math.max(0.48, y0);
  const pts = TPL[r.type].map((q, i, a) => {
    const dy = q[1] < 0 ? q[1] * droop : q[1];
    const z = Math.min(0.13 + Math.max(0, q[0]) * L * lf, 0.13 + L * 1.05);
    const y = clamp(y0 + dy * L * lf + (i ? (rng() * 2 - 1) * 0.006 : 0), 0.05, ymax);
    const x = x0 + (i === a.length - 1 ? (rng() * 2 - 1) * 0.01 : 0);
    return new V3(x, y, Math.max(0.13, z));
  });
  const rm = TYPE[r.type].r * (0.85 + 0.3 * s);
  if (r.mesh.geometry) r.mesh.geometry.dispose();
  r.mesh.geometry = tube(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 56, rm);
  if (r.tick) {
    const e = pts[pts.length - 1];
    const lc = new THREE.LineCurve3(e.clone(), e.clone().add(new V3(0, 0.0155, -0.0126)));
    if (r.tick.mesh.geometry) r.tick.mesh.geometry.dispose();
    r.tick.mesh.geometry = tube(lc, 6, 0.0011 * (0.85 + 0.3 * s));
  }
}
for (let i = 0; i < 30; i++) {
  const type = ORDER[i], T = TYPE[type];
  const g = frac((i + 0.5) * 0.618034);
  const slotRad = (i % 5) < 3 ? 0.09 * Math.sqrt(g) : 0.09 + 0.06 * g;
  const mat = mkMat(T.c);
  const r = { type, gain: T.g, f: 0, slotRad, slotAng: i * 2.39996, mat, mesh: mkMesh('airflow_' + i, mat), tick: null };
  if (type === 'F') {
    if (fN % 3 === 0) {
      const tm = mkMat(T.c);
      r.tick = { mat: tm, mesh: mkMesh('airflow_tick_' + (tickN++), tm) };
    }
    fN++;
  }
  rebuild(r); ribbons.push(r);
}

const ringMat = new THREE.MeshBasicMaterial({ color: 0x86C7DE, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
const rings = [0.026, 0.034].map((rd, i) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(rd, 0.0012, 6, 48), ringMat);
  m.name = 'airflow_ring_' + i; m.position.set(0, 0.37, 0.132); m.visible = false;
  m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false;
  root.add(m); return m;
});

function noShadow() {
  root.traverse(o => { if (o.name && (o.name.indexOf('airflow_') === 0 || o.name === 'motionBlur')) { o.castShadow = false; o.receiveShadow = false; } });
}
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function update(dt) {
  dt = Math.min(dt, 0.05); if (dt <= 0) return;
  if (first) { first = false; noShadow(); }
  time += dt;
  const rz = rotor.rotation.z;
  const w = Math.max(0, (rz - lastRot) / dt); lastRot = rz;
  s = Math.min(1, w / 32);
  const on = s > 0.01;
  if (on && !wasOn) { P = 0; ribbons.forEach(rebuild); }
  wasOn = on;
  if (on) {
    P += dt * (0.5 + 0.9 * s);
    if (P >= 1) { P -= 1; ribbons.forEach(rebuild); }
  }
  const head = clamp(P * 1.7, 0, 1), tail = clamp((P - 0.38) * 1.7, 0, 1);
  const base = (0.45 + 0.5 * s) * Math.min(1, 6 * s), amp = 0.002 + 0.004 * s;
  for (let i = 0; i < 30; i++) {
    const r = ribbons[i], active = i < COUNT[mode];
    r.f += ((active ? 1 : 0) - r.f) * (1 - Math.exp(-dt / (active ? 0.25 : 0.8)));
    if (!active && r.f < 0.01) r.f = 0;
    const vis = r.f > 0 && on;
    r.mesh.visible = vis;
    if (r.tick) r.tick.mesh.visible = vis;
    if (!vis) continue;
    const u = r.mat.uniforms;
    u.uHead.value = head; u.uTail.value = tail; u.uAmp.value = amp; u.uTime.value = time;
    u.uOp.value = base * r.gain * r.f;
    if (r.tick) {
      const t = r.tick.mat.uniforms;
      t.uHead.value = head; t.uTail.value = tail; t.uAmp.value = 0; t.uTime.value = time;
      t.uOp.value = base * r.gain * r.f * sstep(0.4, 0.55, P);
    }
  }
  ringF += ((mode > 0 ? 1 : 0) - ringF) * (1 - Math.exp(-dt / 0.4));
  const ro = on ? 0.7 * Math.sin(Math.PI * P) * Math.min(1, 6 * s) * ringF : 0;
  ringMat.opacity = ro;
  rings.forEach(m => { m.visible = ro > 0.005; });
}
function onClick(hit) {
  const o = hit.object;
  if (o.userData.btn !== undefined) mode = o.userData.btn;
  else if (o.userData.knob) mode = (mode + 1) % 4;
}

return { update, onClick };
}).call(null, THREE, ctx, __base) || {};
const __chain = (a, b) => (a && b ? function (...args) { a.apply(this, args); b.apply(this, args); } : a || b);
return {
  root: __base.root,
  update: __chain(__base.update, __add.update),
  onClick: __chain(__base.onClick, __add.onClick),
  hoverLabel: __add.hoverLabel || __base.hoverLabel,
  isClickable: __add.isClickable && __base.isClickable ? (h) => __add.isClickable(h) || __base.isClickable(h) : __add.isClickable || __base.isClickable,
};
}).call(null, THREE, ctx);
const __add = (function (THREE, ctx, base) {
// MODE: PATCH
const root = base.root, V3 = THREE.Vector3;
const rotor = root.getObjectByName('rotor');

const old = [];
root.traverse(o => { if (o.name && o.name.indexOf('airflow_') === 0) old.push(o); });
old.forEach(o => { if (o.parent) o.parent.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(31337);
const frac = x => x - Math.floor(x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const COUNT = [0, 10, 20, 30];
let mode = 0, s = 0, time = 0, first = true, ringF = 0;
let lastRot = rotor.rotation.z;

const TPL = {
  A: [[0,0],[0.1,0],[0.35,0.012],[0.6,0.03],[0.8,0.05],[1,0.07]],
  B: [[0,0],[0.1,0],[0.35,0],[0.6,-0.015],[0.8,-0.05],[0.92,-0.10],[0.97,-0.16],[0.96,-0.20]],
  C: [[0,0],[0.1,0],[0.4,-0.01],[0.65,-0.04],[0.82,-0.12],[0.92,-0.24],[0.97,-0.34]],
  D: [[0,0],[0.1,0],[0.28,-0.015],[0.45,-0.05],[0.6,-0.12],[0.72,-0.22],[0.82,-0.34]],
  E: [[0,0],[0.1,0],[0.25,0.01],[0.42,-0.03],[0.6,-0.07],[0.78,-0.10],[0.9,-0.14]],
  F: [[0,0],[0.1,0],[0.4,0.02],[0.7,0.07],[0.95,0.13]],
  G: [[0,0],[0.1,0],[0.35,0.006],[0.6,-0.004],[0.8,0.005],[1,0]]
};
const ORDER = ('ABGCDEFBGG' + 'ABGCDEFBGG' + 'ABEFFFGGGG').split('');
const TYPE = {
  A: { r: 0.0034, g: 1.0, c: 0x7FBFDA }, B: { r: 0.0034, g: 1.0, c: 0x7FBFDA },
  C: { r: 0.0034, g: 1.0, c: 0x7FBFDA }, D: { r: 0.0034, g: 1.0, c: 0x7FBFDA },
  E: { r: 0.0022, g: 0.9, c: 0x8CC8DF }, F: { r: 0.0011, g: 0.65, c: 0xA6D5E8 },
  G: { r: 0.0011, g: 0.65, c: 0xA6D5E8 }
};

const vs = 'varying float vU;uniform float uTime,uAmp;void main(){vU=uv.x;vec3 p=position;p.y+=sin(uv.x*10.0-uTime*7.0)*uAmp*smoothstep(0.3,1.0,uv.x);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
const fs = 'varying float vU;uniform float uC,uW,uOp;uniform vec3 uColor;void main(){float rise=smoothstep(uC-uW,uC-0.6*uW,vU);float fall=1.0-smoothstep(uC-0.35*uW,uC,vU);float em=smoothstep(0.0,0.08,vU);float lv=1.0-smoothstep(0.88,1.0,vU);float a=rise*fall*em*lv*uOp;gl_FragColor=vec4(mix(uColor,vec3(0.718,0.878,0.933),vU*0.4),a);}';
function mkMat(col) {
  return new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.003 }, uC: { value: 0 }, uW: { value: 0.4 }, uOp: { value: 0 }, uColor: { value: new THREE.Color(col) } }
  });
}
function mkMesh(name, mat) {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  m.name = name; m.visible = false; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
  root.add(m); return m;
}
function tube(curve, segs, rad) {
  const g = new THREE.TubeGeometry(curve, segs, rad, 4, false);
  const p = g.attributes.position, R = 5;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, c = curve.getPointAt(u);
    let f = 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * u), 0.5);
    if (u > 0.8) f *= 0.85;
    for (let j = 0; j < R; j++) {
      const k = i * R + j;
      p.setXYZ(k, c.x + (p.getX(k) - c.x) * f, c.y + (p.getY(k) - c.y) * f, c.z + (p.getZ(k) - c.z) * f);
    }
  }
  p.needsUpdate = true;
  return g;
}

const ribbons = [];
let tickN = 0, fN = 0;
function rebuild(r) {
  const L = (0.40 + 0.50 * s) * (0.8 + 0.3 * rng());
  const Lv = 0.30 + 0.25 * s, droop = 1.25 - 0.5 * s;
  r.L = L;
  const rad = clamp(r.slotRad + (rng() * 2 - 1) * 0.004, 0, 0.165);
  const ang = r.slotAng + (rng() * 2 - 1) * 0.03;
  const x0 = rad * Math.cos(ang), y0 = 0.37 + rad * Math.sin(ang);
  const back = r.type === 'B' ? 0.04 * L : 0;
  let zmax = 0.13;
  const pts = TPL[r.type].map((q, i) => {
    const dy = (q[1] < 0 ? q[1] * droop : q[1]) * Lv;
    let z = 0.13 + q[0] * L;
    z = Math.max(z, zmax - back); zmax = Math.max(zmax, z);
    const y = clamp(y0 + dy + (i > 1 ? (rng() * 2 - 1) * 0.006 : 0), 0.06, 0.50);
    const x = x0 * (1 + 0.08 * q[0] * q[0]);
    return new V3(x, y, z);
  });
  const rm = TYPE[r.type].r * (0.85 + 0.3 * s);
  if (r.mesh.geometry) r.mesh.geometry.dispose();
  r.mesh.geometry = tube(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 72, rm);
  if (r.tick) {
    const e = pts[pts.length - 1];
    const lc = new THREE.LineCurve3(e.clone(), e.clone().add(new V3(0, 0.0155, -0.0126)));
    if (r.tick.mesh.geometry) r.tick.mesh.geometry.dispose();
    r.tick.mesh.geometry = tube(lc, 6, 0.0011 * (0.85 + 0.3 * s));
  }
}
for (let i = 0; i < 30; i++) {
  const type = ORDER[i], T = TYPE[type];
  const g = frac((i + 0.5) * 0.618034);
  const slotRad = (i % 5) < 3 ? 0.09 * Math.sqrt(g) : 0.09 + 0.06 * g;
  const mat = mkMat(T.c);
  const r = { type, gain: T.g, f: 0, P: rng(), spd: 0.85 + 0.3 * rng(), L: 0.4, slotRad, slotAng: i * 2.39996, mat, mesh: mkMesh('airflow_' + i, mat), tick: null };
  if (type === 'F') {
    if (fN % 3 === 0) {
      const tm = mkMat(T.c);
      r.tick = { mat: tm, mesh: mkMesh('airflow_tick_' + (tickN++), tm) };
    }
    fN++;
  }
  rebuild(r); ribbons.push(r);
}

const rings = [0, 1].map(i => {
  const mat = new THREE.MeshBasicMaterial({ color: 0x86C7DE, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.TorusGeometry(i ? 0.034 : 0.026, 0.0012, 6, 48), mat);
  m.name = 'airflow_ring_' + i; m.position.set(0, 0.37, 0.132); m.visible = false;
  m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false;
  root.add(m); return m;
});
let Pr = 0;

function noShadow() {
  root.traverse(o => { if (o.name && (o.name.indexOf('airflow_') === 0 || o.name === 'motionBlur')) { o.castShadow = false; o.receiveShadow = false; } });
}

function update(dt) {
  dt = Math.min(dt, 0.05); if (dt <= 0) return;
  if (first) { first = false; noShadow(); }
  time += dt;
  const rz = rotor.rotation.z;
  const w = Math.max(0, (rz - lastRot) / dt); lastRot = rz;
  s = Math.min(1, w / 32);
  const on = s > 0.01;
  const v = 0.35 + 0.9 * s;
  const gate = Math.min(1, 6 * s), amp = 0.002 + 0.004 * s;
  const base0 = (0.45 + 0.5 * s) * gate;
  for (let i = 0; i < 30; i++) {
    const r = ribbons[i], active = i < COUNT[mode];
    r.f += ((active ? 1 : 0) - r.f) * (1 - Math.exp(-dt / (active ? 0.25 : 0.8)));
    if (!active && r.f < 0.01) r.f = 0;
    const vis = r.f > 0 && on;
    r.mesh.visible = vis;
    if (r.tick) r.tick.mesh.visible = vis;
    if (!on) continue;
    r.P += dt * v * r.spd / (r.L * 1.4);
    if (r.P >= 1) { r.P -= 1; rebuild(r); }
    if (!vis) continue;
    const c = r.P * 1.4;
    const u = r.mat.uniforms;
    u.uC.value = c; u.uW.value = 0.4; u.uAmp.value = amp; u.uTime.value = time;
    u.uOp.value = base0 * r.gain * r.f;
    if (r.tick) {
      const t = r.tick.mat.uniforms;
      t.uC.value = 1.5; t.uW.value = 4; t.uAmp.value = 0; t.uTime.value = time;
      t.uOp.value = base0 * r.gain * r.f * sstep(0.85, 1.0, c) * (1 - sstep(1.0, 1.4, c));
    }
  }
  ringF += ((mode > 0 ? 1 : 0) - ringF) * (1 - Math.exp(-dt / 0.4));
  if (on) Pr = frac(Pr + dt * (0.5 + 0.9 * s));
  rings.forEach((m, i) => {
    const ph = frac(Pr + i * 0.5);
    const op = on ? 0.7 * Math.sin(Math.PI * ph) * gate * ringF : 0;
    m.material.opacity = op;
    m.position.z = 0.132 + 0.19 * ph;
    m.visible = op > 0.005;
  });
}
function onClick(hit) {
  const o = hit.object;
  if (o.userData.btn !== undefined) mode = o.userData.btn;
  else if (o.userData.knob) mode = (mode + 1) % 4;
}

return { update, onClick };
}).call(null, THREE, ctx, __base) || {};
const __chain = (a, b) => (a && b ? function (...args) { a.apply(this, args); b.apply(this, args); } : a || b);
return {
  root: __base.root,
  update: __chain(__base.update, __add.update),
  onClick: __chain(__base.onClick, __add.onClick),
  hoverLabel: __add.hoverLabel || __base.hoverLabel,
  isClickable: __add.isClickable && __base.isClickable ? (h) => __add.isClickable(h) || __base.isClickable(h) : __add.isClickable || __base.isClickable,
};
}


export function createFanModel(): FanRuntime {
  const result = (createRetroDeskFan as any)(THREE, { canvas: null });
  return {
    root: result.root,
    tick: (delta: number, elapsed: number) => {
      if (result.update) result.update(delta, elapsed);
    },
    onClick: (hit: THREE.Intersection) => {
      if (result.onClick) result.onClick(hit);
    },
    isClickable: (hit: THREE.Intersection) => {
      if (result.isClickable) return Boolean(result.isClickable(hit));
      const o = hit.object;
      return o.userData?.btn !== undefined || Boolean(o.userData?.knob);
    },
    setSpeed: (modeIndex: number) => {
      let target: THREE.Object3D | null = null;
      result.root.traverse((o: any) => {
        if (o.userData?.btn === modeIndex) target = o;
      });
      if (target && result.onClick) {
        result.onClick({ object: target, point: target.position } as any);
      }
    },
  };
}
