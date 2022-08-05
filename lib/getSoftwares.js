import connectDB from '../db'
import Software from '../models/softwareModel'

const getSoftwares = async () => {
  try {
    await connectDB()
    const softwares = await Software.find({})
    return {
      status: 'OK',
      data: JSON.parse(JSON.stringify(softwares)),
    }
  } catch (error) {
    return { status: 'ERROR' }
  }
}

const createSoftware = async (params) => {
  try {
    await connectDB();

    // 需要做字段处理 安全性
    console.log(params)
    // await Software.create(params)

    return {
      status: 'OK'
    }
  } catch(error) {
    return {
      status: 'ERROR'
    }
  }
}

export default getSoftwares;
export {
  createSoftware
}