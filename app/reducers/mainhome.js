import axios from 'axios';

/*----------  INITIAL STATE  ----------*/
const initialState = {
  onMainHome: true,
  onAddProject: false,
  onCollaborator: false,
  onPageRender: false
};

/*----------  ACTION TYPES  ----------*/
const ON_MAIN_HOME = 'ON_MAIN_HOME';
const ON_ADD_PROJECT = 'ON_ADD_PROJECT';
const ON_COLLABORATOR = 'ON_COLLABORATOR';
const ON_PAGE_RENDER = 'ON_PAGE_RENDER';


/*----------  ACTION CREATORS  ----------*/
export const onMainHome = () => ({
  type: ON_MAIN_HOME,
  payload: true
});

export const onAddProject = () => ({
  type: ON_ADD_PROJECT,
  payload: true
});

export const onCollaborator = () => ({
  type: ON_COLLABORATOR,
  payload: true
});

export const onPageRender = () => ({
  type: ON_PAGE_RENDER,
  payload: true
});


/*----------  THUNKS  ----------*/
export const createUser = (userCred) => {
    const thunk = (dispatch) => {
        axios.post('http://localhost:3000/api/register', userCred)
            .then(res => {
              if (res.data.message){
                dispatch(userAlreadyExists(res.data.foundUser))
              } else {
                dispatch(newUser(res.data))
              }
            })
            .catch(err => console.error('Error creating user: ', err))
    }
    return thunk;
}


/*----------  REDUCER  ----------*/
export default (state = initialState, action) => {
  switch (action.type) {
    case ON_MAIN_HOME:
      return Object.assign({}, state, {
        onMainHome: action.payload,
        onAddProject: false,
        onCollaborator: false,
        onPageRender: false
      });
    case ON_ADD_PROJECT:
      return Object.assign({}, state, {
        onMainHome: false,
        onAddProject: action.payload,
        onCollaborator: false,
        onPageRender: false
      });
    case ON_COLLABORATOR:
      return Object.assign({}, state, {
        onMainHome: false,
        onAddProject: false,
        onCollaborator: action.payload,
        onPageRender: false
      });
    case ON_PAGE_RENDER:
      return Object.assign({}, state, {
        onMainHome: false,
        onAddProject: false,
        onCollaborator: false,
        onPageRender: action.payload
      });
    default: return state;
  }
};
