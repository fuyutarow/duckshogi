import * as Immutable from 'immutable';

const W = 3;
const H = 4;

const PIECES = {
  "Lion": 1,
  "Elephant": 2,
  "Giraffe": 4,
  "Chick":8,
  "Hen": 16
}

const p2ij = ( p:number ) => {
  return {
    i: p%W,
    j: Math.floor(p/W) }};

const moving = ( s:string ) =>
  s=="northwest"? -1-W:
  s=="north"? -W:
  s=="northeast"? 1-W:
  s=="west"? -1:
  s=="right"? 1:
  s=="southwest"? -1+W:
  s=="south"? W:
  s=="southeast"? 1+W: 0

const canMove = ( n:number ) =>
  /*Lion*/     n==1?  [ "northwest","north","northeast","west","right","southwest","south","southeast" ] :
  /*Elephant*/ n==2?  [ "northwest","northeast","southwest","southeast" ] :
  /*Giraffe*/  n==4?  [ "north","west","right","south" ] :
  /*Chick*/    n==8?  [ "north" ] :
  /*Hen*/      n==16? [ "northwest","north","northeast","west","right","south" ] : []

const p2ij4moving = ( n:number ) => {
  return {
    i: (n%W+W)%W==2? -1: (n%W+W)%W,
    j: -4<=n&&n<-1? -1: -1<=n&&n<2? 0: 1 }};

const willPosition = ( duck:number, p:number ) => canMove(duck)
  .map( a => moving(a) )
  .filter( a => (
    0 <= ( p2ij(p).i + p2ij4moving(a).i ) && ( p2ij(p).i + p2ij4moving(a).i ) < 3 &&
    0 <= ( p2ij(p).j + p2ij4moving(a).j ) && ( p2ij(p).j + p2ij4moving(a).j ) < 4 ))
  .map( a => p+a )


export interface DuckshogiState {
  board: number[];
  step: number;
  record: number[][];
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
  record: [[0,0,0]],
  phase: "waiting",
};

export default function reducer(
  state: DuckshogiState = INITIAL_STATE,
  action: DuckshogiAction
): DuckshogiState {
  switch (action.type) {
    case ActionTypes.CLICK:
      if( state.phase == "waiting"){
        if( state.board[action.clicked] > 0 && action.clicked != state.remarked ){
          const remarked = action.clicked;
          return Object.assign( {}, state, { phase: "selecting", remarked: remarked } )
        }else{
          return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
        }
      }
      else if( state.phase == "selecting"){
        const duck = state.board[state.remarked];
        if( willPosition( duck, state.remarked ).indexOf( action.clicked ) == -1 ){
          return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );          
        }
        const newBoard = state.board
          .map( (a,idx) =>
            idx==state.remarked? 0:
            idx==action.clicked? duck: a );
        let newRecord = state.record;
        newRecord.push( [duck, state.remarked, action.clicked] )
        return Object.assign( {}, state, { step: state.step+1, phase: "waiting", board: newBoard, record: newRecord, remarked: -100 } )
      }
    case ActionTypes.REMARK:
      if( state.board[action.remarked] > 0 && action.remarked != state.remarked ){
        const remarked = action.remarked;
        return Object.assign( {}, state, { phase: "selecting", remarked: remarked } )
      }else{
        return Object.assign( {}, state, { phase: "waiting", remarked: -100 } );
      }

    case ActionTypes.MOVE:
      const duck = state.board[action.from];
      const newBoard = state.board
        .map( (a,idx) =>
          a==action.from? 0:
          a==action.to? duck: a );
      let newRecord = state.record;
      newRecord.push( [duck, action.from, action.to] )
      return Object.assign( {}, state, { step: state.step+1, phase: "waiting", board: newBoard, record: newRecord } )

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
  remark( remarked: number ){
    this.dispatch({ type: ActionTypes.REMARK, remarked: remarked });
  }
  move( from: number, to:number ){
    this.dispatch({ type: ActionTypes.MOVE, from: from, to: to });
  }
  undo(){
    this.dispatch({ type: ActionTypes.UNDO });
  }
}
