import { createStore, combineReducers } from 'redux';
import duckshogi from './duckshogi/module';

export default createStore(
  combineReducers({
    duckshogi: duckshogi
  })
);
