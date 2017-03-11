import * as Immutable from 'immutable';
import { p2ij, willPosition, log2 } from './util';
import { PIECES } from './util';

export default class Duckmaster {
  board: number[];
  pool: number[];
  step: number;
  record: any[];
  remarked: number;
  phase: string;

  readState( state:any ){
    this.board = state.board;
    this.pool = state.pool;
    this.step = state.step;
    this.record = state.record;
    this.remarked = state.remarked;
    this.phase = this.phase;
  }
  rand(){
    const nobodySquares = this.board
      .map( (v,k) => { return { k:k, v:v }})
      .filter( a => a.v==0 )
      .map( a => a.k )
    const deadEnd4Chick = this.board
      .map( (v,k) => { return { k:k, v:v }})
      .filter( a => p2ij(a.k).j == this.step%2*3 )
      .map( a => a.k )
    const pool2moves_ = this.pool
      .map( (v,k) => { return { k:k, v:v } })
      .filter( a => a.k<3 && a.v>0 )
    const pool2moves = pool2moves_.length==0? []: (
      pool2moves_
        .map( a => { return { predator:-Math.pow(2,a.k+1), from:a.k+12 } })
        .map( a => nobodySquares
          .map( b => { return { predator:a.predator, from:a.from, to:b, prey:this.board[b] }}))
        .reduce( (a,b) => a.concat(b) ))
        .filter( a => a.predator!=-PIECES["Chick"]? true: deadEnd4Chick.indexOf(a.to)==-1 )

    const board2moves = this.board
      .map( (v,k) => { return { predator:v, from:k } })
      .filter( a => a.predator < 0 )
      .map( a => willPosition( a.predator, a.from )
        .map( b => { return { predator:a.predator, from:a.from, to:b, prey:this.board[b] } }))
      .reduce( (a,b) => a.concat(b) )
      .filter( a=> a.predator * a.prey <= 0 )
    const moves = board2moves.concat(pool2moves)
    return moves[Math.floor(Math.random()*moves.length)]
  }

}
