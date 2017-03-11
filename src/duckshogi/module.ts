import * as Immutable from 'immutable';
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
  switch (action.type) {

    case ActionTypes.CLICK: switch( state.phase ){
      case "waiting":
        if( state.step%2 + Math.floor((action.clicked-12)/3) == 1 && state.pool[action.clicked-12] > 0 ){
          return Object.assign( {}, state, { phase: "selecting", remarked: action.clicked } )
        }
        const sign = state.step%2 *2 *(-1) +1;
        if( state.board[action.clicked]*sign > 0 && action.clicked != state.remarked ){
          return Object.assign( {}, state, { phase: "selecting", remarked: action.clicked } )
        }else{
          return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
        }

      case "selecting":
        const duck = state.board[state.remarked];
        const captured = state.board[action.clicked];
        const prey = captured!=PIECES["Hen"]? captured: PIECES["Chick"];
        if( state.remarked>= 12 ){
          const nobodySquares = state.board
            .map( (v,k) => { return { k:k, v:v }})
            .filter( a => a.v==0 )
            .map( a => a.k )
          if( nobodySquares.indexOf( action.clicked ) == -1 ){
            return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
          }

          const commited: number = Math.pow(2,state.remarked%3+1) * (Math.floor((state.remarked-12)/3) *2 -1);
          if( Math.abs(commited)==PIECES['Chick'] && p2ij(action.clicked).j==state.step%2*3 ){
            return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
          }
          const commitBoard = state.board
            .map( (a,i) => i==action.clicked? commited: a )

          let commitRecord = state.record;
          commitRecord.push( { predator:commited, from:state.remarked, to:action.clicked, prey:prey } );
          const commitPool = state.pool
            .map( (a,idx) => idx==state.remarked-12 ? a-1: a);
          return Object.assign( {}, state,
            { step: state.step+1, phase: "waiting", board: commitBoard, record: commitRecord, remarked: -100, pool: commitPool } )
        }

        if( state.remarked < 12 ){
          if( willPosition( duck, state.remarked ).indexOf( action.clicked ) == -1 ){
            return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
          }
        }
        if( duck*prey > 0 ){
          return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
        }

        const newBoard = state.board
          .map( (a,idx) =>
            idx==state.remarked? 0:
            idx!=action.clicked? a:
            Math.abs(duck)!=PIECES["Chick"]? duck:
            duck==PIECES["Chick"]? (p2ij(action.clicked).j!=0? PIECES["Chick"]:PIECES["Hen"]):
            (p2ij(action.clicked).j!=3? -PIECES["Chick"]:-PIECES["Hen"]) )
        let newRecord = state.record;
        newRecord.push( { predator:duck, from:state.remarked, to:action.clicked, prey:prey } );
        const newPhase =
          prey==-1? "firstWin" :
          prey==1? "secondWin" : "waiting";
        const newPool =
          prey==0? state.pool :
          state.pool
            .map( (a,idx) =>
              idx==(state.step+1)%2*3+log2(Math.abs(prey))-1 ? a+1: a);
        return Object.assign( {}, state,
          { step: state.step+1, phase: newPhase, board: newBoard, record: newRecord, remarked: -100, pool: newPool } )
    }

    case ActionTypes.UNDO:
      if (state.step<=0){
        return Object.assign({}, state, { step: 0 });
      }
      let undoRecord = state.record;
      const lastRecord = undoRecord.pop();
      const undoBoard = state.board
        .map( (a,idx) =>
          idx==lastRecord.to? lastRecord.prey:
          idx==lastRecord.from? lastRecord.predator: a );
      const undoPool =
        lastRecord.from<12? (
          state.pool
            .map( (a,idx) => {
              if( lastRecord.prey == 0 ) return a
              if( lastRecord.prey > 0 ) return idx==log2(lastRecord.prey)-1 ? a-1:a;
              if( lastRecord.prey < 0 ) return idx==log2(-lastRecord.prey)+2 ? a-1:a;})):
        lastRecord.from>=12? (
          state.pool
            .map( (a,idx) => idx==lastRecord.from-12? a+1: a)): state.pool;
      return Object.assign( {}, state,
        { step: state.step-1, phase: "waiting", board: undoBoard, record: undoRecord, remarked: -100, pool: undoPool } )

    case ActionTypes.EXEC_MOVE:
      let nextRecord = state.record;
      nextRecord.push(action.move);
      return Object.assign( {}, state, {
        step: state.step+1,
        phase: action.move.prey==-1? "firstWin" :
          action.move.prey==1? "secondWin" : "waiting",
        board:  state.board
          .map( (a,idx) =>
            idx==action.move.from? 0:
            idx!=action.move.to? a:
            Math.abs(action.move.predator)!=PIECES["Chick"]? action.move.predator:
            action.move.predator==PIECES["Chick"]? (p2ij(action.move.to).j!=0? PIECES["Chick"]:PIECES["Hen"]):
            (p2ij(action.move.to).j!=3? -PIECES["Chick"]:-PIECES["Hen"])),
        record: nextRecord,//this.record.concat(action.move),
        remarked: -100,
        pool: state.pool
          .map( (amount,idx) =>
            action.move.from<12? (
              action.move.prey==0? amount: ( idx==(state.step+1)%2*3+Math.min(log2(Math.abs(action.move.prey)),3)-1 ? amount+1: amount )
            ):(
              idx==action.move.from-12 ? amount-1: amount
            ))
        })

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
