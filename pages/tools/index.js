import Link from 'next/link';

export default function Tools() {
    return (
        <>
            <h2 className='text-2xl'><Link href='/tools/extract-links'>提取链接</Link></h2>
            <h2 className='text-2xl'><Link href='/tools/facebook-search'>Facebook 精确搜索</Link></h2>
        </>
    )
}