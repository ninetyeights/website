import Header from '../../components/Header';
import { getExtensionDetail } from '../../lib/getExtensions';

export default function ExtensionDetail(data) {

    return (
        <div id="page__extension__detail">
            <Header>{data.name}</Header>
            <div className="content">
                <div className="flex justify-center mb-4">
                <a href={data.url} target="_blank"
                   className="bg-red-500 text-white py-2 px-4 text-lg rounded"
                   rel="noreferrer noopener nofollow">插件网址</a>
                    <a href="" className="bg-gray-400 text-white p-2 rounded mr-2">使用教程</a>
                    <a href="" className="bg-gray-500 text-white p-2 rounded mr-2">官网链接</a>
                    <a href="" className="bg-gray-500 text-white p-2 rounded">Github 链接</a>
                </div>
                <div className="flex justify-center mb-4">
                    <a href="" className="bg-blue-200/50 text-blue-500 p-2 rounded mr-2">{data.browser}</a>
                    <a href="" className="bg-green-200/50 text-green-500 p-2 rounded mr-2">{data.category}</a>
                    <a href="" className="bg-orange-200/50 text-orange-500 p-2 rounded">{data.isSafe}</a>
                </div>
                <div className="w-2/4 mx-auto">{data.description}</div>
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

export async function getServerSideProps({params}) {
    // const res = await fetch('http://localhost:3000/api/extensions/detail', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({id: params.id})
    // })
    // const {data} = await res.json()
    const {data} = await getExtensionDetail(JSON.stringify({id: params.id}))

    return {
        props: data
    }
}