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

export default getSoftwares;