import Head from 'next/head'
import Image from 'next/image'
import { BACKEND_API } from '../../constants'
import { WEBSITE_NAME } from '../../constants/static'
// import { getExtensionDetail } from '../../lib/getExtensions';

export default function ExtensionDetail({ item }) {
  return (
    <div id="page__extension_detail">
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
            <div className="mx-4">
              <h1 className="text-2xl mb-2 font-medium">{item.name}</h1>
              <p>{item.description}</p>
            </div>
          </div>
          <div className="block">
            <a
              className="block whitespace-nowrap bg-600/90 hover:bg-700/80 active:bg-700/90 text-white py-2 px-3 rounded"
              target="_blank"
              href={item.url}
            >
              打开插件
            </a>
          </div>
        </div>
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

//export async function getStaticPaths() {
//    const {data} = await getAllExtensionIds()
// const res = await fetch('http://localhost:3000/api/extensions', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({_id: true})
// });
// const {data} = await res.json()

//    const paths = data.map(item => {
//        return {params: {id: item._id}}
//    })

//    return {
//        paths,
//        fallback: false
//    }
//}

export async function getServerSideProps({ params }) {
  // const res = await fetch('http://localhost:3000/api/extensions/detail', {
  //     method: 'POST',
  //     headers: {
  //         'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({id: params.id})
  // })
  // const {data} = await res.json()
  // const {data} = await getExtensionDetail(JSON.stringify({id: params.id}))
  const response = await fetch(`${BACKEND_API}/extensions/${params.slug}`)
  const { data } = await response.json()

  return {
    props: {
      item: data,
    },
  }
}
