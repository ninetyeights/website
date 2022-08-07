import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image';
import logo from '../static/images/logo.png'

function Before() {
  return (
    <nav className="fixed top-0 sm:top-4 z-10 w-full">
      <div className="container mx-auto sm:px-4">
        <div className="flex flex-wrap items-center justify-between px-4 py-2 text-black dark:text-white bg-white dark:bg-slate-900 sm:rounded-lg backdrop-blur-md bg-opacity-60 dark:bg-opacity-80 shadow-md">
          <a href="/" className="flex items-center">
            <Image
              src={logo.src}
              className="mr-2 sm:mr-3 h-6 sm:h-9"
              height={36}
              width={36}
              alt="Flowbite Logo"
            />
            <span className="sm:text-xl font-semibold whitespace-nowrap">
              NinetyEights
            </span>
          </a>
          <div className="">
            <ul className="flex flex-col md:flex-row md:font-medium">
              <li className="px-2">
                <Link href="/">首页</Link>
              </li>
              <li className="px-2">
                <Link href="/softwares">软件列表</Link>
              </li>
              <li className="px-2">
                <Link href="/extensions">插件列表</Link>
              </li>
              <li className="px-2">
                <Link href="/tools">线上工具</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function Navbar() {
  const router = useRouter()

  return (
    <nav className="fixed top-0 z-50 w-full py-3 bg-white/70 backdrop-blur-sm dark:bg-slate-900 dark:bg-opacity-90 shadow">
      <div className="container flex flex-wrap justify-between items-center mx-auto px-4">
        <Link href="/">
          <a className="flex items-center">
            <Image
              src={logo.src}
              className="mr-3 h-9"
              height={36}
              width={36}
              alt="NinetyEights"
            />
            <span className="self-center text-xl whitespace-nowrap text-black/70 dark:text-white/70 font-semibold ml-2">
              玖捌网
            </span>
          </a>
        </Link>
        <div className="flex items-center md:order-2">
          {/* 如果登录用户显示, Dark 模式下还需要细节处理下hover和active颜色 */}
          <button
            data-collapse-toggle="mobile-menu-2"
            type="button"
            className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="mobile-menu-2"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            <svg
              className="hidden w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
        <div
          className="hidden justify-between items-center w-full md:flex md:w-auto md:order-1"
          id="mobile-menu-2"
        >
          <ul className="flex flex-col items-center md:flex-row mt-0 space-x-2">
            <li
              className={`${
                router.pathname === '/'
                  ? 'text-color-primary bg-color-primary/30 dark:bg-color-primary/10 '
                  : ''
              }rounded active:bg-color-active/40 dark:active:bg-color-active/5 hover:bg-gray-300/30 dark:hover:bg-gray-300/10`}
            >
              <Link href="/">
                <a className="flex items-center justify-center py-1 px-2">
                  首页
                </a>
              </Link>
            </li>
            <li
              className={`${
                router.pathname.includes('/software')
                  ? 'text-color-primary bg-color-primary/30 dark:bg-color-primary/10 '
                  : ''
              }rounded active:bg-color-active/40 dark:active:bg-color-active/5 hover:bg-gray-300/30 dark:hover:bg-gray-300/10`}
            >
              <Link href="/software">
                <a className="flex items-center justify-center py-1 px-2">
                  软件列表
                </a>
              </Link>
            </li>
            <li
              className={`${
                router.pathname.includes('/extensions')
                  ? 'text-color-primary bg-color-primary/30 dark:bg-color-primary/10 '
                  : ''
              }rounded active:bg-color-active/40 dark:active:bg-color-active/5 hover:bg-gray-300/30 dark:hover:bg-gray-300/10`}
            >
              <Link href="/extensions">
                <a className="flex items-center justify-center py-1 px-2">
                  插件列表
                </a>
              </Link>
            </li>
            <li
              className={`${
                  router.pathname.includes('/tools')
                  ? 'text-color-primary bg-color-primary/30 dark:bg-color-primary/10 '
                  : ''
              }rounded active:bg-color-active/40 dark:active:bg-color-active/5 hover:bg-gray-300/30 dark:hover:bg-gray-300/10`}
            >
              <Link href="/tools">
                <a className="flex items-center justify-center py-1 px-2">
                  线上工具
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
