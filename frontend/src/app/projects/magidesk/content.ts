// Product facts verified against MagiDesk/README.zh-CN.md and Pages/WindowDragPage.xaml.
// Downloads resolve through the cached release API; README version badges may lag releases.
export const product = {
  github: 'https://github.com/ninetyeights/MagiDesk',
  releases: 'https://github.com/ninetyeights/MagiDesk/releases',
  download: '/downloads/magidesk/windows',
  issues: 'https://github.com/ninetyeights/MagiDesk/issues',
  guide: 'https://github.com/ninetyeights/MagiDesk/blob/main/docs/RELEASE.md',
};
export type FeatureId = 'drag' | 'snap' | 'zones' | 'grid' | 'badges' | 'dock' | 'boxes';
export type Capability = { id: string; name: string; description: string; keys: string[]; steps: [string, string, string, string] };
export type Feature = { id: FeatureId; name: string; short: string; description: string; capabilities: Capability[] };
export const features: Feature[] = [
  { id: 'drag', name: '窗口拖动', short: '不必寻找标题栏', description: '按住修饰键，从窗口内容区直接移动或缩放。让手停在正在工作的地方。', capabilities: [
    { id: 'move', name: '任意位置移动', description: '默认按住 Alt + 鼠标左键，从窗口内部拖动整个窗口。移动与缩放的修饰键均可在应用设置中自定义。', keys: ['Alt', '左键拖动'], steps: ['找到窗口内容区', '按住修饰键与左键', '从内容区拖动整个窗口', '松开鼠标，窗口留在新位置'] },
    { id: 'resize', name: '右键缩放', description: '默认按住 Alt + 鼠标右键，从窗口内部调整大小；缩放方向取决于光标所在象限。移动与缩放的修饰键均可在应用设置中自定义。', keys: ['Alt', '右键拖动'], steps: ['光标位于窗口右下象限', '按住修饰键与右键', '向右下拖动，放大窗口', '松开鼠标，保留新的尺寸'] },
  ] },
  { id: 'snap', name: '边缘吸附', short: '靠近一点，刚好对齐', description: '移动窗口时，对齐工作区、相邻窗口或中线。吸附距离与目标可以在应用中设置。', capabilities: [
    { id: 'screen', name: '工作区边缘', description: '拖动到屏幕工作区边缘，窗口贴边停靠，保留任务栏空间。', keys: ['Alt', '左键拖动'], steps: ['窗口离工作区边缘还有距离', '按住 Alt 开始移动', '靠近边缘，出现吸附提示', '窗口吸附到工作区左边缘'] },
    { id: 'window', name: '其他窗口边缘', description: '以旁边的窗口为参照，沿可见边界吸附排列。', keys: ['Alt', '左键拖动'], steps: ['以右侧窗口为参照', '拖动左侧窗口', '两扇窗口的边缘靠近', '窗口边缘相接，摆放更整齐'] },
    { id: 'guides', name: '对齐线提示', description: '同侧边与中线的参考线，让对齐结果看得见。', keys: ['Alt', '左键拖动'], steps: ['两扇窗口尚未对齐', '上下移动左侧窗口', '中线重合，显示参考线', '沿中线对齐，松手定位'] },
  ] },
  { id: 'zones', name: '窗口分区', short: '为每块屏幕安排布局', description: '用分区承接窗口；用切割、分隔条和命名布局，安排自己的工作空间。', capabilities: [
    { id: 'place', name: '拖动入区', description: '拖动时按住 Shift，布局浮现；移入目标分区后松手，窗口填满区域。', keys: ['Shift', '拖动入区'], steps: ['准备移动窗口', '按住 Shift，显示分区', '拖入高亮的目标区域', '松手，窗口填满目标分区'] },
    { id: 'edit', name: '编辑布局', description: '在桌面覆盖层中切割分区、重置网格与平均分配；右键分割线可设置全局联动或局部移动。', keys: ['切割', '拖动分隔线'], steps: ['打开布局编辑器', '点击切割，将区域一分为二', '拖动分隔线，调整左右比例', '保存适合当前任务的分区比例'] },
    { id: 'layout', name: '切换布局', description: '按住 Shift 拖动窗口时，滚动鼠标滚轮切换布局；画面顶部显示当前布局名称，松手后窗口进入目标分区。', keys: ['Shift', '拖动', '鼠标滚轮'], steps: ['准备移动窗口，当前为主辅布局', '按住 Shift 拖动窗口，显示当前分区', '保持拖动并滚动鼠标滚轮，切换到三栏布局', '松手，窗口填满三栏布局的目标分区'] },
    { id: 'monitors', name: '多屏分配', description: '为不同显示器分配不同布局；左屏两栏，右屏主区域与辅助区域。', keys: ['Shift', '拖动入区'], steps: ['两块屏幕分别使用两栏与主辅布局', '在显示器 1，将笔记窗口拖入左栏', '笔记填满左栏；在显示器 2 拖动浏览器进入主区域', '两个窗口分别填满各自屏幕的目标分区'] },
  ] },
  { id: 'grid', name: '快速网格', short: '框出你想要的大小', description: '唤出网格，拖出一个矩形，当前窗口就铺到对应范围。', capabilities: [
    { id: 'select', name: '当前屏幕', description: '按 Ctrl + Shift + G 唤出快速网格面板，仅展示当前屏幕，在网格预览中框选并应用。', keys: ['Ctrl', 'Shift', 'G'], steps: ['选中当前窗口', '按下快捷键，唤出网格', '光标拖选矩形区域', '松手，窗口铺到选中范围'] },
    { id: 'screens', name: '多个屏幕', description: '每块显示器可设置不同的网格密度：演示中的三块 16:9 屏幕分别使用 2×2、4×3 和 6×4 网格。', keys: ['Ctrl', 'Shift', 'G'], steps: ['按快捷键唤出快速网格', '展示三块屏幕各自的网格', '在 DISPLAY1 的 6×4 网格中框选区域', '在 6×4 屏幕框选四格，窗口填满选区'] },
    { id: 'center', name: '窗口居中', description: '使用快速网格的一键居中，将当前窗口移到工作区中央。', keys: ['一键居中'], steps: ['窗口偏在工作区一侧', '选择一键居中', '保持尺寸，移动到中央', '窗口居中，大小保持不变'] },
  ] },
  { id: 'badges', name: '浏览器微标', short: '同一个浏览器，不同身份', description: '用跟随窗口的 profile 头像区分账号，支持 Chrome、Edge、Brave、Vivaldi 和 Opera。', capabilities: [
    { id: 'avatar', name: '尺寸与名称', description: '微标高度支持 20–64px，宽度随名称自适应。关闭 Profile 名称后，胶囊收缩为头像。', keys: ['20–64px', 'Profile 名称'], steps: ['24px 小尺寸微标', '放大到 40px，显示 Profile 名称', '放大到 64px，突出账号身份', '关闭名称，胶囊收缩为头像'] },
    { id: 'position', name: '浏览器位置', description: '不同浏览器可以保存各自的位置。演示依次移动 Chrome 和 Edge 微标，彼此的位置互不影响。', keys: ['按浏览器调整'], steps: ['浏览器分别使用自己的微标', '移动 Chrome 微标，Edge 保持原位', '移动 Edge 微标，Chrome 保持原位', '每种浏览器保留自己的位置'] },
    { id: 'style', name: '头像样式', description: '自动展示颜色、形状、渐变和拼色变化，最后演示应用图片头像。图片为示意素材。', keys: ['颜色', '形状', '图片头像'], steps: ['蓝色圆形文字头像', '紫色渐变与圆角方形', '六边形头像与双色拼色', '应用示例图片作为头像'] },
    { id: 'copy', name: '穿透与复制', description: '默认鼠标穿透微标，不遮挡下方浏览器操作；按住 Ctrl 点击头像，快速复制 Profile 名称。', keys: ['Ctrl', '点击头像'], steps: ['默认穿透，鼠标可操作微标下方的浏览器', '点击下方标签页，浏览器正常响应', '按住 Ctrl 点击头像，复制 Profile 名称', '已复制「工作 · 林」，松开 Ctrl 恢复穿透'] },
  ] },
  { id: 'dock', name: 'Dock', short: '账号与应用，一处到达', description: '把浏览器账号与普通应用放在一起，悬停预览，点击打开或聚焦对应窗口。', capabilities: [
    { id: 'mode', name: 'Dock 与任务栏', description: 'Dock 保持在顶部，切换为任务栏时预留空间，下方窗口向下移动，避免被遮挡。', keys: ['悬浮 Dock', '顶部任务栏'], steps: ['顶部悬浮 Dock，账号与应用混排', 'Dock 保持顶部位置，悬浮时不占工作区', '切换顶部任务栏，为窗口预留空间', '窗口避开任务栏，常用项目仍在手边'] },
    { id: 'overflow', name: '换行与滚动', description: '项目增多时可自动换行，也可保持单行并滚动查看。顶部 Dock 依次展示换行和往返滚动。', keys: ['自动换行', '滚轮滚动'], steps: ['常用项目排列在 Dock 中', '更多项目加入，自动换成两行', '切换单行滚动，保留紧凑高度', '向后滚动查看项目，再滚回开头'] },
    { id: 'groups', name: '分组样式', description: '用留白、分隔线、分组名称或圆角面板区分项目。演示自动切换四种分组样式。', keys: ['分组外观'], steps: ['留白分组，保持轻盈', '分隔线，让组间边界更清晰', '显示分组名称，区分工作与生活', '圆角面板，将同组项目放在一起'] },
  ] },
  { id: 'boxes', name: '桌面盒子', short: '文件有位置，桌面有留白', description: '手动整理文件，按页查看，或映射已有目录。启用前请阅读发布说明中的恢复方式。', capabilities: [
    { id: 'organize', name: '手动整理', description: '选中文件，再拖入指定盒子。这里演示的是用户手动归类，不是自动分类。', keys: ['选中文件', '拖入盒子'], steps: ['用户选择桌面上的设计稿', '按住左键拖动文件', '拖入“设计资料”盒子', '用户松手，文件归入指定盒子'] },
    { id: 'collapse', name: '折叠与展开', description: '自动演示收起盒子，再展开查看文件；另一盒子保持展开。', keys: ['点击折叠 / 展开'], steps: ['两个盒子分别放置资料', '点击标题栏，收起设计资料', '再次点击，展开设计资料', '两个盒子展开，继续查看文件'] },
    { id: 'classify', name: '自动归类', description: '应用规则后自动生成分类分页，按扩展名等条件分类显示；不会移动或复制实际文件，未匹配项归入“其他”。', keys: ['应用规则', '生成分类分页'], steps: ['盒子内混合显示不同类型文件', '应用扩展名规则，生成分类分页', '生成文档、图片和其他分页', '切换图片分页，实际文件路径不变'] },
  ] },
];
export const zoneResetSequence = [{ rows: 2, columns: 2 }, { rows: 2, columns: 2 }, { rows: 2, columns: 3 }, { rows: 3, columns: 3 }] as const;
export type ZoneEditAction = 'cut' | 'reset' | 'even' | 'global' | 'local';
// Verified against ZoneEditorWindow.xaml(.cs), including grid limits and divider linking.
export const zoneEditorActions: (Capability & { id: ZoneEditAction })[] = [
  { id: 'cut', name: '切割与调整', description: '按截图中的局部切割模式，点击切开区域，再拖动分割线调整比例。', keys: ['左键切割', '拖动分割线'], steps: ['打开 Zone 编辑器，显示当前区域', '点击预览切割线，将区域一分为二', '拖动分割线，调整左右比例', '分区比例已调整，可在应用中保存布局'] },
  { id: 'reset', name: '重置网格', description: '自动演示 2×2、2×3、3×3 三种网格切换。应用中修改行列数即重置布局，范围为 1–12。', keys: ['重置网格', '修改行 / 列'], steps: ['从 2 行 × 2 列网格开始', '打开重置网格弹层，查看当前行列数', '将列数改为 3，网格切换为 2 行 × 3 列', '再将行数改为 3，网格切换为 3 行 × 3 列'] },
  { id: 'even', name: '平均分配', description: '先框选左侧四个分区，再点击平均分配，均分选区内的行高和列宽。右侧未选中的分区保持不变。', keys: ['左键框选', '平均分配'], steps: ['准备框选左侧四个大小不一的分区', '按住左键拖出矩形，框选四个分区', '松开框选，点击工具栏中的平均分配', '选区内行高与列宽分别均分，右侧分区保持不变'] },
  { id: 'global', name: '设为全局联动', description: '右键分割线，选择“设为全局联动（同列 / 同行）”。拖动其中一段，同列对齐的分割线一起移动。', keys: ['右键分割线', '设为全局联动'], steps: ['上下两段分割线对齐，尚未联动', '右键分割线，打开联动菜单', '选择全局联动，再拖动上段分割线', '上下两段同步移动；工具栏的切割模式保持不变'] },
  { id: 'local', name: '取消联动', description: '右键已联动的分割线，选择“取消联动（各段局部移动）”。再次拖动时，仅当前段移动。', keys: ['右键分割线', '取消联动'], steps: ['上下分割线处于联动状态', '右键分割线，打开联动菜单', '选择取消联动，再拖动上段分割线', '仅上段移动，下段保留原位，形成局部布局'] },
];
export type DemoOptions = { badgeSize: number; badgeName: boolean; badgeBrowser: 'chrome' | 'edge'; badgeChromeX: number; badgeEdgeX: number; badgeShape: string; badgeStyle: string; badgeImage: string; zoneEdit: ZoneEditAction; modifier: string; layout: string; avatar: string; color: string; visible: boolean; dockMode: string; dockItem: number; collapsed: boolean; page: number };
export const defaultOptions: DemoOptions = { badgeSize: 40, badgeName: true, badgeBrowser: 'chrome', badgeChromeX: 0, badgeEdgeX: 0, badgeShape: 'circle', badgeStyle: 'gradient', badgeImage: '', zoneEdit: 'reset', modifier: 'Alt', layout: 'two', avatar: '林', color: '#2F53E6', visible: true, dockMode: 'floating', dockItem: 0, collapsed: true, page: 2 };






