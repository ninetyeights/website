import { Fragment, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Header from '../../components/Header'
import { SoftwareCard } from '../../components/extensions/Card'
import { PLATFORM, WEBSITE_NAME } from '../../constants/static'
import { BACKEND_API } from '../../constants'
// import { BACKEND_API } from '../../constants'

export default function Software({ data, platform }) {
  useEffect(() => {
    // console.log(API)
  }, [])
  return (
    <div id="page__software relative">
      <Head>
        <title>软件列表 - {WEBSITE_NAME}</title>
      </Head>
      <div className="software_list flex space-x-4">
        <main className="flex-1">
          <Header>
            {/* <Image height={28} width={28} src={browserIcons[query.slug]} /> */}
            <span className="ml-2">软件列表</span>
          </Header>
          <div className="hidden py-4 justify-between">
            <h2 className="text-xl">分类</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {platform.map((slug) => (
              <div key={slug} className="shadow rounded-lg bg-white/50 flex flex-col h-full">
                <img
                  className="rounded-t-lg"
                  src={PLATFORM[slug].thumbnail}
                  alt=""
                />
                <div className="px-4 py-3 flex flex-col h-full">
                  <h3 className="font-medium text-lg mb-1 hover:text-color-primary flex-none">
                    <Link href={`/software/platform/${slug}`}>
                      {PLATFORM[slug].name}
                    </Link>
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-4 grow mb-3">
                    {PLATFORM[slug].description}
                  </p>
                  <div className="flex-none">
                    <Link href={`/software/platform/${slug}`}>
                      <a className="px-2 py-1 rounded text-sm text-color-primary hover:bg-200/60 active:bg-200/90 inline-flex items-center">
                        <span>查看分类</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
</svg>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex py-4 justify-between">
            <h2 className="text-xl">推荐</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <SoftwareCard
                id={item.id}
                key={item.id}
                name={item.name}
                image={item.image}
                // url={item.urls.find(item => item.platform === )}
                browser={item.browser}
                category={item.category.name}
                checked={item.checked}
                hideChecked={true}
                path={`/software/${item.slug}`}
              />
            ))}
          </div>
        </main>
        <aside className="hidden xl:block w-64">
          <h4 className="mt-6">侧边栏</h4>
        </aside>
      </div>
    </div>
  )
}

export const getServerSideProps = async () => {
  // const { data } = await getSoftwares()
  // let baseUrl = 'http://127.0.0.1:8000/api'
  // console.log(process.env.BACKEND_API)
  // if (process.env.BACKEND_API) {
  //   baseUrl = process.env.BACKEND_API
  // }
  const response = await fetch(`${BACKEND_API}/software/`)
  // const response = await fetch('https://ne-backend.ninetyeights.com/api/software/')
  const { data, platform } = await response.json()

  return {
    props: {
      data,
      platform,
    },
  }
}
