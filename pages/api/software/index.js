import connectDB from "../../../db";
import Software from "../../../models/softwareModel";

const handler = async(req, res) => {
  try {
    const { method } = req;
    if (method !== 'GET') res.json({status: 'ERROR', message: '不支持此方法'})
    await connectDB();
    const softwares = await Software.find({})
    res.json({
      status: 'OK',
      data: JSON.parse(JSON.stringify(softwares))
    })
  } catch(error) {
    res.json({
      status: 'ERROR'
    })
  }
}

export default handler;