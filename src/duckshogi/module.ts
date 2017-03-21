import * as Immutable from 'immutable';
import * as ObjectAssign from 'object-assign';

import { W, H, PIECES, POOL_SHIFT, p2ij, willPosition, log2 } from './util'
import { Complex, Duck, Z, reim2z, z2reim, will_Position } from './util';

export interface DuckshogiState {
  board: Duck[];
  pool: Duck[];
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
    { owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },
    { owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },
    { owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },
    { owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },{ owner:0, who:Z(31,31) },
  ],
  pool: [{ owner:0, who:Z(31,31)}], //opponent's Elephant, Giraffe, Chick and yours
  step: 0,
  record: [{ predator:Z(0,0), from:-100, to:-100, prey:Z(0,0) }],
  phase: "waiting",
};

const director = ( to_from:number ) =>
  to_from==-4? "northwest":
  to_from==-3? "north":
  to_from==-2? "northeast":
  to_from==-1? "west":
  to_from==1?  "east":
  to_from==2?  "southwest":
  to_from==3?  "south":
  to_from==4?  "southeast": "";

const M = ( to_from:number ) =>
  ["northwest","northeast","southwest","southeast"].indexOf(director(to_from))!=-1? PIECES["Lion"]+PIECES["Elephant"]:
  ["west","east","south"].indexOf(director(to_from))!=-1? PIECES["Lion"]+PIECES["Giraffe"]:
  ["north"].indexOf(director(to_from))!=-1? PIECES["Lion"]+PIECES["Giraffe"]+PIECES["Chick"]: 0;

interface Move {
  predator: Complex,
  from: number,
  to: number,
  prey: Complex,
}

const condensated = ( board:number[], move:Move ) => {
  const OP1qbit = [ PIECES["Lion"], PIECES["Elephant"], PIECES["Giraffe"], PIECES["Chick"] ];
  const OP2qbit = [ PIECES["Lion"]+PIECES["Elephant"], PIECES["Lion"]+PIECES["Giraffe"] ];
  const OP3qbit = [ PIECES["Lion"]+PIECES["Giraffe"]+PIECES["Chick"] ];

  const op = board[move.to];
  const requireLen =
    OP1qbit.indexOf(op)!=-1? 1:
    OP2qbit.indexOf(op)!=-1? 2:
    OP3qbit.indexOf(op)!=-1? 3: 0;
  const opLen = board.filter( a => a==op ).length;
  return board
    .map( (a,idx) =>
      a == op? a:
      opLen < requireLen ? a : a&(~op) )
  }

const nextBoard = ( world:DuckshogiState, move:Move ) => {
  const m = world.step%2==0? M(move.to-move.from): M(move.from-move.to);
  const q = z2reim( move.predator, world.step%2 ) & m;
  const board_ = world.board
    .map( (a,idx) =>
      idx==move.from? { owner:0, who:Z(0,0) }:
      idx==move.to?   { owner:world.step%2+1, who:reim2z(q,world.step%2) }:
      a )
  let pool_ = world.pool;
  pool_.push({ owner:world.step%2+1, who:move.prey })

  const res_ = board_.map( a => a.who.re ).concat(pool_.map( a => a.who.re ))
  const ims_ = board_.map( a => a.who.im ).concat(pool_.map( a => a.who.im ))
  const res = condensated( res_, move )
  const ims = condensated( ims_, move )
  return Immutable.Range(0,12).toArray()
    .map( a => { return { owner:board_[a].owner, who:Z(res[a],ims[a]) }})
    .map( (a,idx) =>
      move.from>=12&&idx==move.to? { owner:world.step%2+1, who:move.predator }: a )

}

export default function reducer(
  state: DuckshogiState = INITIAL_STATE,
  action: DuckshogiAction
): DuckshogiState {

  const execute = ( move:Move, world:DuckshogiState ) => {
    const m = world.step%2==0? M(move.to-move.from): M(move.from-move.to);
    const q = z2reim( move.predator, world.step%2 ) & m;
    const board_ = world.board
      .map( (a,idx) =>
        idx==move.from? { owner:0, who:Z(0,0) }:
        idx==move.to?   { owner:world.step%2+1, who:reim2z(q,world.step%2) }:
        a )
    let pool_ = world.pool;
    if( move.from<POOL_SHIFT ){
      pool_.push({ owner:world.step%2+1, who:move.prey })
    }

    const res_ = board_.map( a => a.who.re ).concat(pool_.map( a => a.who.re ))
    const ims_ = board_.map( a => a.who.im ).concat(pool_.map( a => a.who.im ))
    const res = condensated( res_, move )
    const ims = condensated( ims_, move )
    const newBoard = Immutable.Range(0,12).toArray()
      .map( a => { return { owner:board_[a].owner, who:Z(res[a],ims[a]) }})
      .map( (a,idx) =>
        move.from<12? a:
        idx==move.to? move.predator: a )
    const newPool = Immutable.Range(0,pool_.length).toArray()
      .map( a => { return { owner:pool_[a].owner, who:Z(res[a+12],ims[a+12]) }})
      .filter( a => a.who.re!=0 || a.who.im!=0 )
      .filter( (a,idx) => move.from<12? true: idx!=move.from-POOL_SHIFT )

    return {
      step: world.step+1,
      board: nextBoard( world, move ),
      record: world.record.concat(move),
      remarked: -100,
      phase:
        move.prey.im==PIECES["Lion"]? "firstWin" :
        move.prey.re==PIECES["Lion"]? "secondWin" : "waiting",
      pool: newPool
    }}

  switch (action.type) {

    case ActionTypes.CLICK: switch( state.phase ){
      case "waiting":
        if( action.clicked<12 && state.board[action.clicked].owner==(state.step+1)%2+1 ||
            action.clicked>=12 && state.pool[action.clicked-POOL_SHIFT].owner!=state.step%2+1
        ){
          return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
        }
        return ObjectAssign( {}, state, { phase: "selecting", remarked: action.clicked } );

      case "selecting":
        if( action.clicked==state.remarked ||
            state.remarked>=12 && (
              action.clicked>=12 ||
              state.board[action.clicked].owner==1 ||
              state.board[action.clicked].owner==2 )
        ){
          return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
        }
        const move =  state.remarked<POOL_SHIFT? {
          predator: state.board[state.remarked].who,
          from: state.remarked,
          to: action.clicked,
          prey: state.board[action.clicked].who,
        }:{
          predator: state.pool[state.remarked-POOL_SHIFT].who,
          from: state.remarked,
          to: action.clicked,
          prey: state.board[action.clicked].who,
        }
        if( move.from < 12 && willPosition( z2reim(move.predator,state.step%2), state.remarked ).indexOf( move.to ) == -1 ){
          return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );
        }
        return ObjectAssign( {}, state, execute(move, state) );
    }

    case ActionTypes.UNDO:
      return ObjectAssign( {}, state, { phase: "waiting", remarked: -100 } );

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
  execMove( move:Move ){
    this.dispatch({ type: ActionTypes.EXEC_MOVE, move: move });
  }
}
