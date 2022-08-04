import connectDB from '../../../db'
import Extension from '../../../models/extensionModel'

const handler = async (req, res) => {
  try {
    let extensions = []
    if (req.body) {
      extensions = await Extension.find({}, req.body)
    } else {
      extensions = await Extension.find({})
    }

    res.json({
      status: 'OK',
      data: JSON.parse(JSON.stringify(extensions)),
    })
  } catch (error) {
    res.json({
      status: 'ERROR',
      error,
    })
  }
}

export default connectDB(handler)

const getExtensions = connectDB(async (params) => {
  try {
    if (Object.keys(params).length === 0) {
      // 请求全部
      const data = await Extension.find({})
      return {
        status: 'SUCCESS',
        data: JSON.parse(JSON.stringify(data)),
      }
    } else {
      const browser =
        params.slug[1].charAt(0).toUpperCase() + params.slug[1].slice(1)
      const data = await Extension.find({browser})
      return {
        status: 'SUCCESS',
        data: JSON.parse(JSON.stringify(data)),
      }
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error,
    }
  }
})

export { getExtensions }
