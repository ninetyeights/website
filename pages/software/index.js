import { Fragment } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import { SoftwareCard } from '../../components/extensions/Card'
import { PLATFORM } from '../../constants/static'

export default function Software({ data }) {
  return (
    <div id="page__software relative">
      <div className="software_list flex space-x-4">
        <main className="flex-1">
          <Header>
            {/* <Image height={28} width={28} src={browserIcons[query.slug]} /> */}
            <span className="ml-2">软件列表</span>
          </Header>
          {Object.keys(data).map((key, index) => (
            <Fragment key={key}>
              <div className={`flex py-4 justify-between ${index > 0 ? 'mt-4' : ''}`}>
                <h2 className="text-xl">{data[key].name} 推荐</h2>
                <Link href={data[key].path}>
                  <a className="flex items-center justify-center text-color-primary bg-color-primary/30 hover:bg-color-primary/60 active:bg-color-active/50 rounded px-2.5 py-1">
                    查看全部
                    {/* <FontAwesomeIcon
                      className="ml-2"
                      icon={faArrowUpRightFromSquare}
                    /> */}
                  </a>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data[key].items
                  .map((item) => (
                    <SoftwareCard
                      id={item.id}
                      key={item.id}
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
        <aside className="hidden xl:block w-64">
          <h4 className="mt-6">侧边栏</h4>
        </aside>
      </div>
    </div>
  )
}

export const getServerSideProps = async () => {
  // const { data } = await getSoftwares()
  // const response = await fetch('http://127.0.0.1:8000/api/software/')
  const response = await fetch('https://ne-backend.ninetyeights.com/api/software/')
  const {data} = await response.json()

  if ('win' in data){
    data['win']['name'] = PLATFORM['win']
    data['win']['path'] = '/software/platform/win'
  }
  if ('mac-intel' in data){
    data['mac-intel']['name'] = PLATFORM['mac-intel']
    data['mac-intel']['path'] = '/software/platform/mac-intel'
  }
  if ('mac-apple' in data){
    data['mac-apple']['name'] = PLATFORM['mac-apple']
    data['mac-apple']['path'] = '/software/platform/mac-apple'
  }

  return {
    props: {
      data
    },
  }
}
