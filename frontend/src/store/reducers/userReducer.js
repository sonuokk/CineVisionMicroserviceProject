import { ADD_USER_TO_STATE, REMOVE_USER_FROM_STATE } from "../actions/userActions";

localStorage.removeItem("cineSagaUser");
const storedUser = sessionStorage.getItem("cineSagaUser");
let parsedUser = null;
try {
    parsedUser = storedUser ? JSON.parse(storedUser) : null;
} catch {
    sessionStorage.removeItem("cineSagaUser");
}
const initialState = parsedUser ? { payload: parsedUser } : {}

export default function userReducer(state=initialState, {type, payload}){
    switch (type) {
        case ADD_USER_TO_STATE:
            sessionStorage.setItem("cineSagaUser", JSON.stringify(payload));
            return {
                ...state, payload
            }
        
        case REMOVE_USER_FROM_STATE:
            sessionStorage.removeItem("cineSagaUser");
            localStorage.removeItem("cineSagaUser");
            return{

            }
    
        default:
            return state;
    }
}
