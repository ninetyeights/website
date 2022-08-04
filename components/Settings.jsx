// import {useEffect} from 'react';

export default function Settings() {
  // useEffect(() => {
  //   const isDark = window.matchMedia("prefers-color-scheme:dark").matches;
  //   changeMode(isDark ? 'dark' : 'light')
  // }, [])

  const changeMode = (mode) => {
    if (mode === 'light') {
      document.getElementById('main').classList.remove('dark')
      document.getElementById('main').classList.add('light')
      ;[...document.querySelectorAll('.os-theme-light')].map(el => {
        el.classList.remove('os-theme-light')
        el.classList.add('os-theme-dark')
      })
    } else {
      document.getElementById('main').classList.remove('light')
      document.getElementById('main').classList.add('dark')
      ;[...document.querySelectorAll('.os-theme-dark')].map(el => {
        el.classList.remove('os-theme-dark')
        el.classList.add('os-theme-light')
      })
    }
  }

  const changeColor = (color) => {
    document.getElementById('main').setAttribute('data-theme-color', color)
  }

  return (
    <div className="z-20 settings fixed bottom-1/2 right-4 text-color-primary shadow p-4 rounded-md">
      <div>
        <h6>Mode</h6>
        <div>
          <button onClick={() => changeMode('light')}>Light</button>
          <button className="dark" onClick={() => changeMode('dark')}>
            Dark
          </button>
        </div>
      </div>
      <div>
        <h6>Presets</h6>
        <div className="space-x-2">
          <button className="text-green-600" onClick={() => changeColor('green')}>Green</button>
          <button className="text-sky-600" onClick={() => changeColor('sky')}>Sky</button>
          <button className="text-red-600" onClick={() => changeColor('red')}>Red</button>
          <button className="text-orange-600" onClick={() => changeColor('orange')}>Orange</button>
          <button className="text-purple-600" onClick={() => changeColor('purple')}>Purple</button>
          <button className="text-pink-600" onClick={() => changeColor('pink')}>Pink</button>
        </div>
      </div>
    </div>
  )
}
