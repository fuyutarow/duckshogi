import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DuckshogiState, ActionDispatcher } from './module';
import * as Immutable from 'immutable';

const TPI = 2*Math.PI;
const INTERVAL = 100;
const R = INTERVAL/(Math.cos(TPI/12)*2);
const W = 3;
const H = 4;
const MERGIN = 20;

const p2ij = ( p:number ) => {
  return {
    i: p%W,
    j: Math.floor(p/W) }};
const p2northwestXY = ( p:number) => {
  return {
    x: p2ij(p).i*INTERVAL + MERGIN,
    y: p2ij(p).j*INTERVAL + MERGIN }};
const p2centerXY = ( p:number ) => {
  return {
    x: (p2ij(p).i+0.5)*INTERVAL + MERGIN,
    y: (p2ij(p).j+0.5)*INTERVAL + MERGIN }};
const L2 = (x:number,y:number) => Math.sqrt( x*x + y*y );
const mouse2p = ( mouseX:number, mouseY:number) => {
  return ( Immutable.Range(0,12).toArray()
    .map( a => p2centerXY(a) )
    .map( (a,idx) => Math.floor( L2( a.x-mouseX, a.y-mouseY )*1000 )*1000 +idx )
    .reduce( (a,b) => Math.min(a, b) )
  )%1000 };

const PIECES = {
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

const p2ij4moving = ( n:number ) => {
  return {
    i: (n%W+W)%W==2? -1: (n%W+W)%W,
    j: -4<=n&&n<-1? -1: -1<=n&&n<2? 0: 1 }};

const willPosition = ( duck:number, p:number ) => canMove(duck)
  .map( a => moving(a) )
  .filter( a => (
    0 <= ( p2ij(p).i + p2ij4moving(a).i ) && ( p2ij(p).i + p2ij4moving(a).i ) < 3 &&
    0 <= ( p2ij(p).j + p2ij4moving(a).j ) && ( p2ij(p).j + p2ij4moving(a).j ) < 4 ))
  .map( a => p+a )

interface Props {
  state: DuckshogiState;
  actions: ActionDispatcher;
}

export class Duckshogi extends React.Component<Props, {}> {
  board: number[]; // p == x + y*W
  step: number;
  gameState: string;
  ctx: any;

  pent = (x:number, y:number, r:number) => {
    this.ctx.beginPath();
    this.ctx.moveTo( x + r*Math.cos(TPI/4), y + r*Math.sin(TPI/4) );
    Immutable.Range(1,6).toArray().map( (i) => {
      this.ctx.lineTo( x + r*Math.cos(i*TPI/6 + TPI/4), y + r*Math.sin(i*TPI/6 + TPI/4) )});
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.lineWidth=2;
    this.ctx.stroke();};

  remarkCanMove = ( duck:number, p:number ) => {
    willPosition(duck,p)
      .map( a => {
        this.ctx.beginPath();
        this.ctx.rect( p2northwestXY(a).x, p2northwestXY(a).y, INTERVAL, INTERVAL );
        this.ctx.fillStyle = '#6666ee';
        this.ctx.fill();});
    }

  remarkP = ( p:number ) => {
    if( this.props.state.board[p] <= 0 ) return;
    this.ctx.beginPath();
    this.ctx.rect( p2northwestXY(p).x, p2northwestXY(p).y, INTERVAL, INTERVAL );
    this.ctx.fillStyle = '#eeee66';
    this.ctx.fill();
    const duck = this.props.state.board[p];
    this.remarkCanMove(duck,p) };

  drawSquares = () => {
    Immutable.Range(0,12).toArray()
      .map( p => {
        this.ctx.beginPath();
        this.ctx.rect( p2northwestXY(p).x, p2northwestXY(p).y, INTERVAL, INTERVAL );
        this.ctx.fillStyle = '#eeeeee';
        this.ctx.fill();});
    this.remarkP(this.props.state.remarked);
    Immutable.Range(0,12).toArray()
      .map( p => {
        this.ctx.beginPath();
        this.ctx.rect( p2northwestXY(p).x, p2northwestXY(p).y, INTERVAL, INTERVAL );
        this.ctx.lineWidth=4;
        this.ctx.stroke();});
    };

  drawPieces = () => {
    this.board
    .map( (value,idx) =>  { return { idx:idx, v:value } })
    .filter( a => a.v!=0 )
    .map( a => {
      switch( Math.abs(a.v) ){
        case 1: this.ctx.fillStyle = '#ff4500'; break;
        case 2: this.ctx.fillStyle = '#00bfff'; break;
        case 4: this.ctx.fillStyle = '#ffff22'; break;
        case 8: this.ctx.fillStyle = '#90ee90'; break;
        default: this.ctx.fillStyle = '#ffffff';break; }
        this.pent( p2centerXY(a.idx).x, p2centerXY(a.idx).y, 30 )});}

  render() {
    this.board = this.props.state.board;
    //this.step = this.props.state.step;

    return (
      <div>
        <p>{ this.props.state.phase }</p>
        <p>{ this.props.state.board }</p>
        <p>{ this.props.state.remarked }</p>
        <canvas ref="myCanvas"/>
      </div>
    );

  }

  componentDidMount() {
    const canvas = this.refs.myCanvas as HTMLCanvasElement;
    canvas.width = MERGIN + W*INTERVAL + MERGIN;
    canvas.height = MERGIN + H*INTERVAL + MERGIN;

    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.drawSquares();
    this.drawPieces();


// for remarked

    canvas.onmousedown = e => {
      const p = mouse2p( e.offsetX, e.offsetY );
      //if( this.props.state.phase == "waiting"){
        console.log(p)
        this.props.actions.click( p );
      //}
    }


  }

  componentDidUpdate() {
    const canvas = this.refs.myCanvas as HTMLCanvasElement;

    this.drawSquares();
    this.drawPieces();

}}
    /*canvas.onmousedown = e => {
      const L2 = (x:number,y:number) => Math.sqrt( x*x + y*y );
      const mouse2ij = ( mouseX:number, mouseY:number) => {
        const p = Immutable.Range(0,15).toArray()
          .map( a => p2ij(a) )
          .map( (a,idx) => Math.floor( L2( a.i-mouseX, a.j-mouseY )*1000 )*1000 +idx )
          .reduce( (a,b) => Math.min(a, b) )
        console.log(p);
          //.map( a => { console.log(a)})
          //.map( a => a%1000 )
        //return p;
      }
      //const ij = mouse2ij( e.offsetX, e.offsetY );
      //console.log(ij);
    }

    */

    /*

    const Hex = (x:number, y:number, r:number) => {
      ctx.beginPath();
      ctx.moveTo( x + r*Math.cos(TPI/4), y + r*Math.sin(TPI/4) );
      Immutable.Range(1,6).toArray().map( i => {
        ctx.lineTo( x + r*Math.cos(i*TPI/6 + TPI/4), y + r*Math.sin(i*TPI/6 + TPI/4) )});
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

// for click
    const honeyComb = Immutable.Range(0,W*H).toArray()
      .map( p => {
        switch( this.props.state.cells[p] ){
          case 0: ctx.fillStyle = '#ffff22';break;
          case 1: ctx.fillStyle = '#ff2222';break;
          case -1: ctx.fillStyle = '#2222ff';break;
          default: ctx.fillStyle = '#ffffff';
        };
        Hex( p2mouseXY(p).x, p2mouseXY(p).y , R ) });


// for AI
    if( this.props.state.step%2 == 0 ){
      Bee.readCells( this.props.state.cells );
      const p = Bee.neighbor();
      const lastRecord = this.props.state.record[this.props.state.record.length-1];
      setTimeout( () => this.props.actions.red( p ) , 1000);
    }

// for termial

  }
*/
