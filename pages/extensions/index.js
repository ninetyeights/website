import { Fragment, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

// import { getExtensionsHome } from '../../lib/getExtensions'
import Header from '../../components/Header'
import Card from '../../components/extensions/Card'
import { BACKEND_API } from '../../constants'

export default function Extensions({ data }) {
  return (
    <div id="page__extensions">
      <div className="extension__list flex space-x-4">
        <main className="flex-1">
          <Header href="/">浏览器扩展程序</Header>
          {Object.keys(data).map((key, index) => (
            <Fragment key={key}>
              <div className={`flex py-4 justify-between ${index > 0 ? 'mt-4' : ''}`}>
                <h2 className="text-xl">{data[key].name} 最近更新</h2>
                <Link href={data[key].path}>
                  <a className="flex items-center justify-center text-color-primary bg-color-primary/30 hover:bg-color-primary/60 active:bg-color-active/50 rounded px-2.5 py-1">
                    查看全部
                    <FontAwesomeIcon
                      className="ml-2"
                      icon={faArrowUpRightFromSquare}
                    />
                  </a>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data[key].items
                  .map((item) => (
                    <Card
                      id={item.slug}
                      key={item.slug}
                      name={item.name}
                      image={item.image}
                      url={item.url}
                      browser={item.browser}
                      category={item.category.name}
                      hideChecked={true}
                    />
                  ))}
              </div>
            </Fragment>
          ))}
        </main>
        <aside className="hidden xl:flex flex-none w-64">侧边栏</aside>
      </div>
    </div>
  )
}

export const getServerSideProps = async () => {
  const response = await fetch(`${BACKEND_API}/extensions/`)
  const {data} = await response.json()

  let obj = {}
  if ('chrome' in data) {
    obj['chrome'] = {
      name: 'Chrome',
      path: '/extensions/category/chrome',
      items: data.chrome,
    }
  }
  if ('firefox' in data) {
    obj['firefox'] = {
      name: 'Firefox',
      path: '/extensions/category/firefox',
      items: data.firefox,
    }
  }
  if ('edge' in data) {
    obj['edge'] = {
      name: 'Edge',
      path: '/extensions/category/edge',
      items: data.edge,
    }
  }
  if ('safari' in data) {
    obj['safari'] = {
      name: 'Safari',
      path: '/extensions/category/safari',
      items: data.safari,
    }
  }

  return {
    props: {
      data: obj
    },
  }
}

// export const getStaticPaths = async () => {
//   const paths = [
//     {
//       params: {
//         slug: [],
//       },
//     },
//     {
//       params: {
//         slug: ['tag', 'chrome'],
//       },
//     },
//     {
//       params: {
//         slug: ['tag', 'firefox'],
//       },
//     },
//     {
//       params: {
//         slug: ['tag', 'edge'],
//       },
//     },
//     {
//       params: {
//         slug: ['tag', 'safari'],
//       },
//     },
//   ]

//   return {
//     paths,
//     fallback: false,
//   }
// }
