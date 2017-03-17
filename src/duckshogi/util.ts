import * as Immutable from 'immutable';

export interface Complex {
  re: number;
  im: number;
}

export interface Duck {
  owner: number;// none, first, scond -> 0, 1, 2
  who: Complex;
}

export const z2reim = ( z:Complex, zerone:number ) =>
  zerone%2==0? z.re : z.im

export const reim2z = ( a:number, zerone:number ) =>
  zerone%2==0? Z(a,0) : Z(0,a)

export const Z = ( x:number, y:number ) => { return {
  re: x,
  im: y }};

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

export const log2 = ( x:number ) => Math.round(Math.LOG2E * Math.log(x))

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
  "Lion":     2,
  "Elephant": 4,
  "Giraffe":  8,
  "Chick":   16,
  "Hen":     32,
}

export const COLORS = {
  "Lion":     0xff4500,
  "Elephant": 0x139be5,
  "Giraffe":  0xffff22,
  "Chick":    0x90ee90,
  "Hen":      0xee00aa,
}

export const colorOf = ( who:number ):string => {
  const color_ = [1,2,3,4]
    .map( a => (who>>a)%2 )
    .map( (a,idx) =>
      a==0? 0x0:
      Math.pow(2,idx+1)==PIECES["Lion"]?     COLORS["Lion"]:
      Math.pow(2,idx+1)==PIECES["Elephant"]? COLORS["Elephant"]:
      Math.pow(2,idx+1)==PIECES["Giraffe"]?  COLORS["Giraffe"]:
      Math.pow(2,idx+1)==PIECES["Chick"]?    COLORS["Chick"]: 0x0 )
  const color = color_
    .reduce( (a,b) => a|b )
  return "#"+color.toString(16)
}

export const SCORES = {
  "Lion": 100,
  "Elephant": 5,
  "Giraffe": 5,
  "Chick": 4,
  "Hen": 16,
  "EinPool": 3,
  "GinPool": 3,
  "CinPool": 1,
}

const moving = ( s:string ) =>
  s=="northwest"? -1-W:
  s=="north"? -W:
  s=="northeast"? 1-W:
  s=="west"? -1:
  s=="east"? 1:
  s=="southwest"? -1+W:
  s=="south"? W:
  s=="southeast"? 1+W: 0

const canMove_ = ( n:number ) =>
  n==PIECES["Lion"]?     [ "northwest","north","northeast","west","east","southwest","south","southeast" ] :
  n==PIECES["Elephant"]? [ "northwest","northeast","southwest","southeast" ] :
  n==PIECES["Giraffe"]?  [ "north","west","east","south" ] :
  n==PIECES["Chick"]?    [ "north" ] :
  n==PIECES["Hen"]?      [ "northwest","north","northeast","west","east","south" ] : []

const canMove = ( n:number ) =>
  [0,1,2,3,4]
    .map( a => (n>>a)%2 )
    .map((a,idx) => a*Math.pow(2,idx) )
    .map( a => canMove_(a) )
    .reduce( (a,b) => a.concat(b) )
    .filter( (a,idx,self) => self.indexOf(a)===idx )

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

export const will_Position = ( predator:Complex, p:number ) => {
  const d = predator.re>0? [predator.re,1]:[Math.abs(predator.im),-1]
  return canMove(d[0])
    .map( a => moving(a)*d[1] )
    .filter( a => (
      0 <= ( p2ij(p).i + p2ij4moving(a).i ) && ( p2ij(p).i + p2ij4moving(a).i ) < 3 &&
      0 <= ( p2ij(p).j + p2ij4moving(a).j ) && ( p2ij(p).j + p2ij4moving(a).j ) < 4 ))
    .map( a => p+a )
  }
