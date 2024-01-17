import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

// Provider , Consumer 

const GithubProvider = ({children}) => {
    const [githubUser,setGithubUser] = useState(mockUser);
    const [repos,setRepos] = useState(mockRepos);
    const [followers,setFollowers] = useState(mockFollowers);
    const [loading,setLoading] = useState(false);
    const [request,setRequest] = useState(0);
    const [error,setError] = useState({show: false,msg: ""})

    const searchGithubUser = async(user) => {
        toggleError();
        // Set Loading = true

        setLoading(true)

        const response = await axios(`${rootUrl}/users/${user}`)
        .catch((err) => console.log(err));

        if(response){
            setGithubUser(response.data)

            const {login,followers_url} = response.data
    
            // Repos
            // https://api.github.com/users/john-smilga/repos?per_page=100
            // Followers
            // https://api.github.com/users/john-smilga/followers
            await Promise.allSettled([
                axios(`${rootUrl}/users/${user}/repos?per_page=100`),
                axios(`${rootUrl}/users/${user}/followers`)
            ]).then((result) => {
                const[repos, followers] = result;
                const status = 'fulfilled';
                if(repos.status === status){
                    setRepos(repos.value.data)
                }

                if(followers.status === status){
                    setFollowers(followers.value.data)
                }
            })
        }else{
            toggleError(true,'User Not Found')
        }

        checkRequests()
        setLoading(false);
    }

    // Check Rate
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
        .then(({data})=>{
            let {rate: {remaining},} = data;
            setRequest(remaining)

            if(remaining === 0){
                // throw and error
                toggleError(true,"Sorry, You have Finished your hourly rate limit")
            }
        })
        .catch((err)=> console.log(err))
    }

    function toggleError(show = false,msg = "") {
        setError({show,msg})
    }

    useEffect(()=>{
        checkRequests()
    },[])

    return (
    <GithubContext.Provider value={{
        githubUser,repos,followers,request,error,searchGithubUser,loading
    }}>
        {children}
        </GithubContext.Provider>
    )
}

export {GithubProvider,GithubContext};