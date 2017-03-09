import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Duckshogi } from './duckshogi';
import { ActionDispatcher } from './module';

export default connect(
  (store: any) => ({ state: store.duckshogi }),
  (dispatch: Dispatch<any>) => ({actions: new ActionDispatcher(dispatch)})
)(Duckshogi);
