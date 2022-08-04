import Link from 'next/link'

function Header({children, href}) {
  return (
    <div className="relative">
      {href && <Link href={href}>
        <a className="absolute h-8 w-8 rounded-full flex justify-center items-center inset-y-1/2 -translate-y-2/4">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
        </a>
      </Link> }
      <h1 className="text-xl sm:text-2xl lg:text-3xl text-center py-6 font-medium flex items-center justify-center">
        {children}
      </h1>
    </div>
  )
}

export default Header
