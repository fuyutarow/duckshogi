import * as Immutable from 'immutable';
import * as ObjectAssign from 'object-assign';

import { W, H, PIECES, p2ij, willPosition, log2 } from './util'

export interface DuckshogiState {
  board: number[];
  pool: number[];
  step: number;
  record?: any[];
  remarked?: number;
  phase?: string;
}

interface DuckshogiAction {
  type: string;
  from?: number;
  to?: number;
  remarked?: number;
  clicked?: number;
  move: any;
}

export class ActionTypes {
  static CLICK = 'duckshogi/click';
  static REMARK = 'duckshogi/remark';
  static MOVE = 'duckshogi/moove';
  static EXEC_MOVE = 'duckshogi/execMove';
  static UNDO = 'duckshogi/undo';
}

const INITIAL_STATE =  {
  remarked: -100,
  board: [
    -PIECES["Giraffe"], -PIECES["Lion"], -PIECES["Elephant"],
    0, -PIECES["Chick"], 0,
    0, PIECES["Chick"], 0,
    PIECES["Elephant"], PIECES["Lion"], PIECES["Giraffe"]
  ],
  pool: [0,0,0,0,0,0], //opponent's Elephant, Giraffe, Chick and yours
  step: 0,
  record: [{ predator:0, from:-100, to:-100, prey:0 }],
  phase: "waiting",
};

export default function reducer(
  state: DuckshogiState = INITIAL_STATE,
  action: DuckshogiAction
): DuckshogiState {

  const genMoves = ( world:DuckshogiState ) => {
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

  const execute_ = ( move:any, world:DuckshogiState ) => { return {
    step: world.step+1,
    board:  world.board
      .map( (a,idx) =>
        idx==move.from? 0:
        idx!=move.to? a:
        move.from>=12? move.predator:
        // for promotion
        Math.abs(move.predator)!=PIECES["Chick"]? move.predator:
        move.predator==PIECES["Chick"]? (p2ij(move.to).j!=0? PIECES["Chick"]:PIECES["Hen"]):
        (p2ij(move.to).j!=3? -PIECES["Chick"]:-PIECES["Hen"])),
    record: world.record.concat(move),
    remarked: -100,
    pool: world.pool
      .map( (amount,idx) =>
        move.from<12? (
          move.prey==0? amount: ( idx==(world.step+1)%2*3+Math.min(log2(Math.abs(move.prey)),3)-1 ? amount+1: amount )
        ):(
          idx==move.from-12 ? amount-1: amount
        ))
    }}
  const judgePhase = ( move:any, world:DuckshogiState ) =>
      move.prey==-PIECES["Lion"]? "firstWin" :
      move.prey==PIECES["Lion"]? "secondWin" :
      // for try rule
      move.predator==PIECES["Lion"] && p2ij(move.to).j==0 && genMoves(execute_(move, world)).filter(move=>move.prey==PIECES["Lion"]).length==0? "firstWin":
      move.predator==-PIECES["Lion"] && p2ij(move.to).j==3 && genMoves(execute_(move, world)).filter(move=>move.prey==-PIECES["Lion"]).length==0? "secondWin":
      "waiting";
  const execute = ( move:any, world:DuckshogiState ) =>
    ObjectAssign( {}, execute_(move, world), { phase:judgePhase(move, world)} )

  switch (action.type) {

    case ActionTypes.CLICK: switch( state.phase ){
      case "waiting":
        if( state.step%2 + Math.floor((action.clicked-12)/3) == 1 && state.pool[action.clicked-12] > 0 ){
          return ObjectAssign( {}, state, { phase: "selecting", remarked: action.clicked } )
        }
        const sign = state.step%2 *2 *(-1) +1;
        if( state.board[action.clicked]*sign > 0 && action.clicked != state.remarked ){
          return ObjectAssign( {}, state, { phase: "selecting", remarked: action.clicked } )
        }else{
          return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
        }

      case "selecting":
        const duck = state.board[state.remarked];
        const captured = state.board[action.clicked];
        const move =  {
          predator: state.remarked<12? (
              state.board[state.remarked]
            ):(
              Math.pow(2,state.remarked%3+1) * (Math.floor((state.remarked-12)/3) *2 -1)
            ),
          from: state.remarked,
          to: action.clicked,
          prey: captured!=PIECES["Hen"]? captured: PIECES["Chick"]
        }
        if( move.from >= 12 ){
          const nobodySquares = state.board
            .map( (v,k) => { return { k:k, v:v }})
            .filter( a => a.v==0 )
            .map( a => a.k )
          if( nobodySquares.indexOf( move.to ) == -1 ){
            return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
          }
          return ObjectAssign( {}, state, execute(move, state) );
        }
        if( move.from < 12 ){
          if( willPosition( move.predator, state.remarked ).indexOf( move.to ) == -1 ){
            return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
          }
        }
        if( move.predator*move.prey > 0 ){
          return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
        }
        return ObjectAssign( {}, state, execute(move, state) );
    }

    case ActionTypes.UNDO:
      if (state.step<=0){
        return ObjectAssign({}, state, { step: 0 });
      }
      let undoRecord = state.record;
      const lastRecord = undoRecord.pop();
      const boobyRecord = undoRecord.pop();

      const lastPool = state.pool
        .map( (amount,idx) =>
          lastRecord.from<12? (
            lastRecord.prey==0? amount: ( idx==(state.step)%2*3+Math.min(log2(Math.abs(lastRecord.prey)),3)-1 ? amount-1: amount )
          ):(
             idx==lastRecord.from-12? amount+1: amount
          ));

      const boobyPool = lastPool
        .map( (amount,idx) =>
          boobyRecord.from<12? (
            boobyRecord.prey==0? amount: ( idx==(state.step-1)%2*3+Math.min(log2(Math.abs(boobyRecord.prey)),3)-1 ? amount-1: amount )
          ):(
             idx==boobyRecord.from-12? amount+1: amount
          ));

      return ObjectAssign( {}, state,{
        step: state.step-2,
        phase: "waiting",
        board: state.board
          .map( (a,idx) =>
            idx==lastRecord.to? lastRecord.prey:
            idx==lastRecord.from? lastRecord.predator: a )
          .map( (a,idx) =>
            idx==boobyRecord.to? boobyRecord.prey:
            idx==boobyRecord.from? boobyRecord.predator: a ),
        record: undoRecord,
        remarked: -100,
        pool: boobyPool,
      })

    case ActionTypes.EXEC_MOVE:
      try{
        return ObjectAssign( {}, state, execute(action.move, state) );
      }catch(e){
        return ObjectAssign( {}, state, { phase:"firstWin"} );
      }

    default:
      return state;
  }
}

export class ActionDispatcher {
  dispatch: (action: any) => any;
  constructor(dispatch: (action: any) => any) {
    this.dispatch = dispatch
  }
  click( clicked: number ){
    this.dispatch({ type: ActionTypes.CLICK, clicked: clicked });
  }
  undo(){
    this.dispatch({ type: ActionTypes.UNDO });
  }
  execMove( move:any ){
    this.dispatch({ type: ActionTypes.EXEC_MOVE, move: move });
  }
}
