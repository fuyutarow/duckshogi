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

  genMoves = ( board:number[], pool:number[], step:number ) => {
    const nobodySquares = board
      .map( (v,k) => { return { k:k, v:v }})
      .filter( a => a.v==0 )
      .map( a => a.k )
    const deadEnd4Chick = board
      .map( (v,k) => { return { k:k, v:v }})
      .filter( a => p2ij(a.k).j == step%2*3 )
      .map( a => a.k )
    const pool2moves_ = this.pool
      .map( (v,k) => { return { k:k, v:v }})
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
    return board2moves.concat(pool2moves)
  }

  readState( state:any ){
    this.board = state.board;
    this.pool = state.pool;
    this.step = state.step;
    this.record = state.record;
    this.remarked = state.remarked;
    this.phase = this.phase;
  }
  random(){
    const moves = this.genMoves(this.board, this.pool, this.step);
    return moves[Math.floor(Math.random()*moves.length)];
  }
  reckless(){
    const moves = this.genMoves(this.board, this.pool, this.step);
    const eatLion = moves
      .filter( a => a.prey==PIECES["Lion"])

    if( eatLion.length==0 ){
      return moves[Math.floor(Math.random()*moves.length)];
    }else{
      return eatLion[0]//[Math.floor(Math.random()*eatLion.length)];
    }
  }
  coward(){
    const moves = this.genMoves(this.board, this.pool, this.step);
    const eatLion = moves
      .filter( a => a.prey==PIECES["Lion"])
    const unsafeArea = this.board
      .map( (v,k) => { return { predator:v, place:k }})
      .filter( a => a.predator > 0 )
      .map( a => willPosition(a.predator, a.place))
      .reduce( (a,b) => a.concat(b) )
    const safeMoves = moves
      .filter( move => move.predator==-PIECES["Lion"]? unsafeArea.indexOf(move.to)==-1:true )
    if( eatLion.length!=0 ){
      return eatLion[0];
    }else if( safeMoves.length!=0 ){
      return safeMoves[Math.floor(Math.random()*safeMoves.length)];
    }else{
      return moves[Math.floor(Math.random()*moves.length)];
    }
  }

  developing(){
    const genMoves_ = ( board:number[], pool:number[], step:number ) => {
      const nobodySquares = board
        .map( (v,k) => { return { k:k, v:v }})
        .filter( a => a.v==0 )
        .map( a => a.k )
      const deadEnd4Chick = board
        .map( (v,k) => { return { k:k, v:v }})
        .filter( a => p2ij(a.k).j == step%2*3 )
        .map( a => a.k )
      const pool2moves_ = this.pool
        .map( (v,k) => { return { k:k, v:v }})
        .filter( a => a.k>2 && a.v>0 )
      const pool2moves = pool2moves_.length==0? []: (
        pool2moves_
          .map( a => { return { predator:Math.pow(2,a.k-2), from:a.k+12 } })
          .map( a => nobodySquares
            .map( b => { return { predator:a.predator, from:a.from, to:b, prey:this.board[b] }}))
          .reduce( (a,b) => a.concat(b) ))
          .filter( a => a.predator!=PIECES["Chick"]? true: deadEnd4Chick.indexOf(a.to)==-1 )
      const board2moves = this.board
        .map( (v,k) => { return { predator:v, from:k } })
        .filter( a => a.predator > 0 )
        .map( a => willPosition( a.predator, a.from )
          .map( b => { return { predator:a.predator, from:a.from, to:b, prey:this.board[b] } }))
        .reduce( (a,b) => a.concat(b) )
        .filter( a=> a.predator * a.prey <= 0 )
      return board2moves.concat(pool2moves)
    }

    const moves = this.genMoves(this.board, this.pool, this.step)? this.genMoves(this.board, this.pool, this.step):[];
    const execute = ( move:any ) => { return {
      step: this.step+1,
      phase: move.prey==-1? "firstWin" :
        move.prey==1? "secondWin" : "waiting",
      board:  this.board
        .map( (a,idx) =>
          idx==move.from? 0:
          idx!=move.to? a:
          Math.abs(move.predator)!=PIECES["Chick"]? move.predator:
          move.predator==PIECES["Chick"]? (p2ij(move.to).j!=0? PIECES["Chick"]:PIECES["Hen"]):
          (p2ij(move.to).j!=3? -PIECES["Chick"]:-PIECES["Hen"])),
      pool: this.pool
        .map( (amount,idx) =>
          move.from<12? (
            move.prey==0? amount: ( idx==(this.step+1)%2*3+Math.min(log2(Math.abs(move.prey)),3)-1 ? amount+1: amount )
          ):(
            idx==move.from-12 ? amount-1: amount
          ))
      }}
    const nextStates = moves
      .map( (move,idx) => { return { idxOfMoves:idx, state:execute(move), myMove:move }});
    const enemyMoves_ = nextStates
      .map( a => { return {
        idxOfMoves: a.idxOfMoves,
        myMove: a.myMove,
        enemyMove: genMoves_( a.state.board, a.state.pool, a.state.step )
          .filter( m => m.prey==-PIECES["Lion"] )
        }})
      .filter( a => a.enemyMove.length > 0 );
    const deadEnd = enemyMoves_
      .map( a => a.idxOfMoves)
      //.map( a => moves);
    const runaways = moves
      .filter( (a,idx) => deadEnd.indexOf(idx)==-1 );

    const eatLion = moves
      .filter( a => a.prey==PIECES["Lion"])
    if( eatLion.length!=0 ){
      return eatLion[0]
    }else if( runaways.length!=0){
      return runaways[Math.floor(Math.random()*runaways.length)];
    }else{
      return moves[Math.floor(Math.random()*moves.length)];
    }
  }

}
