import { Fragment, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

import { getExtensionsHome } from '../../lib/getExtensions'
import Header from '../../components/Header'
import Card from '../../components/extensions/Card'
import {BROWSER_CATEGORIES} from '../../constants/static'

function BeforeExtensions({ items }) {
  const router = useRouter()
  const [data, setData] = useState(() => {
    return items.map((item) => ({ ...item, checked: false }))
  })
  const [keyword, setKeyword] = useState('')
  const [filterOptions, setFilterOptions] = useState('all')

  const changeSelect = (id) => {
    setData((prevState) =>
      prevState.map((item) => {
        if (item._id === id) {
          return { ...item, checked: !item.checked }
        }
        return item
      })
    )
  }

  const onFilter = (event) => {
    setFilterOptions(event.target.value)
  }

  return (
    <div id="page__extensions">
      <div className="extension__list flex space-x-4">
        <main className="flex-1">
          <Header href="/">浏览器扩展程序</Header>
          <div className="flex py-4 justify-between">
            <h2 className="text-xl">Chrome 扩展程序</h2>
            <Link href="/extensions/category/chrome">
              <a className="flex items-center justify-center text-color-primary bg-color-primary/30 hover:bg-color-primary/60 active:bg-color-active/50 rounded px-2.5 py-1">
                查看更多
                <FontAwesomeIcon
                  className="ml-2"
                  icon={faArrowUpRightFromSquare}
                />
              </a>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data
              .filter((item) => !item.recommend)
              .filter((item) =>
                filterOptions === ('all' || 'browser')
                  ? item
                  : item.browser === filterOptions
              )
              .filter((item) =>
                item.name.toLowerCase().includes(keyword.toLowerCase().trim())
              )
              .map((item) => (
                <Card
                  id={item._id}
                  key={item._id}
                  name={item.name}
                  image={item.image}
                  url={item.url}
                  browser={item.browser}
                  category={BROWSER_CATEGORIES[item.category]}
                />
              ))}
          </div>
        </main>
        <aside className="hidden xl:flex flex-none w-64">侧边栏</aside>
      </div>
    </div>
  )
}

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
                      id={item._id}
                      key={item._id}
                      name={item.name}
                      image={item.image}
                      url={item.url}
                      browser={item.browser}
                      category={BROWSER_CATEGORIES[item.category]}
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
  const { data: chrome = [] } = await getExtensionsHome({ slug: 'chrome' })
  const { data: firefox = [] } = await getExtensionsHome({ slug: 'firefox' })
  const { data: edge = [] } = await getExtensionsHome({ slug: 'edge' })
  const { data: safari = [] } = await getExtensionsHome({ slug: 'safari' })

  let obj = {}
  if (chrome.length) {
    obj['chrome'] = {
      name: 'Chrome',
      path: '/extensions/category/chrome',
      items: chrome,
    }
  }
  if (firefox.length) {
    obj['firefox'] = {
      name: 'Firefox',
      path: '/extensions/category/firefox',
      items: firefox,
    }
  }
  if (edge.length) {
    obj['edge'] = {
      name: 'Edge',
      path: '/extensions/category/edge',
      items: edge,
    }
  }
  if (safari.length) {
    obj['safari'] = {
      name: 'Safari',
      path: '/extensions/category/safari',
      items: safari,
    }
  }

  return {
    props: {
      data: obj,
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
