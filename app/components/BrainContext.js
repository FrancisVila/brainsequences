import { createContext, useContext, useReducer } from 'react';

const BrainContext = createContext(null);

const BrainDispatchContext = createContext(null);

export function TasksProvider({ children }) {
  const [brainData, dispatch] = useReducer(
    dataReducer,
    initialBrainData
  );

  return (
    <BrainContext value={brainData}>
      <BrainDispatchContext value={dispatch}>
        {children}
      </BrainDispatchContext>
    </BrainContext>
  );
}

export function useTasks() {
  return useContext(BrainContext);
}

export function useBrainDispatch() {
  return useContext(BrainDispatchContext);
}

function dataReducer(brainData, action) {
  switch (action.objectType){
    case 'sequence': {
      return sequenceReducer(brainData.sequences, action);
    }
    case 'step': {
      return stepReducer(brainData.steps, action);
    }
  }

}

function sequenceReducer(sequences, action) {
  switch (action.type) {
    case 'added': {
      return [...sequences, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'changed': {
      return sequences.map(t => {
        if (t.id === action.sequence.id) {
          return action.sequence;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return sequences.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

function stepReducer(steps, action) {
  switch (action.type) {
    case 'added': {
      return [...steps, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'changed': {
      return steps.map(t => {
        if (t.id === action.step.id) {
          return action.step;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return steps.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialBrainData = {
  sequences: [],
  steps: []
}
  
