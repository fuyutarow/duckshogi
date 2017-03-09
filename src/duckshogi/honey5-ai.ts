import * as Immutable from 'immutable';

const TPI = 2*Math.PI;
const INTERVAL = 30;
const R = INTERVAL/(Math.cos(TPI/12)*2);
const W = 19;
const H = 19;

const p2honeyXY = ( p:number ) => { return { x:p%W, y:Math.floor(p/W) }};
const hoenyXY2mouseXY = ( x:number, y:number ) => {
  return { x: y%2==0? (x+1)*INTERVAL : (x+1.5)*INTERVAL , y: (y+1)*R*3/2 }}
const p2mouseXY = ( p:number ) => {
  const mouseXY = hoenyXY2mouseXY( p2honeyXY(p).x, p2honeyXY(p).y )
  return { x: mouseXY.x ,y: mouseXY.y}}
const L2 = (x:number,y:number) => Math.sqrt( x*x + y*y );

export default class Queenbee {
  cells: number[];
  valueMap: number[];

  readCells( cells: number[] ){
    this.cells = cells;
  }

  rend(){
    const index4yellowCells = this.cells
      .map( (value,idx) => { return { p:idx ,v:value } })
      .filter( a => a.v == 0 )
      .map( a => a.p );
    return index4yellowCells[Math.floor(Math.random()*index4yellowCells.length)];
  }

  neighbor(){
    const index4yellowCells = this.cells
      .map( (value,idx) => { return { p:idx ,v:value } })
      .filter( a => a.v == 0 )
      .map( a => a.p );

    const index4redCells = this.cells
      .map( (value,idx) => { return { p:idx ,v:value } })
      .filter( a => a.v == 1 )
      .map( a => a.p );

    const neighborhoods = index4yellowCells
      .map( a => {
        const d = index4redCells
          .map( b => L2( p2mouseXY(a).x - p2mouseXY(b).x, p2mouseXY(a).y - p2mouseXY(b).y ) )
          .reduce( (s,t) => Math.min(s,t) )
        return { id: a, d: d } })
      .filter( a => a.d < 2*R )
      .map( a => a.id );
    return neighborhoods[Math.floor(Math.random()*neighborhoods.length)];
  }
}
