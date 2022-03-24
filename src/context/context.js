import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [repos, setRepos] = useState(mockRepos)
  const [followers, setFollowers] = useState(mockFollowers)
  const [request, setRequest] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({ show: false, msg: '' })

  const checkRequest = async () => {
    const response = await axios.get(`${rootUrl}/rate_limit`)
    const { remaining } = response.data.rate
    if (remaining === 0) {
      toggleError(true, 'sorry, you have exceded your hourly rate limit')
    }
    setRequest(remaining)
  }

  useEffect(() => {
    checkRequest()
  })

  const toggleError = (show = false, msg = '') => {
    setError({ show, msg })
  }

  const searchGithubUser = async (githubUser) => {
    setIsLoading(true)
    toggleError()
    try {
      const response = await axios.get(`${rootUrl}/users/${githubUser}`)
      setGithubUser(response.data)
      const { repos_url, followers_url } = response.data
      await Promise.allSettled([
        axios.get(`${repos_url}?per_page=100`),
        axios.get(`${followers_url}?per_page=100`),
      ]).then((result) => {
        const [repos, followers] = result
        const status = 'fulfilled'
        if (repos.status === status) {
          setRepos(repos.value.data)
        }
        if (followers.status === status) {
          setFollowers(followers.value.data)
        }
      })
      setIsLoading(false)
    } catch (error) {
      console.log(error)
      toggleError(true, 'There is no user with that username')
    }
  }

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        isLoading,
        searchGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

export { GithubContext, GithubProvider }
