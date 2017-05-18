import { handleActions } from 'redux-actions';
import { push } from 'react-router-redux';
import fetch from '../../utils/fetch';
import { showError } from './notifications';
import { FIXED_PREFIX, getFixedKeys, getContextProperties } from '../../services/context-service';

const GET_CONTEXT = 'GET_CONTEXT';
const CONTEXT_RECEIVED = 'CONTEXT_RECEIVED';

const UPDATE_CONTEXT = 'UPDATE_CONTEXT';
const FIXED_KEYS_UPDATED = 'FIXED_KEYS_UPDATED';

export const openContext = ({ contextType, contextId }) => push(`/context/${contextType}/${contextId}`);

export const getContext = ({ contextType, contextId }) => async function (dispatch) {
  dispatch({ type: GET_CONTEXT });
  try {
    const response = await fetch(`/api/context/${contextType}/${encodeURIComponent(contextId)}`, { credentials: 'same-origin' });
    const contextData = await response.json();
    const fixedKeys = getFixedKeys(contextData);
    const properties = getContextProperties(contextData);
    dispatch({ type: CONTEXT_RECEIVED, payload: { fixedKeys, properties } });
  } catch (error) {
    dispatch(showError({ title: 'Failed to retrieve context', error }));
    dispatch({ type: CONTEXT_RECEIVED });
  }
};

export const updateFixedKeys = ({ contextType, contextId, fixedKeys }) => async function (dispatch) {
  dispatch({ type: UPDATE_CONTEXT });

  const encodedContextId = encodeURIComponent(contextId);
  const fixedKeysWithPrefix = Object.keys(fixedKeys).reduce((result, key) => ({ ...result, [FIXED_PREFIX + key.trim()]: fixedKeys[key] }), {});

  try {
    await fetch(`/api/context/${contextType}/${encodedContextId}`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fixedKeysWithPrefix),
    });
    dispatch({ type: FIXED_KEYS_UPDATED, payload: { fixedKeys } });
  } catch (error) {
    dispatch(showError({ title: 'Failed to update context', error }));
    dispatch({ type: FIXED_KEYS_UPDATED });
  }
};

export default handleActions({
  [GET_CONTEXT]: state => ({
    ...state,
    isGettingContext: true,
  }),
  [CONTEXT_RECEIVED]: (state, action) => ({
    ...state,
    properties: action.payload ? action.payload.properties : state.properties,
    fixedKeys: action.payload ? action.payload.fixedKeys : state.fixedKeys,
    isGettingContext: false,
  }),

  [UPDATE_CONTEXT]: state => ({
    ...state,
    isUpdatingContext: true,
  }),

  [FIXED_KEYS_UPDATED]: (state, action) => ({
    ...state,
    fixedKeys: action.payload ? action.payload.fixedKeys : state.fixedKeys,
    isUpdatingContext: false,
  }),
}, {
  isGettingContext: false,
  fixedKeys: {},
  properties: {},
  isUpdatingContext: false,
});
