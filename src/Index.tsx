import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import store from './Store';
import Duckshogi from './duckshogi/Root';

ReactDOM.render(
  <Provider store={ store }>
    <Duckshogi />
  </Provider>
  , document.getElementById('app')
);
