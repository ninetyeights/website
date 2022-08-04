import Page from '../../components/tools/FacebookSearch'

const filterTypes = [
  {
    value: 'top',
    text: '全部',
  },
  {
    value: 'posts',
    text: '帖子',
  },
  {
    value: 'people',
    text: '用户',
  },
  {
    value: 'photos',
    text: '照片',
  },
  {
    value: 'videos',
    text: '视频',
  },
  {
    value: 'pages',
    text: '公共主页',
  },
  {
    value: 'places',
    text: '地点',
  },
  {
    value: 'groups',
    text: '小组',
  },
  {
    value: 'events',
    text: '活动',
  },
]

function FacebookSearchBox({ theme }) {
  return <Page theme={theme}></Page>
}

export default FacebookSearchBox
