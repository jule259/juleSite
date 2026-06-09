# TypeScript 学习笔记

> PHP 开发者视角的 TypeScript 入门

## 基础类型

```typescript
// 基本类型 —— 和 PHP 类似但更严格
let name: string = "The Witcher 3";
let year: number = 2015;
let completed: boolean = true;

// 数组
let genres: string[] = ["RPG", "Action"];
let ratings: number[] = [9, 8, 10];

// 可选类型（? = 可以是 undefined）
let notes?: string;  // 相当于 PHP 的 ?string

// 联合类型（可以是多种类型之一）
let status: "completed" | "playing" | "dropped";
```

## Interface vs Type

```typescript
// Interface —— 定义对象形状
interface Game {
  title: string;
  year: number;
  rating?: number;  // 可选
}

// Type —— 类似但更灵活
type Platform = "PC" | "PS5" | "Switch" | "Xbox";
```

## 函数

```typescript
function addGame(game: Game): void {
  // void = 无返回值
}

function getGame(id: string): Promise<Game> {
  // Promise<Game> = 异步返回 Game 对象
  return fetch(`/api/games/${id}`).then(r => r.json());
}
```

## PHP vs TypeScript 对照

| PHP | TypeScript |
|-----|-----------|
| `array` | `T[]` 或 `Array<T>` |
| `?string` | `string \| null` 或 `string \| undefined` |
| `function($x)` | `(x: Type) => ReturnType` |
| `new DateTime()` | `new Date()` |
| `json_encode()` | `JSON.stringify()` |
| `json_decode()` | `JSON.parse()` |
| `$_GET['id']` | `request.nextUrl.searchParams.get('id')` |
| `$_POST['title']` | `await request.json()` then `body.title` |
