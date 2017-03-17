import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DuckshogiState, ActionDispatcher } from './module';
import * as Immutable from 'immutable';

import { TPI, INTERVAL, W, H, R, MERGINX, MERGINY, PIECES } from './util';
import { p2northwestXY, p2centerXY, mouse2p, willPosition } from './util';
import { Complex, Z, z2reim, will_Position, colorOf, Duck } from './util';
import Duckmaster from './duckshogi-ai';
const AI = new Duckmaster;

interface Props {
  state: DuckshogiState;
  actions: ActionDispatcher;
}

export class Duckshogi extends React.Component<Props, {}> {
  board: Duck[]; // p == x + y*W
  step: number;
  gameState: string;
  ctx: any;

  drawLetter = ( x:number, y:number, who:Complex, s?:string ) => {
    this.ctx.save();
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "12pt Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText( who.re, x, y-INTERVAL/10 );
    this.ctx.fillText( who.im, x, y+INTERVAL/10 );
    this.ctx.restore();
  }

  frenemy = ( x:number, y:number, r:number, who:Complex, s?:string  ) => {
    this.ctx.save();
    this.ctx.fillStyle = colorOf( who.re + who.im );
    this.ctx.beginPath();
    if( who.re > 0 && who.im==0 ){// frined
      this.ctx.moveTo( x - r*Math.cos(TPI/4), y - r*Math.sin(TPI/4) );
      [1,2,4,5].map( (i) => {
        this.ctx.lineTo( x + r*Math.cos(i*TPI/6 - TPI/4), y + r*Math.sin(i*TPI/6 - TPI/4) )});
    }
    else if( who.im > 0 && who.re==0 ){// enemy
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
    this.ctx.stroke();
    this.drawLetter( x, y, who );
    this.ctx.restore();

  };

  remarkP = ( p:number ) => {
    if( p >= 12 ) return;
    const sign = this.props.state.step %2 *2 *(-1) +1;
    //if( this.props.state.board[p].re*sign <= 0 ) return;
    this.ctx.beginPath();
    this.ctx.rect( p2northwestXY(p).x, p2northwestXY(p).y, INTERVAL, INTERVAL );
    this.ctx.fillStyle = '#eeee66';
    this.ctx.fill();
    const duck: Duck = this.props.state.board[p]?
      this.props.state.board[p] : { owner:0, who:Z(-100,-100) };
    willPosition(z2reim(duck.who,this.props.state.step%2), p)
      .map( a => {
        this.ctx.beginPath();
        this.ctx.rect( p2northwestXY(a).x, p2northwestXY(a).y, INTERVAL, INTERVAL );
        this.ctx.fillStyle = '#9fa8da';
        this.ctx.fill();});
    }

  drawSquares = () => {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.rect( 0, 0, W*INTERVAL + 2*MERGINX, H*INTERVAL + 2*MERGINY);
    this.ctx.fill();
    Immutable.Range(0,18).toArray()
      .map( p => {
        this.ctx.beginPath();
        this.ctx.rect( p2northwestXY(p).x, p2northwestXY(p).y, INTERVAL, INTERVAL );
        this.ctx.fillStyle = p<12? '#eeeeee':'#ffffff';
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
      //.filter( a => a.v.who.re!=0 || a.v.who.im!=0 )
      .map( a => {
        this.frenemy( p2centerXY(a.idx).x, p2centerXY(a.idx).y, R, a.v.who, "board" );
        });
    }

  render() {
    console.log(this.props.state)
   return (
      <div>
      <h3>STEP: { this.props.state.step }</h3>
        <p>
          <button onClick={ () => {
            if( this.props.state.step%2 == 0 ) this.props.actions.undo();
          }}>UNDO</button>
        </p>
        <canvas ref="myCanvas"/>
      </div>
    );
  }

  componentDidMount() {
    const canvas = this.refs.myCanvas as HTMLCanvasElement;
    canvas.width = W*INTERVAL + 2*MERGINX;
    canvas.height = H*INTERVAL + 2*MERGINY;

    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.drawSquares();
    this.drawPieces();

    //if( this.props.state.step%2 == 0 ){
      canvas.onmousedown = e => {
        const p = mouse2p( e.offsetX, e.offsetY );
        this.props.actions.click( p );
      }
    //}
  }

  componentDidUpdate() {
    const canvas = this.refs.myCanvas as HTMLCanvasElement;

    this.drawSquares();
    this.drawPieces();

// for AI
/*
    if( this.props.state.step%2==1 && this.props.state.phase=="waiting" ){
      this.ctx.fillStyle = 'rgba( 120, 120, 20, 0.2 )';
      this.ctx.rect(0,0,W*INTERVAL + 2*MERGINX,H*INTERVAL + 2*MERGINY);
      this.ctx.fill();
      AI.readWorld( this.props.state );
      //const move = AI.minimax();
      const move = AI.greedy();
      //const move = AI.random();
      console.log(move)
      setTimeout( () => this.props.actions.execMove(move), 1000);
    }
*/

// for terminal
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "80pt Arial";
    this.ctx.textAlign = "center";
    if( this.props.state.phase == "firstWin" ){
      this.ctx.fillText("You", canvas.width/2, canvas.height/3);
      this.ctx.fillText("Win!", canvas.width/2, canvas.height*2/3);
    }
    if( this.props.state.phase == "secondWin" ){
      this.ctx.fillText("You", canvas.width/2, canvas.height/3);
      this.ctx.fillText("lose!", canvas.width/2, canvas.height*2/3);
    }
  }

  shouldComponentUpdate(){
    return (this.props.state.phase=="firstWin" || this.props.state.phase=="secondWin")? false: true;
  }
}
