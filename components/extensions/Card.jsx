import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import {
  faChrome,
  faFirefoxBrowser,
  faEdge,
  faSafari,
} from '@fortawesome/free-brands-svg-icons'

const browserIcons = {
  Chrome: <FontAwesomeIcon icon={faChrome} />,
  Firefox: <FontAwesomeIcon icon={faFirefoxBrowser} />,
  Edge: <FontAwesomeIcon icon={faEdge} />,
  Safari: <FontAwesomeIcon icon={faSafari} />,
}

export default function Card({
  id,
  name,
  url,
  image,
  browser,
  category,
  changeSelect,
  checked,
  hideChecked = false,
}) {
  return (
    <div className="extension__item relative group flex items-center justify-between space-x-3 rounded-lg bg-gray-100/50 dark:bg-gray-100/5 p-3 hover:bg-color-primary/30 dark:hover:bg-color-primary/10 transition duration-500">
      <div className="flex items-center space-x-3 w-full relative z-20">
        <div className="bg-white dark:bg-white/5 min-w-12 w-12 h-12 flex items-center justify-center rounded-xl">
          <Link href={`/extensions/${id}`}>
            <a
              title={name}
              className="inline-flex rounded overflow-hidden ease-in-out"
            >
              {image ? (
                <Image
                  className="rounded hover:scale-125 hover:rotate-12 transform duration-500"
                  src={image}
                  height={48}
                  width={48}
                  alt=""
                />
              ) : (
                ''
              )}
            </a>
          </Link>
        </div>
        <div>
          <h6 className="w-full group-hover:w-48 group-hover:lg:w-40 transition-all duration-300">
            <Link href={`/extensions/${id}`}>
              <a
                className="line-clamp-1 break-all hover:text-color-primary relative after:absolute after:bottom-0.5 after:left-0 after:content-[''] after:h-[2px] hover:after:h-[2px] after:w-0 hover:after:w-24 after:transition-all after:duration-500 after:bg-color-primary-reverse after:rounded-full"
                title={name}
              >
                {name}
              </a>
            </Link>
          </h6>
          <div className="mt-1 space-x-2">
            {/* <Link
              href={`/extensions/category/${browser.toLowerCase()}`}
              className={`${
                browser === 'Chrome'
                  ? 'bg-sky-200 dark:bg-sky-900'
                  : 'bg-violet-200 dark:bg-violet-900'
              } py-1 px-2 text-sm text-center rounded leading-3`}
            >
              {browser}
            </Link> */}
            <span
              className={`bg-indigo-200 dark:bg-indigo-900 leading-3 py-1 px-2 text-sm text-center rounded whitespace-nowrap`}
            >
              {category}
            </span>
          </div>
        </div>
      </div>
      <div
        className={`flex absolute right-0 top-0 z-10 h-full ${
          checked ? 'w-full' : 'w-0'
        } group-hover:w-1/3 transition-all duration-500 from-400 to-transparent bg-gradient-to-l rounded-lg opacity-80`}
      ></div>
      <div
        className={`group-hover:opacity-100 opacity-0 transition duration-500 flex flex-row items-center justify-between absolute z-20 right-0 top-0 bg-transparent rounded-r-lg h-full w-1/3 pl-6`}
      >
        {!hideChecked && (
          <label htmlFor={`_${id}`} className="flex relative cursor-pointer">
            <input
              className="check-input w-6 h-6 appearance-none border-2 border-primary/70 rounded"
              type="checkbox"
              id={`_${id}`}
              checked={checked}
              onChange={() => changeSelect(id)}
            />
            <FontAwesomeIcon
              icon={faCheck}
              className="top-0 left-0 check-icon absolute w-6 h-6 text-opacity-0 text-primary transition-all duration-500"
            />
          </label>
        )}
        <a
          href={url}
          className="select-none cursor-pointer relative ml-1 px-2 z-10 flex items-center justify-center w-full h-full whitespace-nowrap text-slate-700 hover:after:opacity-60 after:opacity-0 after:rounded-r-lg after:z-[-1] after:content-[''] after:h-full after:w-0 hover:after:w-full after:right-0 after:top-0 after:absolute after:bg-gradient-to-l after:from-500 after:via-500 after:to-transparent after:transition-all after:duration-300 rounded-r-lg"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          打开
        </a>
      </div>
    </div>
  )
}

function SoftwareCard({
  id,
  name,
  url,
  path,
  image,
  browser,
  category,
  changeSelect,
  checked,
  hideChecked = false,
}) {
  return (
    <div className="extension__item relative group flex items-center justify-between space-x-3 rounded-lg bg-gray-100/50 dark:bg-gray-100/5 p-3 hover:bg-color-primary/30 dark:hover:bg-color-primary/10 transition duration-500">
      <div className="flex items-center space-x-3 w-full relative z-20">
        <div className="bg-white dark:bg-white/5 min-w-12 w-12 h-12 flex items-center justify-center rounded-xl">
          <Link href={path}>
            <a
              title={name}
              className="inline-flex rounded overflow-hidden ease-in-out"
            >
              {image ? (
                <Image
                  className="rounded hover:scale-125 hover:rotate-12 transform duration-500"
                  src={image}
                  height={48}
                  width={48}
                  alt=""
                />
              ) : (
                ''
              )}
            </a>
          </Link>
        </div>
        <div>
          <h6 className="w-full group-hover:w-48 group-hover:lg:w-40 transition-all duration-300">
            <Link href={path}>
              <a
                className="line-clamp-1 break-all hover:text-color-primary relative after:absolute after:bottom-0.5 after:left-0 after:content-[''] after:h-[2px] hover:after:h-[2px] after:w-0 hover:after:w-24 after:transition-all after:duration-500 after:bg-color-primary-reverse after:rounded-full"
                title={name}
              >
                {name}
              </a>
            </Link>
          </h6>
          <div className="mt-1 space-x-2">
            {/* <Link
              href={`/extensions/category/${browser.toLowerCase()}`}
              className={`${
                browser === 'Chrome'
                  ? 'bg-sky-200 dark:bg-sky-900'
                  : 'bg-violet-200 dark:bg-violet-900'
              } py-1 px-2 text-sm text-center rounded leading-3`}
            >
              {browser}
            </Link> */}
            <span
              className={`bg-indigo-200 dark:bg-indigo-900 leading-3 py-1 px-2 text-sm text-center rounded whitespace-nowrap`}
            >
              {category}
            </span>
          </div>
        </div>
      </div>
      <div
        className={`flex absolute right-0 top-0 z-10 h-full ${
          checked ? 'w-full' : 'w-0'
        } group-hover:w-1/3 transition-all duration-500 from-400 to-transparent bg-gradient-to-l rounded-lg opacity-80`}
      ></div>
      <div
        className={`group-hover:opacity-100 opacity-0 transition duration-500 flex flex-row items-center justify-center absolute z-20 right-0 top-0 bg-transparent rounded-r-lg h-full w-1/3 pl-6`}
      >
        {!hideChecked && (
          <label htmlFor={`_${id}`} className="flex relative cursor-pointer">
            <input
              className="check-input w-6 h-6 appearance-none border-2 border-primary/70 rounded"
              type="checkbox"
              id={`_${id}`}
              checked={checked}
              onChange={() => changeSelect(id)}
            />
            <FontAwesomeIcon
              icon={faCheck}
              className="top-0 left-0 check-icon absolute w-6 h-6 text-opacity-0 text-primary transition-all duration-500"
            />
          </label>
        )}
        {url ? <a
          href={url}
          className="select-none cursor-pointer relative ml-1 px-2 z-10 flex items-center justify-center w-full h-full whitespace-nowrap text-slate-700 hover:after:opacity-60 after:opacity-0 after:rounded-r-lg after:z-[-1] after:content-[''] after:h-full after:w-0 hover:after:w-full after:right-0 after:top-0 after:absolute after:bg-gradient-to-l after:from-500 after:via-500 after:to-transparent after:transition-all after:duration-300 rounded-r-lg"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          下载
        </a> : ''}
      </div>
    </div>
  )
}

export {
  SoftwareCard
}