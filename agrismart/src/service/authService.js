import { API_PATH } from "../utils/apiPath"
import axiosInstances from "../utils/axiosInstances"

export const login = (email, password, role) =>{
    axiosInstances.post(API_PATH.AUTH.LOGIN, {email, password, role})
}
export const signup = (name, email, password, role) => {
    axiosInstances.post(API_PATH.AUTH.SIGNUP, {name, email, password, role})
}

export const getProfile = () =>{
    axiosInstances.get(API_PATH.GET_INFO.GET_USER_INFO)
}    