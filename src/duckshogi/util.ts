import * as Immutable from 'immutable';

export const TPI = 2*Math.PI;
export const INTERVAL = 100;
export const W = 3;
export const H = 4;
export const R = 30;
export const MERGINX = 20;
export const MERGINY = 100;

export const p2ij = ( p:number ) => {
  return {
    i: p%W,
    j: Math.floor(p/W) }};

export const p2northwestXY = ( p:number) =>
  p<12? {
    x: p2ij(p).i*INTERVAL + MERGINX,
    y: p2ij(p).j*INTERVAL + MERGINY } :
  (12<=p && p<15)? {
    x: p2ij(p).i*INTERVAL + MERGINX,
    y: -INTERVAL + MERGINY } :
  (15<=p && p<18)? {
    x: p2ij(p).i*INTERVAL + MERGINX,
    y: 4*INTERVAL + MERGINY } : {x:-100,y:-100};

export const p2centerXY = ( p:number ) =>
  p<12? {
    x: (p2ij(p).i+0.5)*INTERVAL + MERGINX,
    y: (p2ij(p).j+0.5)*INTERVAL + MERGINY } :
  (12<=p && p<15)? {
    x: (p2ij(p).i+0.5)*INTERVAL + MERGINX,
    y: -0.5*INTERVAL + MERGINY } :
  (15<=p && p<18)? {
    x: (p2ij(p).i+0.5)*INTERVAL + MERGINX,
    y: 4.5*INTERVAL + MERGINY } : {x:-100,y:-100};

export const L2 = (x:number,y:number) => Math.sqrt( x*x + y*y );

export const mouse2p = ( mouseX:number, mouseY:number) => {
  return ( Immutable.Range(0,18).toArray()
    .map( a => p2centerXY(a) )
    .map( (a,idx) => Math.floor( L2( a.x-mouseX, a.y-mouseY )*1000 )*1000 +idx )
    .reduce( (a,b) => Math.min(a, b) )
  )%1000 };

export const PIECES = {
  "Lion": 1,
  "Elephant": 2,
  "Giraffe": 4,
  "Chick": 8,
  "Hen": 16,
}

const moving = ( s:string ) =>
  s=="northwest"? -1-W:
  s=="north"? -W:
  s=="northeast"? 1-W:
  s=="west"? -1:
  s=="right"? 1:
  s=="southwest"? -1+W:
  s=="south"? W:
  s=="southeast"? 1+W: 0

const canMove = ( n:number ) =>
  /*Lion*/     n==1?  [ "northwest","north","northeast","west","right","southwest","south","southeast" ] :
  /*Elephant*/ n==2?  [ "northwest","northeast","southwest","southeast" ] :
  /*Giraffe*/  n==4?  [ "north","west","right","south" ] :
  /*Chick*/    n==8?  [ "north" ] :
  /*Hen*/      n==16? [ "northwest","north","northeast","west","right","south" ] : []

export const p2ij4moving = ( n:number ) => {
  return {
    i: (n%W+W)%W==2? -1: (n%W+W)%W,
    j: -4<=n&&n<-1? -1: -1<=n&&n<2? 0: 1 }};

export const willPosition = ( duck:number, p:number ) => {
  const d = duck>0? [duck,1]:[Math.abs(duck),-1]
  return canMove(d[0])
    .map( a => moving(a)*d[1] )
    .filter( a => (
      0 <= ( p2ij(p).i + p2ij4moving(a).i ) && ( p2ij(p).i + p2ij4moving(a).i ) < 3 &&
      0 <= ( p2ij(p).j + p2ij4moving(a).j ) && ( p2ij(p).j + p2ij4moving(a).j ) < 4 ))
    .map( a => p+a )
  }
