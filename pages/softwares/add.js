import { useState, Fragment } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import Header from '../../components/Header'
import { SOFTWARE_CATEGORIES, PLATFORM } from '../../constants/static'

export default function SoftwareAdd() {
  const [platforms, setPlatforms] = useState(() => {
    return PLATFORM.map((value) => {
      return { value, checked: value === 'Win' ? true : false }
    })
  })

  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: {
      urls: [
        { officialUrl: '', downloadUrl: '', platform: 'Win' },
      ],
    },
  })
  const { fields, update, append, remove } = useFieldArray({
    control,
    name: 'urls',
  })

  const onSubmit = async (params) => {
    const response = await fetch('/api/softwares/add', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
  }

  const onChangePlatform = (index) => {
    // 设置选中状态
    setPlatforms((prevState) => {
      const newState = prevState.map((item, i) => {
        if (index === i) {
          // 最少选择一个
          let len = prevState.filter((item) => item.checked).length
          if (len === 1 && item.checked) return item

          let nextChecked = !item.checked
          // 添加 or 删除字段
          if (nextChecked) {
            append({
              officialUrl: '',
              downloadUrl: '',
              platform: item.value,
            })
          } else {
            const _index = fields.findIndex(field => field.platform === item.value)
            remove(_index)
          }

          return { ...item, checked: nextChecked }
        }
        return item
      })
      return newState
    })
    // fields.map((field, i) => {
    //   if (i === index) {
    //     let len = fields.filter((item) => item.state).length
    //     if (len === 1 && field.state) return
    //     update(index, { ...field, state: !field.state })
    //   }
    // })
  }

  return (
    <>
      <div id="page__extension__add">
        <Header href="/extensions">添加软件</Header>
        <div className="content">
          <form className="max-w-2xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 grid-cols-4 mb-4">
              {platforms.map((item, index) => (
                <div key={item.value}>
                  <label htmlFor={`platform-${item.value}`}>
                    <input
                      className="mr-1"
                      type="checkbox"
                      checked={item.checked}
                      id={`platform-${item.value}`}
                      onChange={() => onChangePlatform(index)}
                    />
                    {item.value}
                  </label>
                </div>
              ))}
            </div>
            <div className="grid gap-4 grid-cols-12 mb-4">
              <label className="col-span-2">
                软件名称<span className="text-red-500"> * </span>
              </label>
              <input
                className="border-2 rounded col-span-10"
                type="text"
                {...register('name', { required: true })}
              />
            </div>
            {errors.name && (
              <p className="mb-4 text-red-500">请输入插件名称!</p>
            )}
            <div className="grid gap-4 grid-cols-12 mb-4">
              <label className="col-span-2">
                图标链接
              </label>
              <input
                className="border-2 rounded col-span-10"
                type="text"
                {...register('image')}
              />
            </div>
            {fields.map((field, index) => (
              <Fragment key={field.id}>
                <div className="grid gap-4 grid-cols-12 mb-4">
                  <label className="whitespace-nowrap col-span-2">
                    {field.platform}
                    <span className="text-red-500"> * </span>
                    <input type="text" hidden value={field.platform} {...register(`urls.${index}.platform`)} />
                  </label>
                  <div className="flex col-span-5">
                    <input
                      className="border-2 rounded w-full"
                      placeholder="请输入官网链接"
                      type="text"
                      {...register(`urls.${index}.officialUrl`)}
                    />
                  </div>
                  <div className="flex col-span-5">
                    <input
                      className="border-2 rounded w-full"
                      placeholder="请输入下载链接"
                      type="text"
                      {...register(`urls.${index}.downloadUrl`)}
                    />
                  </div>
                </div>
              </Fragment>
            ))}
            <div className="grid gap-4 grid-cols-12 mb-4">
              <label className="col-span-2">描述</label>
              <textarea
                cols="30"
                rows="2"
                className="col-span-10 border-2 rounded"
                {...register('description')}
              ></textarea>
            </div>
            <div className="grid gap-4 grid-cols-12 mb-4">
              <label className="col-span-2">
                分类<span className="text-red-500"> * </span>
              </label>
              <select
                className="col-span-10 outline-none ml-1 p-0.5 border rounded"
                {...register('category')}
              >
                {Object.keys(SOFTWARE_CATEGORIES).map(
                  (key) =>
                    key !== 'all' && (
                      <option key={key} value={key}>
                        {SOFTWARE_CATEGORIES[key]}
                      </option>
                    )
                )}
              </select>
            </div>
            <div className="flex mb-4">
              <label htmlFor="recommend">
                <input
                  className="mr-1"
                  type="checkbox"
                  id="recommend"
                  {...register('recommend')}
                />
                推荐
              </label>
            </div>
            <div className="flex mb-4">
              <label htmlFor="t-safe" className="mr-4">
                <input
                  className="mr-1"
                  type="radio"
                  id="t-safe"
                  {...register('isSafe', { required: true })}
                  value="safe"
                />
                安全
              </label>
              <label htmlFor="t-unsafe" className="mr-4">
                <input
                  className="mr-1"
                  type="radio"
                  id="t-unsafe"
                  {...register('isSafe', { required: true })}
                  value="unsafe"
                />
                不安全
              </label>
              <label htmlFor="t-unknown">
                <input
                  className="mr-1"
                  type="radio"
                  id="t-unknown"
                  {...register('isSafe', { required: true })}
                  value="unknown"
                />
                未知
              </label>
            </div>
            {errors.isSafe && (
              <p className="mb-4 text-red-500">请选择插件安全性!</p>
            )}
            <input
              type="submit"
              value="提交"
              className="bg-color-primary-reverse/80 hover:bg-color-primary-reverse/70 active:bg-color-primary-reverse/90 text-white py-1 px-2 rounded"
            />
          </form>
        </div>
      </div>
    </>
  )
}
