import { useEffect, useState } from "react"
import { getProfile } from "../service/authService";
import { userContext } from "./Context";

export const UserProvider = ({children}) =>{
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true)

    useEffect(() =>{
        const token = localStorage.getItem("token")
        if(!token){
            setLoading(false)
            return
        }

        getProfile
        .then((res) =>{
            const data = res.data?.data
            if(data) setUser({id: data.id, name: data.name, email: data.email, role: data.role})
        })
        .catch(()=> localStorage.removeItem("token"))
        .finally(()=>setLoading())
        
    }, [])
    const updateUser = (userData) => setUser(userData)
    const logout = () => setUser(null)

return (
    <userContext.Provider value={{user, updateUser, logout, authLoading: loading}}>
        {children}
    </userContext.Provider>
)

}