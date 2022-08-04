import connectDB from '../db'
import dbConnect from '../lib/dbConnect'
import Extension from '../models/extensionModel'

const getExtensions = async (params) => {
  try {
    await dbConnect()
    const browser = params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
    const data = await Extension.find(
      { browser },
      {
        browser: true,
        category: true,
        image: true,
        recommend: true,
        name: true,
        url: true
      }
    )
    return {
      status: 'SUCCESS',
      data: JSON.parse(JSON.stringify(data)),
    }
  } catch (error) {
    console.log(error)
    return {
      status: 'ERROR',
      error,
    }
  }
}

const getExtensionsHome = async (params) => {
  try {
    await dbConnect()
    const browser = params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
    const data = await Extension.find(
      { browser },
      {
        browser: true,
        category: true,
        image: true,
        recommend: true,
        name: true,
        url: true
      },
      {sort: {updatedAt: -1}}
    ).limit(9)

    return {
      success: true,
      data: JSON.parse(JSON.stringify(data))
    }
  } catch (error) {
    return {
      success: false,
    }
  }
}

const getExtensionDetail = connectDB(async (params) => {
  try {
    const { id } = JSON.parse(params)

    const data = await Extension.findById(id)

    return {
      status: 'OK',
      data: JSON.parse(JSON.stringify(data)),
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error,
    }
  }
})

const getAllExtensionIds = connectDB(async () => {
  try {
    console.time('getData')
    const data = await Extension.find({}, { _id: true })
    console.timeEnd('getData')

    return {
      status: 'OK',
      data: JSON.parse(JSON.stringify(data)),
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error,
    }
  }
})

export default getExtensions

export { getExtensionDetail, getAllExtensionIds, getExtensionsHome }
