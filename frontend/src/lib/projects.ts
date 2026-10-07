export type ProjectIcon = 'monitor' | 'headphones' | 'music';
export type ProjectShowcase = {
  title: string;
  text: string;
  detail: string;
  panel: 'appAudio' | 'schedule' | 'profile';
};

export type Project = {
  slug: string;
  name: string;
  logo: string;
  tagline: string;
  category: string;
  description: string;
  features: { title: string; description: string }[];
  platform: string;
  downloads: { platform: string; requirement: string; url: string | null }[];
  releases: string;
  guide?: string;
  screenshot?: { src: string; alt: string };
  detailPage?: 'standalone';
  presentation?: {
    icon?: ProjectIcon;
    hero?: 'audio' | 'lyrics';
    story?: 'audio';
    actionName?: string;
    chapters?: string[];
    downloadTitle?: string;
    conceptCaption?: string;
    showcases?: ProjectShowcase[];
  };
};

export const projects: Project[] = [
  {
    detailPage: 'standalone',
    slug: 'magidesk', name: 'MagiDesk', logo: '/projects/magidesk/logo.svg', category: '桌面效率',
    releases: 'https://github.com/ninetyeights/MagiDesk/releases',
    tagline: '窗口各就其位，工作从容展开。',
    description: '一个常驻托盘的 Windows 桌面工具箱。把窗口拖动、分区布局与浏览器多账号管理放在一起，让日常桌面操作更顺手。',
    platform: 'Windows 11 x64 · 公开测试版',
    features: [
      { title: '随手移动与缩放', description: '按住修饰键即可从窗口任意位置拖动；搭配右键拖动调整大小，不必寻找标题栏和边缘。' },
      { title: '边缘磁吸', description: '拖动时对齐显示器工作区、其他窗口边缘与中线，按需设置吸附距离和目标。' },
      { title: '自由分区布局', description: '切割、合并和调整窗口分区，为不同显示器分配命名布局，按住 Shift 拖动即可归位。' },
      { title: '快速网格', description: '通过全局快捷键打开网格，拖出一片区域即可安排当前窗口，也支持一键居中。' },
      { title: '浏览器账号徽标', description: '通过悬浮头像辨认不同 profile，支持 Chrome、Edge、Brave、Vivaldi 与 Opera。' },
      { title: 'Dock', description: '把浏览器账号与普通应用放入集合和栏目，支持启动、聚焦、固定应用与运行窗口预览，并可选择悬浮或任务栏占位模式。' },
    ],
    downloads: [{ platform: 'Windows', requirement: '优先支持 Windows 11 x64。安装版和便携版均自带 .NET 运行时。', url: '/downloads/magidesk/windows' }],
  },
  {
    presentation: {
      icon: 'headphones',
      hero: 'audio',
      story: 'audio',
      actionName: '音频切换助手',
      downloadTitle: '下一次切换，更简单。',
      showcases: [
          { title:'每个应用，都有自己的声音去向。', text:'为浏览器、音乐播放器与会议应用单独指定输入和输出设备。选择“跟随系统”即可使用默认设备，应用音量和静音可以独立调整。', detail:'切换音频方案会先恢复应用设备路由，再应用当前方案的规则；不会重置音量与静音。', panel:'appAudio' },
          { title:'到点切换，把常用节奏交给计划。', text:'支持每天、指定星期或单次计划，可启停，也能立即执行或重试。按电脑本地时间运行，音频方案锁定时跳过。', detail:'默认错过不补执行；可选择启动或唤醒后补最近一条。电脑关机时不会执行，也不会唤醒电脑。', panel:'schedule' },
          { title:'把设备与应用规则，存成你的方案。', text:'用名字、快捷键和标签颜色区分工作、通话与娱乐。为应用添加设备规则，应用稍后启动时也会自动应用。', detail:'支持可选的 Voicemeeter 音频引擎重启设置。以上界面均为功能复刻示例，菜单与部分操作仅作外观展示。', panel:'profile' },
      ],
    },
    slug: 'audiodeviceswitcher', name: 'AudioDeviceSwitcher', logo: '/projects/audiodeviceswitcher/logo.ico', category: '音频管理',
    releases: 'https://github.com/ninetyeights/AudioDeviceSwitcher/releases',
    guide: 'https://github.com/ninetyeights/AudioDeviceSwitcher#使用说明',
    tagline: '耳机、音箱、麦克风，一切换就到位。',
    description: '音频切换助手，将常用播放与录音设备保存为配置，通过托盘或全局快捷键快速切换，并为不同应用安排音频设备。',
    platform: 'Windows 10 2004 及以上 · x64',
    features: [
      { title: '保存设备组合', description: '把输出、输入与应用覆盖保存为配置，绑定全局快捷键，按使用场景切换。' },
      { title: '应用独立路由', description: '为不同应用指定音频设备，也可以在应用配置时恢复默认路由，再应用当前设置。' },
      { title: '定时切换', description: '按每天、指定星期或单次计划切换配置，支持启停、试运行和查看最近结果。电脑关机时不会执行。' },
      { title: '音量与设备管理', description: '调整设备和应用音量、静音、播放测试音，并用别名与隐藏功能整理设备列表。' },
      { title: '配置备份', description: '备份音频方案、预设、设备别名和定时计划；同机导入前校验并确认覆盖范围。' },
      { title: '可选 Voicemeeter 集成', description: '集成 Voicemeeter Banana，快速选择硬件输入与输出设备、一键切换输入通道静音，并锁定设备路由与静音状态；支持查看电平与设备丢失提示，按需启用。' },
    ],
    screenshot: { src: '/projects/audiodeviceswitcher/main.png', alt: '音频切换助手主窗口：设备配置、播放与录音设备和 Voicemeeter 面板' },
    downloads: [{ platform: 'Windows', requirement: 'Windows 10 version 2004（19041）及以上、x64。EXE 安装包自带运行环境，无需另装 .NET。', url: '/downloads/audiodeviceswitcher/windows' }],
  },
  {
    presentation: {
      icon: 'music',
      hero: 'lyrics',
      chapters: ['音乐响起，歌词就在身边。', '听见节奏，也看见你的风格。', '轻轻常驻，随时继续。'],
      downloadTitle: '让下一首歌，有字可循。',
      conceptCaption: 'LISTEN. READ. FEEL.',
    },
    slug: 'lyricdrop', name: 'LyricDrop', logo: '/projects/lyricdrop/logo.png', category: '音乐与歌词',
    releases: 'https://github.com/ninetyeights/LyricDrop/releases',
    guide: 'https://github.com/ninetyeights/LyricDrop#安装',
    tagline: '让歌词，轻轻落在桌面上。',
    description: '轻巧的音频与 LRC 歌词播放器。在 macOS 菜单栏或 Windows 系统托盘中常驻，用桌面悬浮歌词陪伴播放。',
    platform: 'macOS / Windows',
    features: [
      { title: '音频与歌词一起加载', description: '加载本地音频与 LRC 文件，也支持从 HTTPS 音频 URL 开始播放。音频格式兼容性随系统而异，Windows 播放 OGG 需另装编解码扩展。' },
      { title: '桌面悬浮歌词', description: '把歌词拖到舒服的位置，按需锁定；Windows 版本锁定后可让鼠标点击穿透。' },
      { title: '自己的歌词外观', description: '选择主题渐变、字体、字号与显示行数，让歌词融入你的桌面。' },
      { title: '播放节奏随你', description: '播放、暂停、调整进度、倍速和循环，让听歌或反复练习更方便。' },
      { title: '歌词时间校准', description: '调整歌词的时间偏移，让文字与音频重新同步。' },
      { title: '留在菜单栏与托盘', description: 'macOS 通过菜单栏面板操作，Windows 通过系统托盘打开播放器与桌面歌词。' },
    ],
    downloads: [
      { platform: 'macOS', requirement: 'macOS 15.7 或更新版本。打开 DMG，将 LyricDrop.app 拖入 Applications 文件夹。', url: '/downloads/lyricdrop/macos' },
      { platform: 'Windows', requirement: 'Windows 10 1903 及以上（含 Windows 11）、x64。ZIP 便携包自带运行时；完整解压后运行 LyricDrop.exe。', url: '/downloads/lyricdrop/windows' },
    ],
  },
];

