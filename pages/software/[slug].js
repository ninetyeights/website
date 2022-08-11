import Image from 'next/image'
import Head from 'next/head'
import Header from '../../components/Header'
import { BACKEND_API } from '../../constants'
import { WEBSITE_NAME } from '../../constants/static'

export default function ExtensionDetail({ item }) {
  return (
    <div id="page__software_detail">
      <Head>
        <title>
          {item.name} - {WEBSITE_NAME}
        </title>
      </Head>
      <div className="content grid grid-cols-1 justify-self-center">
        <div className="w-1/2 mt-8 mb-8 flex justify-self-center justify-between items-center">
          <div className="flex">
            <Image
              className="rounded-lg"
              src={item.image}
              width="100%"
              height="100%"
              objectFit="contain"
            />
            <div className="ml-4">
              <h1 className="text-2xl mb-2 font-medium">{item.name}</h1>
              <p>{item.description}</p>
            </div>
          </div>
          <div className="block">
            <a
              className="block bg-600/90 hover:bg-700/80 active:bg-700/90 text-white py-2 px-3 rounded"
              target="_blank"
              href={item.official_url}
            >
              官网链接
            </a>
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-self-center items-center mb-8">
            <p className="mb-3 text-xl">下载链接</p>
            <div className="space-x-4">
                {item.download_url_win ? <a className="inline-flex py-2 px-3 rounded border hover:text-500 hover:border-500 active:bg-50" href={item.download_url_win}>Windows</a> : ''}
                {item.download_url_mac_intel ? <a className="inline-flex py-2 px-3 rounded border hover:text-600 hover:border-600 active:bg-50" href={item.download_url_mac_intel}>macOS (Intel)</a> : ''}
                {item.download_url_mac_apple ? <a className="inline-flex py-2 px-3 rounded border hover:text-600 hover:border-600 active:bg-50" href={item.download_url_mac_apple}>macOS (Apple Silicon)</a> : ''}
            </div>
        </div>
        <div className="w-1/2 flex flex-col justify-self-center"><p>需要做处理</p>{item.readme}</div>
        {/* <div className="flex justify-center mb-4">
          <a href="" className="bg-blue-200/50 text-blue-500 p-2 rounded mr-2">
            {data.browser}
          </a>
          <a
            href=""
            className="bg-green-200/50 text-green-500 p-2 rounded mr-2"
          >
            {data.category}
          </a>
          <a href="" className="bg-orange-200/50 text-orange-500 p-2 rounded">
            {data.isSafe}
          </a>
        </div> */}
        {/* <div className="w-2/4 mx-auto">{data.description}</div> */}
      </div>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const response = await fetch(`${BACKEND_API}/software/${params.slug}`)
  const { data } = await response.json()

  return {
    props: {
      item: data,
    },
  }
}
