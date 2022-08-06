import { useState, useEffect, useRef } from 'react'
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faMagnifyingGlass,
  faFilter,
} from '@fortawesome/free-solid-svg-icons'
import { SoftwareCard } from '../../components/extensions/Card'
import Header from '../../components/Header'
// import getSoftwares from '../../lib/getSoftwares'
import { SOFTWARE_CATEGORIES, PLATFORM } from '../../constants/static'

const browserIcons = {
  chrome:
    'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_(February_2022).svg',
  firefox:
    'https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo,_2019.svg',
  edge: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_(2019).svg',
  safari:
    'https://upload.wikimedia.org/wikipedia/commons/5/52/Safari_browser_logo.svg',
}

export default function Software({ items }) {
  console.log(items)
  const { query, asPath, replace } = useRouter()

  const [data, setData] = useState(() => {
    return items.map((item) => ({ ...item, checked: false }))
  })
  const [keyword, setKeyword] = useState('')
  const [selectedAll, setSelectedAll] = useState(false)
  const [categoriesName, setCategoriesName] = useState({})
  const [currentCategory, setCurrentCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('Win')

  const isFirstLoaded = useRef(true)
  const isFirstLoaded1 = useRef(true)

  useEffect(() => {
    const splitUrl = asPath.split('#')
    setCurrentCategory(splitUrl.length === 1 ? 'all' : splitUrl.at(-1))
  }, [asPath])

  useEffect(() => {
    if (isFirstLoaded1.current) {
      isFirstLoaded1.current = false
      return
    }
    setData(items.map((item) => ({ ...item, checked: false })))
    updateCategory()
    setCurrentCategory('all')
  }, [items])

  useEffect(() => {
    if (isFirstLoaded.current) {
      updateCategory()
      isFirstLoaded.current = false
      return
    }
    let tmpData = data.filter((item) => item.recommend)
    let dataLen = tmpData.length
    let arrChecked = []
    tmpData.map((item) => item.checked && arrChecked.push(1))

    if (dataLen === arrChecked.length) {
      setSelectedAll(true)
    }
    if (dataLen !== arrChecked.length && selectedAll) {
      setSelectedAll(false)
    }
  }, [data])

  const updateCategory = () => {
    let _categories = items
      .filter((item) => !item.recommend)
      .map((item) => item.category)
    _categories = new Set(_categories)
    let obj = {
      all: '全部',
    }
    Array.from(_categories).map((key) => {
      obj[key] = SOFTWARE_CATEGORIES[key]
    })
    if (JSON.stringify(obj) !== JSON.stringify(categoriesName)) {
      setCategoriesName(obj)
    }
  }

  const onSelectAll = () => {
    isFirstLoaded.current = true
    setSelectedAll((prevState) => {
      const selectedState = !prevState
      setData((prevStateData) => {
        return prevStateData.map((item) => {
          if (item.recommend) {
            return { ...item, checked: selectedState }
          }
          return item
        })
      })
      return selectedState
    })
  }

  const onChangeCategory = (e) => {
    const val = e.target.value
    const splitUrl = asPath.split('#')
    replace(val === 'all' ? splitUrl[0] : splitUrl[0] + '#' + val)
  }

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

  const pop = (url, w, h) => {
    const popup = window.open(url, '_blank')
    return popup !== null && typeof popup !== 'undefined'
  }

  const onOpenSelected = () => {
    selected().map((item) => {
      const matched = item.urls.filter(
        (item) => item.platform === selectedPlatform
      )
      if (matched.length) {
        const { downloadUrl } = matched[0]
        if (downloadUrl.trim() !== '' && !pop(downloadUrl)) {
          alert('请允许浏览器打开多窗口')
        }
      }
      // if (downloadUrl.trim() !== '' && !pop(item.url)) {
      //   alert('请允许浏览器打开多窗口')
      // }
    })
  }

  const selected = () => data.filter((item) => item.checked)

  const onChangePlatform = (e) => {
    setSelectedPlatform(e.target.value)
  }

  return (
    <div id="page__extensions relative">
      <div className="extension__list flex space-x-4">
        <main className="flex-1">
          <Header>
            {/* <Image height={28} width={28} src={browserIcons[query.slug]} /> */}
            <span className="ml-2">软件列表</span>
          </Header>
          <div className="mb-4 relative flex items-center justify-center space-x-4">
            <span className="text-xl absolute left-0">推荐</span>
            <label
              htmlFor="selectAll"
              className="flex items-center relative cursor-pointer"
            >
              <input
                className="check-input w-5 h-5 mr-1 appearance-none border-2 border-primary/70 rounded"
                type="checkbox"
                id="selectAll"
                checked={selectedAll}
                onChange={onSelectAll}
              />
              <FontAwesomeIcon
                icon={faCheck}
                className="left-0 check-icon absolute w-5 h-5 text-opacity-0 text-primary transition-all duration-500"
              />
              <span className="select-none">全选</span>
            </label>
          </div>
          <div className="recommend grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data
              .filter((item) => item.recommend)
              .map((item) => (
                <SoftwareCard
                  id={item.id}
                  key={item.id}
                  name={item.name}
                  image={item.image}
                  url={item.url}
                  browser={item.browser}
                  category={item.category}
                  changeSelect={changeSelect}
                  checked={item.checked}
                />
              ))}
          </div>
          <div className="flex py-4 justify-between">
            <h2 className="text-xl">其他</h2>
            <div className="flex items-center">
              <FontAwesomeIcon
                className="h-4 w-4 mr-1"
                icon={faMagnifyingGlass}
              />
              <input
                className="mr-2 border rounded px-1 dark:bg-gray-800"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="text"
              />
              <FontAwesomeIcon className="w-4 h-4" icon={faFilter} />
              <select
                className="outline-none ml-1 p-0.5 border rounded dark:bg-gray-800"
                value={currentCategory}
                onChange={onChangeCategory}
              >
                <option value="category" hidden disabled>
                  分类
                </option>
                {Object.entries(categoriesName).map(([value, text], index) => (
                  <option key={index} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data
              .filter((item) => !item.recommend)
              .filter((item) =>
                currentCategory === 'all'
                  ? item
                  : item.category === currentCategory
              )
              .filter((item) =>
                item.name.toLowerCase().includes(keyword.toLowerCase().trim())
              )
              .map((item) => (
                <SoftwareCard
                  id={item.id}
                  key={item.id}
                  name={item.name}
                  image={item.image}
                  url={item.url}
                  browser={item.browser}
                  category={item.category}
                  changeSelect={changeSelect}
                  checked={item.checked}
                />
              ))}
          </div>
        </main>
        <aside className="hidden xl:block w-64">
          <h4 className="mt-6">侧边栏</h4>
        </aside>
      </div>
      {selected().length ? (
        <div className="extension__popup shadow rounded-md bg-300/30 backdrop-blur-sm h-12 container px-64 z-30 fixed bottom-2 flex items-center justify-between">
          <h4>已选择: {selected().length}</h4>
          <select
            value={selectedPlatform}
            onChange={onChangePlatform}
            className="outline-none ml-1 p-0.5 border rounded dark:bg-gray-800"
          >
            {PLATFORM.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            className="hover:bg-300/70 px-3 py-1.5 rounded active:bg-300/90"
            onClick={() => onOpenSelected()}
          >
            下载所选软件
          </button>
        </div>
      ) : (
        ''
      )}
    </div>
  )
}

export const getServerSideProps = async () => {
  // const { data } = await getSoftwares()
  const response = await fetch('https://ne-backend.ninetyeights.com/api/software/')
  const res = await response.json()

  return {
    props: {
      items: res,
    },
  }
}
