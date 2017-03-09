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

import { p2northwestXY, p2centerXY, mouse2p, willPosition } from './util';

interface Props {
  state: DuckshogiState;
  actions: ActionDispatcher;
}

export class Duckshogi extends React.Component<Props, {}> {
  board: number[]; // p == x + y*W
  step: number;
  gameState: string;
  ctx: any;

  frenemy = (x:number, y:number, r:number, f:number) => {
    this.ctx.beginPath();
    if( f>0 ){// frined
      this.ctx.moveTo( x - r*Math.cos(TPI/4), y - r*Math.sin(TPI/4) );
      [1,2,4,5].map( (i) => {
        this.ctx.lineTo( x + r*Math.cos(i*TPI/6 - TPI/4), y + r*Math.sin(i*TPI/6 - TPI/4) )});
    }
    else if( f<0 ){// enemy
      this.ctx.moveTo( x + r*Math.cos(TPI/4), y + r*Math.sin(TPI/4) );
      [1,2,4,5].map( (i) => {
        this.ctx.lineTo( x + r*Math.cos(i*TPI/6 + TPI/4), y + r*Math.sin(i*TPI/6 + TPI/4) )});
    }
    else{// frenemy
      this.ctx.moveTo( x + r*Math.cos(TPI/4), y + r*Math.sin(TPI/4) );
      [1,2,3,4,5].map( (i) => {
        this.ctx.lineTo( x + r*Math.cos(i*TPI/6 + TPI/4), y + r*Math.sin(i*TPI/6 + TPI/4) )});
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.lineWidth=2;
    this.ctx.stroke();};

  remarkP = ( p:number ) => {
    if( this.props.state.board[p] <= 0 ) return;
    this.ctx.beginPath();
    this.ctx.rect( p2northwestXY(p).x, p2northwestXY(p).y, INTERVAL, INTERVAL );
    this.ctx.fillStyle = '#eeee66';
    this.ctx.fill();
    const duck = this.props.state.board[p];
    willPosition(duck,p)
      .map( a => {
        this.ctx.beginPath();
        this.ctx.rect( p2northwestXY(a).x, p2northwestXY(a).y, INTERVAL, INTERVAL );
        this.ctx.fillStyle = '#6666ee';
        this.ctx.fill();});
    }

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
    this.props.state.board
    .map( (value,idx) =>  { return { idx:idx, v:value } })
    .filter( a => a.v!=0 )
    .map( a => {
      switch( Math.abs(a.v) ){
        case 1: this.ctx.fillStyle = '#ff4500'; break;
        case 2: this.ctx.fillStyle = '#00bfff'; break;
        case 4: this.ctx.fillStyle = '#ffff22'; break;
        case 8: this.ctx.fillStyle = '#90ee90'; break;
        default: this.ctx.fillStyle = '#ffffff';break; }
        this.frenemy( p2centerXY(a.idx).x, p2centerXY(a.idx).y, 30, a.v )});}

  render() {
    return (
      <div>
        <h3>STEP: { this.props.state.step }</h3>
        <p><button onClick={ () => this.props.actions.undo() }>UNDO</button></p>
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

    canvas.onmousedown = e => {
      const p = mouse2p( e.offsetX, e.offsetY );
        this.props.actions.click( p );
    }
  }

  componentDidUpdate() {
    const canvas = this.refs.myCanvas as HTMLCanvasElement;

    this.drawSquares();
    this.drawPieces();
  }
}
