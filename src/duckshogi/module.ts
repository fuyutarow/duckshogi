import * as Immutable from 'immutable';
import { PIECES, p2ij, willPosition } from './util'

const W = 3;
const H = 4;

export interface DuckshogiState {
  board: number[];
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
}

export class ActionTypes {
  static CLICK = 'duckshogi/click';
  static REMARK = 'duckshogi/remark';
  static MOVE = 'duckshogi/moove';
  static BLUE = 'duckshogi/blue';
  static UNDO = 'duckshogi/undo';
}

const INITIAL_STATE =  {
  clicked: -100,
  remarked: -100,
  board: [
    -PIECES["Giraffe"], -PIECES["Lion"], -PIECES["Elephant"],
    0, -PIECES["Chick"], 0,
    0, PIECES["Chick"], 0,
    PIECES["Elephant"], PIECES["Lion"], PIECES["Giraffe"]
  ],
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
        const sign = state.step%2 *2 *(-1) +1;
        console.log(">>",state.board[action.clicked]*sign);
        if( state.board[action.clicked]*sign > 0 && action.clicked != state.remarked ){
          const remarked = action.clicked;
          console.log("rem ",remarked)
          return Object.assign( {}, state, { phase: "selecting", remarked: remarked } )
        }else{
          return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
        }

      case "selecting":
        const duck = state.board[state.remarked];
        if( willPosition( duck, state.remarked ).indexOf( action.clicked ) == -1 ){
          return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
        }
        const prey = state.board[action.clicked];
        const newBoard = state.board
          .map( (a,idx) =>
            idx==state.remarked? 0:
            idx!=action.clicked? a:
            Math.abs(duck)!=PIECES["Chick"]? duck:
            duck==PIECES["Chick"]? (p2ij(action.clicked).j!=0? PIECES["Chick"]:PIECES["Hen"]):
            (p2ij(action.clicked).j!=4? -PIECES["Chick"]:-PIECES["Hen"]) )
        let newRecord = state.record;
        newRecord.push( { predator:duck, from:state.remarked, to:action.clicked, prey:prey } )
        const newPhase =
          state.record[state.record.length-1].prey==-1? "firstWin" :
          state.record[state.record.length-1].prey==1? "secondWin" : "waiting"
        return Object.assign( {}, state,
          { step: state.step+1, phase: newPhase, board: newBoard, record: newRecord, remarked: -100 } )
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
      return Object.assign( {}, state, { step: state.step-1, phase: "waiting", board: undoBoard, record: undoRecord, remarked: -100 } )

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
}
