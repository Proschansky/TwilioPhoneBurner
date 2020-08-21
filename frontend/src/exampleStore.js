// store.js
import React, { createContext } from "react";

const initialState = {
  calling: 0,
  index: 0,
  connection: undefined,
  incoming: false,
  from: undefined,
  burning: 0,
  contacts: [
    
    {
      name: "Some Person",
      phoneNumber: "1234567890",
      emailAddress: "someperson@someone.com",
      rating: 5.0,
    },
    {
      name: "Other Person",
      phoneNumber: "0987654321",
      emailAddress: "otherperson@someone.com",
      rating: 5.0,
    },
    {
      name: "Third Person",
      phoneNumber: "1324567098",
      emailAddress: "",
      rating: 5.0,
    },
  ],
};

const store = createContext(initialState);
const { Provider } = store;

function reducer(state, action){
  const newState = state;
    const { contacts, incoming, index } = newState;
    switch (action.type) {
      case "ADD_CONTACT":
        newState.contacts.push(action.contact);
        return newState;
      case "ADD_CONNECTION":
        return {
          ...newState,
          connection: action.connection
        }
      case "BURNING_NEXT":
        let nextIndex = index + 1;
        if(nextIndex < contacts.length){
        return {
          ...newState,
          index: nextIndex,
          burning: 1,
          calling: 1
        }
      } else {
        return newState
      }
      case "CANCEL_INCOMING":
        return {
          ...newState,
          incoming: false
        }
      case "MAKE_CALL":
        return {
          ...newState,
          calling: 1
        };
      case "HANG_UP":
        return {
          ...newState,
          calling: 0,
          incoming: false,
          from: undefined
        };
      case "INCOMING":
        const newFrom = !incoming ? action.from : undefined
        return {
          ...newState,
          incoming: !incoming,
          from: newFrom
        }
      case "NEXT":
        let nxtIndex = index + 1;
        if(index === contacts.length - 1){
          nxtIndex = 0
        }
        return {
          ...newState,
          calling: 0,
          index: nxtIndex
        };
      case "PREVIOUS":
        let prevIndex;
        if(index === 0){
          prevIndex = contacts.length - 1
        } else {
          prevIndex = index - 1;
        }
        return {
          ...newState,
          calling: undefined,
          index: prevIndex
        };
      case "SET_RATING":
        newState.contacts[action.index].rating = action.rating;
        return {
          newState,
        };
      default:
        throw new Error();
    }
}

const StateProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
