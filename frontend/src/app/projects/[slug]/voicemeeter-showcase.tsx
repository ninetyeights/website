'use client';

import { useState } from 'react';
import { LockKeyholeOpen, Hand } from 'lucide-react';
import styles from './voicemeeter-showcase.module.css';

const topics = [
  { id: 'devices', title: '快速选择设备', text: '在面板中直接为 A1–A3 输出和硬件输入选择设备。展开设备列表，即可选择可用的 WDM、MME 等设备。', hint: '设备名称与下拉列表' },
  { id: 'mute', title: '一键静音', text: '点击输入通道旁的静音按钮，随时静音或恢复声音；硬件通道还可查看电平和设备状态。', hint: '输入通道的静音按钮' },
  { id: 'lock', title: '锁住路由与静音状态', text: '点击右上角锁定按钮，保持当前设备路由与输入通道静音状态，外部修改后自动恢复。这项锁定独立于音频方案锁定。', hint: '右上角的锁定按钮' },
] as const;

export function VoicemeeterShowcase() {
  const [active, setActive] = useState<string>('');
  return <article className={styles.section} aria-labelledby="voicemeeter-heading">
    <div className={styles.copy}>
      <span className={styles.number}>04 / VOICEMEETER BANANA</span>
      <h2 id="voicemeeter-heading">常用混音操作，<br/>就在手边。</h2>
      <p className={styles.lead}>移动到下方介绍，看看对应的操作位置。也可以点击或用键盘选择。</p>
      <div className={styles.topics}>
        {topics.map((topic, index) => <button key={topic.id} type="button" aria-pressed={active === topic.id} aria-controls="voicemeeter-preview" onMouseEnter={() => setActive(topic.id)} onMouseLeave={() => setActive('')} onBlur={() => setActive('')} onFocus={() => setActive(topic.id)} onClick={() => setActive(topic.id)}>
          <span className={styles.index}>0{index + 1}</span><span><strong>{topic.title}</strong><span className={styles.description}>{topic.text}</span></span>
        </button>)}
      </div>
      <p className={styles.note}>安装并运行 Voicemeeter Banana 后，在设置中开启集成。默认关闭，未启用时也可独立使用音频切换助手。</p>
    </div>
    <figure className={styles.figure}>
      <div id="voicemeeter-preview" className={styles.preview} data-active={active} aria-label="Voicemeeter Banana 界面复刻">
        <div className={styles.title}><span>● Voicemeeter Banana</span><span className={styles.lock} data-highlight={active === 'lock'}><LockKeyholeOpen size={17}/>{active === 'lock' && <Hand className={styles.pointer} size={23}/>}</span></div>
        <div className={styles.panel}>
          {['桌面音箱（示例 USB 音频）', '(未设置)', '(未设置)'].map((name, i) => <div className={styles.row} key={i}><span>▶ A{i+1}</span><span className={styles.device}>{name}</span></div>)}
          {['麦克风', '桌面采集', '媒体采集', '语音输入', '直播输入'].map((name, i) => <div className={styles.row} key={name}>
            <span>• {name}</span><span className={styles.channel}><span className={styles.mute} data-muted={i === 0} data-highlight={active === 'mute'}>静音</span><span className={styles.device} data-muted={i === 0}>{['示例 USB 麦克风', '示例虚拟录音设备 A', '示例虚拟录音设备 B', '示例混音总线 B1', '示例混音总线 B2'][i]}</span></span>
          </div>)}
        </div>
        <div className={styles.menu} style={{ visibility: active === 'devices' ? 'visible' : 'hidden' }} aria-hidden={active !== 'devices'} aria-label="设备选择菜单示意">
          {['WDM: 桌面采集（示例设备 A）', 'WDM: 媒体采集（示例设备 B）', 'WDM: 桌面麦克风（示例 USB 音频）', 'MME: 桌面采集（示例设备 A）'].map((name, i) => <div key={name}><span className={i === 1 ? styles.checked : undefined}>{i === 1 ? '✓' : ''}</span>{name}</div>)}
        </div>
        <div className={styles.callout} role="status">{active && active !== 'devices' && <><Hand size={18}/>{topics.find(topic => topic.id === active)?.hint}</>}</div>
      </div>
      <figcaption>界面复刻 · 虚构示例设备 · 高亮用于功能导览</figcaption>
    </figure>
  </article>;
}
