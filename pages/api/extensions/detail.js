import connectDB from "../../../db";
import Extension from "../../../models/extensionModel";

const handler = async (req, res) => {
    try {
        if (req.method !== 'POST') res.json({status: 'ERROR', message: `This method is not supported.`})

        const {id} = req.body;

        const data = await Extension.findById(id);

        res.json({
            status: 'OK',
            data: JSON.parse(JSON.stringify(data))
        })
    } catch (error) {
        res.json({
            status: 'ERROR',
            error
        })
    }
}

export default connectDB(handler);