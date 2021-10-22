import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

export const AuthContext = createContext({} as AuthContextData)

type AuthProvider = {
  children: ReactNode
}

export function AuthProvider(props: AuthProvider) {
  const signInUrl = 'https://github.com/login/oauth/authorize?scope=user&client_id=439c700356248930788c'

  const [user, setUser] = useState<User | null>(null)
  
  function signOut () {
    setUser(null)

    localStorage.removeItem('token')
  }

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>('/authenticate', {
      code: githubCode
    })
    
    const { token, user } = response.data

    api.defaults.headers.common.authorization = `Bearer ${token}`
    
    localStorage.setItem('token', token)
    
    setUser(user)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`

      api.get<User>('/profile').then(response => setUser(response.data))
    }
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const hasGithugCode = url.includes('?code=')

    if (hasGithugCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=')

      window.history.pushState({}, '', urlWithoutCode)

      signIn(githubCode)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  )
}