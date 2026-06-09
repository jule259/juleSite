# Tailwind CSS 学习笔记

> 从传统 CSS/Bootstrap 到原子化 CSS

## 核心理念

用大量小 class 拼出样式，而不是写 CSS 选择器。

```html
<!-- 传统写法 -->
<div class="game-card">
  <h2 class="title">The Witcher 3</h2>
</div>

<!-- Tailwind 写法 -->
<div class="rounded-lg border bg-white p-4 shadow-md dark:bg-gray-800">
  <h2 class="text-lg font-bold text-gray-900 dark:text-white">The Witcher 3</h2>
</div>
```

## 常用对照表

| CSS | Tailwind |
|-----|----------|
| `color: red` | `text-red-500` |
| `background: white` | `bg-white` |
| `padding: 16px` | `p-4` |
| `margin: 8px` | `m-2` |
| `display: flex` | `flex` |
| `display: grid` | `grid` |
| `border-radius: 8px` | `rounded-lg` |
| `font-size: 18px` | `text-lg` |
| `font-weight: bold` | `font-bold` |
| `width: 100%` | `w-full` |
| `gap: 16px` | `gap-4` |

## 响应式

```html
<!-- sm: 手机, md: 平板, lg: 桌面 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 手机1列 → 平板2列 → 桌面3列 -->
</div>
```

## 暗色模式

```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
  <!-- dark: 前缀 = 暗色模式下的样式 -->
</div>
```
