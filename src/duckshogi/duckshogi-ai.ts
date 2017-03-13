import * as Immutable from 'immutable';
import { p2ij, willPosition, log2 } from './util';
import { PIECES, SCORES } from './util';

interface World {
  board?: number[];
  pool?: number[];
  step?: number;
  record?: any[];
  remarked?: number;
  phase?: string;
}

export default class Duckmaster {
  board: number[];
  pool: number[];
  step: number;
  record: any[];
  remarked: number;
  phase: string;
  world: any;

  genMoves = ( world?:World ) => {
    const sign = Math.pow(-1,world.step%2);
    const nobodySquares = world.board
      .map( (v,k) => { return { k:k, v:v }})
      .filter( a => a.v==0 )
      .map( a => a.k )
    const pool2moves_ = world.pool
      .map( (v,k) => { return { k:k, v:v }})
      .filter( a => world.step%2==0? (a.k>2 && a.v>0):(a.k<3 && a.v>0) )
    const pool2moves = pool2moves_.length==0? []: (
      pool2moves_
        .map( a => { return {
          predator: (world.step%2==0? Math.pow(2,a.k-2) :  -Math.pow(2,a.k+1) ),
          from: a.k+12 } })
        .map( a => nobodySquares
          .map( b => { return { predator:a.predator, from:a.from, to:b, prey:world.board[b] }}))
        .reduce( (a,b) => a.concat(b) ))
    const board2moves_ = world.board
      .map( (v,k) => { return { predator:v, from:k } })
      .filter( a => world.step%2==0? a.predator>0 : a.predator<0 )
    const board2moves = board2moves_.length<2? []:
      board2moves_
        .map( a => willPosition( a.predator, a.from )
          .map( b => { return { predator:a.predator, from:a.from, to:b, prey:world.board[b] } }))
        .reduce( (a,b) => a.concat(b) )
        .filter( a => a.predator * a.prey <= 0 )
    return board2moves.concat(pool2moves)
  }

  execute = ( move:any, world:World ) => { return {
    step: world.step+1,
    board:  world.board
      .map( (a,idx) =>
        idx==move.from? 0:
        idx!=move.to? a:
        move.from>=12? move.predator:
        Math.abs(move.predator)!=PIECES["Chick"]? move.predator:
        move.predator==PIECES["Chick"]? (p2ij(move.to).j!=0? PIECES["Chick"]:PIECES["Hen"]):
        (p2ij(move.to).j!=3? -PIECES["Chick"]:-PIECES["Hen"])),
    pool: world.pool
      .map( (amount,idx) =>
        move.from<12? (
          move.prey==0? amount: ( idx==(world.step+1)%2*3+Math.min(log2(Math.abs(move.prey)),3)-1 ? amount+1: amount )
        ):(
          idx==move.from-12 ? amount-1: amount
        ))
    }}

  scoreOf = ( world:World ) => {
    const boardScore = ( board:number[] ) => board
      .map( (v,k) => { return {k:k,v:v} })
      .filter( a => a.v >= -1 )
      .map( a => (
        a.v==-PIECES["Lion"]? (p2ij(a.k).j==3? 2*SCORES["Lion"]: SCORES["Lion"]):
        a.v==PIECES["Lion"]? (p2ij(a.k).j==0? -2*SCORES["Lion"]: -SCORES["Lion"]):
        a.v==PIECES["Elephant"]? -SCORES["Elephant"]:
        a.v==PIECES["Giraffe"]? -SCORES["Giraffe"]:
        a.v==PIECES["Chick"]? -SCORES["Chick"]:
        a.v==PIECES["Hen"]? -SCORES["Hen"]: 0 ))
      .reduce( (a,b) => a+b );
    const poolScore = ( pool:number[] ) => pool
      .filter( (a,idx) => idx<3 )
      .map( (amount,idx) => (
        Math.pow(2,idx+1)==PIECES["Elephant"]? amount*SCORES["EinPool"]:
        Math.pow(2,idx+1)==PIECES["Giraffe"]? amount*SCORES["GinPool"]:
        Math.pow(2,idx+1)==PIECES["Chick"]? amount*SCORES["CinPool"]: 0 ))
      .reduce( (a,b) => a+b );

    return boardScore( world.board ) + poolScore( world.pool ) ;
  }

  readWorld( world:any ){
    this.world = world;
  }
  random(){
    const moves = this.genMoves(this.world);
    return moves[Math.floor(Math.random()*moves.length)];
  }
  reckless(){
    const moves = this.genMoves(this.world);
    const eatLion = moves
      .filter( a => a.prey==PIECES["Lion"])
    if( eatLion.length==0 ){
      return moves[Math.floor(Math.random()*moves.length)];
    }else{
      return eatLion[0];
    }
  }
  greedy(){
    const moves = this.genMoves(this.world)
      .map( move => {
        const nextWorld = this.execute( move, this.world );
        return { move:move, score:this.scoreOf( nextWorld ) }
        })
      .filter( (a,idx,self) => a.score==Math.max.apply({},self.map(s=>s.score)) )
    return moves[Math.floor(Math.random()*moves.length)].move;
  }
  minimax(){
    let timeover = false;
    setTimeout( () => { timeover=true } , 1000 );
    const moves_ = this.genMoves(this.world)
    try{
      const moves = this.genMoves(this.world)
        .map( move => {
          const nextWorld1 = this.execute( move, this.world );
          return this.genMoves(nextWorld1)
            .map( m1 => {
              const nextWorld2 = this.execute( m1, nextWorld1 );
              return this.genMoves(nextWorld2)
                .map( m3 => {
                  const nextWorld3 = this.execute( m1, nextWorld2 );
                  return { move:move, score:this.scoreOf( nextWorld3 ) }
                  })
                .filter( (a,idx,self) => a.score==Math.max.apply({},self.map(s=>s.score)) )
              })
            .filter( a => a!=[] )
            .reduce( (a,b) => a.concat(b) )
            .filter( (a,idx,self) => a.score==Math.min.apply({},self.map(s=>s.score)) )
          })
        .filter( a => a!=[] )
        .reduce( (a, b) => a.concat(b), [] )
        .filter( (a,idx,self) => a.score==Math.max.apply({},self.map(s=>s.score)) )
        .map( a => a.move )

      return timeover?
        this.greedy():
        moves[Math.floor(Math.random()*moves.length)];
    }catch(e){
      return this.greedy();
    }
  }
}
