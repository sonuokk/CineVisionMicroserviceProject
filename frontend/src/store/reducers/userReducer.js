import { ADD_USER_TO_STATE, REMOVE_USER_FROM_STATE } from "../actions/userActions";

const storedUser = localStorage.getItem("cineSagaUser");
const initialState = storedUser ? { payload: JSON.parse(storedUser) } : {}

export default function userReducer(state=initialState, {type, payload}){
    switch (type) {
        case ADD_USER_TO_STATE:
            localStorage.setItem("cineSagaUser", JSON.stringify(payload));
            return {
                ...state, payload
            }
        
        case REMOVE_USER_FROM_STATE:
            localStorage.removeItem("cineSagaUser");
            return{

            }
    
        default:
            return state;
    }
}
