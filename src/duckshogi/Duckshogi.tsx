import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DuckshogiState, ActionDispatcher } from './module';
import * as Immutable from 'immutable';

import { TPI, INTERVAL, W, H, R, MERGINX, MERGINY, PIECES, POOL_SHIFT } from './util';
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

  drawLetter = ( x:number, y:number, duck:Duck ) => {
    this.ctx.save();
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "12pt Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText( duck.owner,  x-INTERVAL/10, y );
    this.ctx.fillText( duck.who.re, x+INTERVAL/10, y-INTERVAL/10 );
    this.ctx.fillText( duck.who.im, x+INTERVAL/10, y+INTERVAL/10 );
    this.ctx.restore();
  }

  frenemy = ( x:number, y:number, r:number, duck:Duck ) => {
    this.ctx.save();
    this.ctx.fillStyle = colorOf( duck.who.re + duck.who.im );
    this.ctx.beginPath();
    if( duck.owner==1 ){// frined
      this.ctx.moveTo( x - r*Math.cos(TPI/4), y - r*Math.sin(TPI/4) );
      [1,2,4,5].map( (i) => {
        this.ctx.lineTo( x + r*Math.cos(i*TPI/6 - TPI/4), y + r*Math.sin(i*TPI/6 - TPI/4) )});
    }
    else if( duck.owner==2 ){// enemy
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
    this.drawLetter( x, y, duck );
    this.ctx.restore();

  };

  remarkP = ( p:number ) => {
    if( p < 12 ){
      const sign = this.props.state.step %2 *2 *(-1) +1;
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
    if( p>=12 && this.props.state.remarked!=-100){
      const x = (this.props.state.pool
        .filter( (v,k) => k<=this.props.state.remarked-POOL_SHIFT )
        .filter( (a,o,self) => a.owner==this.props.state.pool[this.props.state.remarked-POOL_SHIFT].owner)
        .length
        -1.5)*2*R+0.5*INTERVAL
      const y = this.props.state.pool[this.props.state.remarked-POOL_SHIFT].owner==2?
        0 : 5*INTERVAL;
      this.ctx.beginPath();
      this.ctx.rect( x, y, 2*R, INTERVAL );
      this.ctx.fillStyle = '#eeee66';
      this.ctx.fill();
    }
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
      .filter( a => a.v.who.re!=0 || a.v.who.im!=0 )
      .map( a => {
        this.frenemy( p2centerXY(a.idx).x, p2centerXY(a.idx).y, R, a.v );
        });
    this.props.state.pool
      .filter( a => a.owner==1 )
      .map( (a,idx) => {
        this.frenemy( idx*2*R+0.5*INTERVAL, 5.5*INTERVAL, R, a );
        });
    this.props.state.pool
      .filter( a => a.owner==2 )
      .map( (a,idx) => {
        this.frenemy( idx*2*R+0.5*INTERVAL, 0.5*INTERVAL, R, a );
        });
    }

  render() {
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
        if( MERGINY < e.offsetY && e.offsetY < MERGINY+4*INTERVAL ){
          const p = mouse2p( e.offsetX, e.offsetY );
          this.props.actions.click( p );
        }
        if( e.offsetY < MERGINY ){
          this.props.state.pool
            .map( (v,k) => { return {k:k, v:v} })
            .filter( a => a.v.owner==2 )
            .map( (a,i) => {
              if( -R < e.offsetX -(i*2*R+0.5*INTERVAL) && e.offsetX -(i*2*R+0.5*INTERVAL) < R ){
                this.props.actions.click(a.k+POOL_SHIFT)
              }})
        }
        if( MERGINY+4*INTERVAL < e.offsetY ){
          this.props.state.pool
            .map( (v,k) => { return {k:k, v:v} })
            .filter( a => a.v.owner==1 )
            .map( (a,i) => {
              if( -R < e.offsetX -(i*2*R+0.5*INTERVAL) && e.offsetX -(i*2*R+0.5*INTERVAL) < R ){
                this.props.actions.click(a.k+POOL_SHIFT)
              }})
        }
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
