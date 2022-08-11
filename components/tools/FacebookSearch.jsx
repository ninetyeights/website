import {Fragment, useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/router';
import {useForm, useFieldArray} from 'react-hook-form';
import {RadioGroup, Switch, Listbox, Transition} from "@headlessui/react";
import {SelectorIcon, CheckIcon} from '@heroicons/react/outline';
import {OverlayScrollbarsComponent} from 'overlayscrollbars-react';
import "overlayscrollbars/css/OverlayScrollbars.css";

import Header from '../Header';
import {Button, ButtonText} from "../Buttons";
import {OverlayScrollbarsTextarea} from "../OverlayScrollbarsTextarea";

const separatorArr = [
    {
        text: '换行',
        value: '\n'
    }, {
        text: '空格',
        value: ' '
    }, {
        text: '制表',
        value: '\t'
    }
];

const typeArr = [{
    value: 'single',
    text: '单行'
}, {
    value: 'multi',
    text: '多行'
}];

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

function FacebookSearch({theme}) {
    // const router = useRouter();
    // const firstRender = useRef(true);
    const [filterName, setFilterName] = useState(() => {
        // if (router.query && router.query.filter) {
        //     return router.query.filter
        // }
        return 'top'
    });
    const [idText, setIdText] = useState('');
    const [keywordText, setKeywordText] = useState('');
    const [selectedSeparator, setSelectedSeparator] = useState(separatorArr[0]);
    const [genType, setGenType] = useState(typeArr[0].value);
    const [enabled, setEnabled] = useState(false);

    const {control, handleSubmit, reset} = useForm({});
    const {fields, append, update} = useFieldArray({
        control,
        name: 'items'
    });

    // useEffect( () => {
    //     if (!firstRender.current) {
    //         router.push({
    //             pathname: router.pathname,
    //             query: {
    //                 filter: filterName,
    //             }
    //         })
    //     } else {
    //         firstRender.current = false
    //     }
    // }, [filterName, firstRender])

    const onSubmit = () => {
        reset({
            items: []
        })
        const keywords = keywordText.split(selectedSeparator.value)
        const ids = idText.split(selectedSeparator.value)
        keywords.map(keyword => {
            if (keyword.trim() === '') return
            if (idText.trim() !== '') {
                ids.map(id => {
                    if (id.trim() === '') return
                    append({
                        keyword,
                        locationId: id,
                        clicked: false
                    })
                })
            } else {
                append({
                    keyword,
                    locationId: '',
                    clicked: false
                })
            }
        })
    }

    /*
        @description 切换开关时如果关闭则把数据的已点击状态关闭
     */
    const onSwitch = () => {
        setEnabled(prevState => {
            if (prevState) {
                fields.map((item, index) => update(index, {...item, clicked: false}))
            }
            return !prevState
        })
    }

    const genSearch = (keyword, id, index) => {
        if (!keyword) return
        let encoded;
        switch (filterName) {
            case 'top':
            case 'posts':
            case 'photos':
            case 'videos':
                encoded = btoa(`{"rp_location:0":"{\\"name\\":\\"location\\",\\"args\\":\\"` + id + `\\"}"}`);
                break;
            case 'people':
                encoded = btoa(`{"city:0":"{\\"name\\":\\"users_location\\",\\"args\\":\\"` + id + `\\"}"}`);
                break;
            case 'places':
                encoded = btoa(`{"enable_place_location_ids:0":"{\\"name\\":\\"place_location\\",\\"args\\":\\"` + id + `\\"}"}`);
                break;
            case 'pages':
                encoded = btoa(`{"filter_pages_location:0":"{\\"name\\":\\"filter_pages_location\\",\\"args\\":\\"` + id + `\\"}"}`);
                break;
            case 'groups':
                encoded = btoa(`{"filter_groups_location:0":"{\\"name\\":\\"filter_groups_location\\",\\"args\\":\\"` + id + `\\"}"}`)
                break;
            case 'events':
                encoded = btoa(`{"rp_events_location:0":"{\\"name\\":\\"filter_events_location\\",\\"args\\":\\"` + id + `\\"}"}`)
                break;
            default:
                encoded = undefined;
        }

        if (index !== undefined && enabled) {
            update(index, {...fields[index], clicked: true})
        }

        if (filterName === 'top' || idText.trim() === '' || encoded === undefined) {
            window.open(`https://www.facebook.com/search/${filterName}?q=${keyword}`, '_blank')
        } else {
            encoded = encodeURIComponent(encoded);
            window.open(`https://www.facebook.com/search/${filterName}?q=${keyword}&filters=${encoded}`, '_blank')
        }
    }

    return (<div className='facebook-precise-search'>
        <Header href="/tools">Facebook 自定义搜索</Header>
        <div className="content grid grid-cols-12 gap-4">
            <aside className="col-span-12 sm:col-span-6 lg:col-span-2 shadow-lg border dark:border-slate-800 rounded-lg">
                <OverlayScrollbarsComponent options={{
                    className: `${theme ? 'os-theme-light' : 'os-theme-dark'}`,
                    scrollbars: {
                        autoHide: 'leave'
                    }
                }}>
                    <div className="p-4">
                        <RadioGroup value={filterName} onChange={setFilterName}>
                            <RadioGroup.Label className="flex font-bold mx-3 mb-2">筛选条件</RadioGroup.Label>
                            {filterTypes.map((item, index) => (
                                <RadioGroup.Option key={index} value={item.value}
                                                   className={({checked}) => `rounded outline-none py-1.5 px-3 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-800/80 border-b-2 ${checked ? 'bg-slate-100 dark:bg-slate-800 border-primary rounded-b-none' : 'border-transparent'}`}
                                >
                                    {
                                        ({checked}) => (
                                            <div className="flex justify-between">
                                                <span className="select-none">{item.text}</span>
                                                {checked && <div className="text-color-primary rounded-full">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                                                         fill="none"
                                                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                </div>}
                                            </div>
                                        )
                                    }
                                </RadioGroup.Option>
                            ))}
                        </RadioGroup>
                    </div>
                </OverlayScrollbarsComponent>
            </aside>
            <main className="col-span-12 lg:col-span-10 shadow-lg border dark:border-slate-800 rounded-lg"> {/* p-8 flex flex-col items-center*/}
                <OverlayScrollbarsComponent options={{
                    scrollbars: {
                        autoHide: 'scroll'
                    }
                }}>
                    <form className="w-full lg:w-4/5 xl:w-2/3 mx-auto p-4 lg:py-8" onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 space-y-2 lg:space-y-0">
                            <RadioGroup value={genType} onChange={setGenType} className="flex">
                                {typeArr.map((item, index) => (
                                    <RadioGroup.Option className={({checked, active}) => `
                                    outline-none rounded border-b-2 rounded-b-none px-1.5 py-0.5 cursor-pointer hover:bg-color-primary/50 dark:hover:bg-color-primary/10 hover:text-color-primary active:bg-color-primary/80 dark:active:bg-color-primary/5
                                    ${checked ? `text-color-primary border-primary hover:border-primary` : 'border-transparent hover:border-none'}
                                `} key={index} value={item.value}>{item.text}</RadioGroup.Option>
                                ))}
                            </RadioGroup>
                            {genType === 'multi' &&
                                <div className="flex items-center">
                                    <Listbox value={selectedSeparator} onChange={setSelectedSeparator}>
                                        <Listbox.Label className="mr-2">请选择分割符:</Listbox.Label>
                                        <div className="relative w-20">
                                            <Listbox.Button
                                                className="flex items-center justify-between w-full cursor-pointer rounded border text-left px-1.5 py-0.5">
                                                <span className="block truncate">{selectedSeparator.text}</span>
                                                <span className="pointer-events-none flex items-center">
                                                <SelectorIcon className="h-4 w-4" aria-hidden="true"/>
                                            </span>
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options
                                                    className="absolute overflow-auto rounded shadow-lg w-full bg-white dark:bg-slate-800 py-1 mt-1 border z-10">
                                                    {separatorArr.map((item, index) => (
                                                        <Listbox.Option
                                                            key={index}
                                                            className={({active}) =>
                                                                `relative cursor-pointer select-none pl-6 py-0.5 ${
                                                                    active ? 'bg-color-primary/30 dark:bg-color-primary/10 text-color-primary' : ''
                                                                }`
                                                            }
                                                            value={item}
                                                        >
                                                            {({selected}) => (
                                                                <>
                                                          <span
                                                              className={`block truncate ${
                                                                  selected ? 'font-medium' : 'font-normal'
                                                              }`}
                                                          >
                                                            {item.text}
                                                          </span>
                                                                    {selected ? (
                                                                        <span
                                                                            className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-color-primary">
                                                                        <CheckIcon className="h-4 w-4"
                                                                                   aria-hidden="true"/>
                                                                    </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>
                                </div>}
                        </div>
                        {genType === 'single' ? (
                            <Fragment>
                                <input placeholder="请输入关键字" value={keywordText}
                                       onChange={(e) => setKeywordText(e.target.value)}
                                       className="focus:outline-none focus:bg-white dark:focus:bg-slate-800/50 bg-gray-100 dark:bg-slate-800 appearance-none border-2 border-gray-100 dark:border-transparent focus:border-primary dark:focus:border-primary/50 w-full rounded py-1 px-2 mb-4"></input>
                                {filterName !== 'top' &&
                                    <input placeholder="请输入地区ID" value={idText}
                                           onChange={(e) => setIdText(e.target.value)}
                                           className="focus:outline-none focus:bg-white dark:focus:bg-slate-800/50 bg-gray-100 dark:bg-slate-800 appearance-none border-2 border-gray-100 dark:border-transparent focus:border-primary dark:focus:border-primary/50 w-full rounded py-1 px-2 mb-4"></input>}
                                <Button
                                    className="flex items-center whitespace-nowrap px-2 py-1 float-right space-x-0.5"
                                    onClick={() => genSearch(keywordText, idText)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                         viewBox="0 0 24 24"
                                         stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                    <span>搜索</span>
                                </Button>
                            </Fragment>
                        ) : (
                            <Fragment>
                                <div className="flex flex-col lg:flex-row lg:space-x-4">
                                    <OverlayScrollbarsTextarea placeholder="请输入关键字" value={keywordText}
                                                               onChange={(v) => setKeywordText(v)}
                                                               options={{
                                                                   scrollbars: {
                                                                       autoHide: 'leave'
                                                                   }
                                                               }}
                                                               className="focus:outline-none focus:bg-white dark:focus:bg-slate-800/50 bg-gray-100 dark:bg-slate-800 appearance-none border-2 border-gray-100 dark:border-transparent focus:border-primary block w-full rounded h-24 py-1 px-2 resize-none mb-4"
                                    ></OverlayScrollbarsTextarea>
                                    {filterName !== 'top' && <OverlayScrollbarsTextarea placeholder="请输入地区ID" value={idText}
                                                                       onChange={(v) => setIdText(v)}
                                                                            options={{
                                                                                scrollbars: {
                                                                                    autoHide: 'leave'
                                                                                }
                                                                            }}
                                                                       className="focus:outline-none focus:bg-white dark:focus:bg-slate-800/50 bg-gray-100 dark:bg-slate-800 appearance-none border-2 border-gray-100 dark:border-transparent focus:border-primary block w-full rounded h-24 py-1 px-2 resize-none mb-4"></OverlayScrollbarsTextarea>}
                                </div>
                                <Button
                                    className="flex items-center whitespace-nowrap px-2 py-1 float-right space-x-0.5 keyframeAnimation"
                                    type="submit">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                         viewBox="0 0 24 24"
                                         stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                    </svg>
                                    <span>生成</span>
                                </Button>
                            </Fragment>
                        )}
                        <div className="clear-both"></div>
                        {genType === 'multi' && fields.length ? <Fragment>
                            <div className="grid grid-cols-12 gap-4 mb-2 mt-4">
                                <span className={`${filterName === 'top' ? 'col-span-10' : 'col-span-5'}`}>关键字</span>
                                {filterName !== 'top' && <span className="col-span-5">地区ID</span>}
                                <div className="relative flex items-center justify-center col-span-2">
                                    <Switch
                                        checked={enabled}
                                        onChange={() => onSwitch()}
                                        className={`${
                                            enabled ? 'bg-color-primary-reverse/80' : 'bg-gray-200'
                                        } inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors focus:outline-none focus:ring-indigo-500 focus:ring-offset-2 group`}
                                    >
                                  <span
                                      className={`${
                                          enabled ? 'translate-x-5' : 'translate-x-0.5'
                                      } inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform`}
                                  />
                                        <div
                                            className="absolute left-2/4 -translate-x-2/4 bottom-2 flex flex-col items-center hidden mb-6 group-hover:flex">
                                        <span
                                            className="relative z-10 p-2 text-xs leading-none text-white whitespace-nowrap bg-black/80 shadow-lg rounded">标记已点击的内容</span>
                                            <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
                                        </div>
                                    </Switch>
                                </div>
                            </div>
                            <ul>
                                {fields.map((item, index) => (
                                    <li key={item.id} className="grid grid-cols-12 gap-4 mb-2">
                                        <input
                                            className={`${item.clicked ? 'line-through bg-gray-300 dark:bg-black border-gray-300 dark:border-transparent' : 'bg-gray-100 dark:bg-slate-800 border-gray-100 dark:border-slate-800'} focus:outline-none focus:bg-white dark:focus:bg-slate-800/50 appearance-none border-2 focus:border-primary dark:focus:border-primary/50 rounded px-2.5 py-1 ${filterName === 'top' ? 'col-span-10' : 'col-span-5'}`}
                                            disabled={item.clicked}
                                            defaultValue={item.keyword} type="text"/>
                                        {filterName !== 'top' &&
                                            <input
                                                className={`${item.clicked ? 'line-through bg-gray-300 dark:bg-black border-gray-300 dark:border-transparent' : 'bg-gray-100 dark:bg-slate-800 border-gray-100 dark:border-slate-800'} focus:outline-none focus:bg-white dark:focus:bg-slate-800/50 appearance-none border-2 focus:border-primary dark:focus:border-primary/50 rounded px-2.5 py-1 col-span-5`}
                                                disabled={item.clicked}
                                                defaultValue={item.locationId}
                                                type="text"/>}
                                        {/*<button className="col-span-2 whitespace-nowrap px-1 rounded text-color-primary hover:bg-color-primary/30 dark:hover:bg-color-primary/10 active:bg-color-active/40 dark:active:bg-color-active/5" onClick={() => genSearch(item.keyword, item.locationId)}>打开</button>*/}
                                        <ButtonText className={`col-span-2 ${item.clicked ? 'cursor-not-allowed' : ''}`}
                                                    disabled={item.clicked}
                                                    onClick={() => genSearch(item.keyword, item.locationId, index)}>打开</ButtonText>
                                        {/*<button className="col-span-1 whitespace-nowrap flex items-center justify-center rounded hover:bg-gray-300/30 dark:hover:bg-gray-300/10" onClick={() => remove(index)}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>*/}
                                        {/*    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />*/}
                                        {/*</svg></button>*/}
                                    </li>
                                ))}
                            </ul>
                        </Fragment> : ''}
                    </form>
                </OverlayScrollbarsComponent>
            </main>
        </div>
    </div>)
}

export default FacebookSearch;