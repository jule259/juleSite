"use client";

import { useState } from "react";

const PORTRAIT_SUFFIX = "library_600x900.jpg";
const LANDSCAPE_SUFFIX = "header.jpg";

/**
 * 统一竖版游戏封面。
 * - src 为空 → 🎮 占位
 * - Steam 竖版图缺失（onError）→ 回退到横版 header.jpg（极少数老游戏无竖版素材）
 * - 回退仍失败 / 非 Steam 图失败 → 🎮 占位（避免浏览器破图图标）
 *
 * className 同时作用于 img 和占位 div，保证两者尺寸一致（含 aspect-[3/4]）。
 * 组件为 client 组件：server components（timeline、games/[id]）无法直接在 <img> 上挂 onError。
 */
export default function CoverImage({
  src,
  alt,
  className,
  emojiClassName = "text-2xl",
}: {
  src: string | null | undefined;
  alt: string;
  className: string; // 例: "aspect-[3/4] w-full rounded-lg object-cover"
  emojiClassName?: string;
}) {
  // attempt: 0=原图 1=Steam竖版失败→回退横版 2=最终失败→占位
  const [attempt, setAttempt] = useState(0);
  const canFallback = src?.includes(PORTRAIT_SUFFIX) ?? false;
  const current =
    attempt === 0 ? src
    : attempt === 1 && canFallback ? src!.replace(PORTRAIT_SUFFIX, LANDSCAPE_SUFFIX)
    : null;

  if (current === null || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 ${className}`}
      >
        <span className={emojiClassName}>🎮</span>
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setAttempt((i) => (i === 0 && canFallback ? 1 : 2))}
    />
  );
}
