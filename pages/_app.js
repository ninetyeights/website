import Settings from '../components/Settings'
import Navbar from '../components/Navbar'
import {useEffect, useState} from "react";
import '../styles/globals.css'

function MyApp({Component, pageProps}) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const e = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(e.matches)

        e.addEventListener('change', event => {
            setIsDark(event.matches)
        })
    }, [])

    return (<div id="main" data-theme-color="green" className={`pt-16 min-h-screen ${isDark ? 'dark' : 'light'}`}>
        <Settings/>
        <Navbar/>
        <div className="container mx-auto px-4 pb-8">
            <Component theme={isDark} {...pageProps} />
        </div>
    </div>)
}

export default MyApp
