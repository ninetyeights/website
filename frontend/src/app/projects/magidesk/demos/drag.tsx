import { Cursor, Window, type DemoProps } from './primitives';
export function DragDemo({ phase, variant, options }: DemoProps) {
  const moved = phase >= 2;
  const resize = variant === 'resize';
  const rect = resize ? { x: 12, y: 12, w: moved ? 72 : 48, h: moved ? 70 : 53 } : { x: moved ? 35 : 10, y: moved ? 16 : 30, w: 56, h: 61 };
  return <><Window rect={{ x: 5, y: 7, w: 42, h: 40 }} title="文件资源管理器" kind="files" muted/><Window rect={rect}/><Cursor x={resize ? (moved ? 73 : 49) : (moved ? 59 : 34)} y={resize ? (moved ? 69 : 49) : (moved ? 46 : 60)} pressed={phase === 1 || phase === 2} label={`${options.modifier} + ${resize ? '右键' : '左键'}`}/></>;
}
