import Renderer from 'engine/renderer';
import config from 'game/config';
config.resizeMode = 'dom';

import R from 'engine/reactive';
import EventEmitter from 'engine/eventemitter3';

import snabbdom from 'editor/snabbdom';
const patch = snabbdom.init([
  require('editor/snabbdom/modules/class'),
  require('editor/snabbdom/modules/props'),
  require('editor/snabbdom/modules/attributes'),
  require('editor/snabbdom/modules/eventlisteners'),
]);
import h from 'editor/snabbdom/h';

import css from './style.css';

// Model
import context from './context';
import data from './data';

// Operators
import ops from './ops';
import './ops/object';

// Components
import outliner from './components/outliner';
import inspector from './components/inspector';

const init = () => ({
  context: context(),
  data: data(),
});

// Operation dispatcher
let emitter;
const index = (o, i) => (o ? o[i] : undefined);
const operate = (actStr, param) => {
  let action = actStr.split('.').reduce(index, ops);
  if (action) {
    emitter.emit({ action, param });
  }
  else {
    emitter.error(`WARNING: operator "${actStr}" not found`);
  }
};

// Action stream
const actions$ = R.stream(e => emitter = e);

// Editor factory
const editor = (elm) => {

  // Editor view
  const view = (model) => h(`section.${css.sidebar}`, [
    outliner(model, operate),
    inspector(model, operate),
  ]);

  // Logic stream
  actions$
    // Update
    .scan((model, op) => op.action(model, op.param), init())
    // View
    .map(view)
    // Apply to editor element
    .scan(patch, elm)
    // Logging
    .onError(err => console.log(err));

  // Fix canvas style issue
  Renderer.resize(100, 100);

};

// Editor scene
import engine from 'engine/core';
import Scene from 'engine/scene';
import Timer from 'engine/timer';

class Editor extends Scene {
  constructor() {
    super();

    editor(document.getElementById('container'));
  }
  awake() {
    operate('object.ADD', {
      type: 'Text',
      name: 'gameOverText',
    });
    operate('object.ADD', {
      type: 'Container',
      name: 'scoreBoard',
      x: 100,
      y: 20,
    });
    operate('object.ADD', {
      type: 'Sprite',
      name: 'playBtn',
    });
    operate('object.ADD', {
      type: 'Sprite',
      name: 'title',
    });

    operate('object.SELECT', 3);

    operate('object.ADD', {
      type: 'Sprite',
      name: 'menuFlappy',
    });
  }
};
engine.addScene('Editor', Editor);
