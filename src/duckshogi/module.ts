import * as Immutable from 'immutable';
import * as ObjectAssign from 'object-assign';

import { W, H, PIECES, p2ij, willPosition, log2 } from './util'

export interface DuckshogiState {
  board: number[];
  pool: number[];
  step: number;
  record: any[];
  remarked: number;
  phase: string;
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

  const execute = ( move:any ) => ObjectAssign( {}, state, {
    step: state.step+1,
    phase: move.prey==-1? "firstWin" :
      move.prey==1? "secondWin" : "waiting",
    board:  state.board
      .map( (a,idx) =>
        idx==move.from? 0:
        idx!=move.to? a:
        Math.abs(move.predator)!=PIECES["Chick"]? move.predator:
        move.predator==PIECES["Chick"]? (p2ij(move.to).j!=0? PIECES["Chick"]:PIECES["Hen"]):
        (p2ij(move.to).j!=3? -PIECES["Chick"]:-PIECES["Hen"])),
    record: state.record.concat(move),
    remarked: -100,
    pool: state.pool
      .map( (amount,idx) =>
        move.from<12? (
          move.prey==0? amount: ( idx==(state.step+1)%2*3+Math.min(log2(Math.abs(move.prey)),3)-1 ? amount+1: amount )
        ):(
          idx==move.from-12 ? amount-1: amount
        ))
    })

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
        if( move.from>= 12 ){
          const nobodySquares = state.board
            .map( (v,k) => { return { k:k, v:v }})
            .filter( a => a.v==0 )
            .map( a => a.k )
          if( nobodySquares.indexOf( move.to ) == -1 ){
            return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
          }
          if( Math.abs( move.predator )==PIECES['Chick'] && p2ij(move.to).j==state.step%2*3 ){
            return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
          }
          return execute(move);
        }
        if( move.from < 12 ){
          if( willPosition( move.predator, state.remarked ).indexOf( move.to ) == -1 ){
            return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
          }
        }
        if( move.predator*move.prey > 0 ){
          return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
        }
        return execute(move)
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
      return execute(action.move);

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
