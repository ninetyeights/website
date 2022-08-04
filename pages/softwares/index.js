export default function Softwares() {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

  return (
    <div id="page__softwares">
      <div className="software__list flex space-x-4">
        <main className="flex-1">
          <h2 className="text-xl mb-2">软件列表</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {items.map((key) => (
              <div key={key} className="software__item flex items-center justify-between rounded-lg bg-gray-100/50 dark:bg-gray-100/5 p-4 hover:bg-color-primary/30 dark:hover:bg-color-primary/10">
                <div className="flex items-center">
                  <div className="bg-white dark:bg-white/5 mr-2 w-12 h-12 flex items-center justify-center rounded-xl">
                    {/*<img*/}
                    {/*  src="https://minimal-assets-api.vercel.app/assets/icons/ic_chrome.svg"*/}
                    {/*  alt=""*/}
                    {/*/>*/}
                  </div>
                  <div>
                    <h6 className="font-medium">Chrome</h6>
                    <div className="text-sm mt-1 space-x-2">
                      <span>Mac</span>
                      <span>Free</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm space-x-2">
                  <button className="hover:bg-color-primary/40 dark:hover:bg-color-primary/10 hover:text-color-primary active:bg-color-active/40 dark:active:bg-color-active/5 rounded py-1 px-2">查看</button>
                  <button className="hover:bg-color-primary/40 dark:hover:bg-color-primary/10 hover:text-color-primary active:bg-color-active/40 dark:active:bg-color-active/5 rounded py-1 px-2">下载</button>
                </div>
              </div>
            ))}
          </div>
        </main>
        <aside className="hidden xl:flex flex-none w-64">侧边栏</aside>
      </div>
    </div>
  )
}
