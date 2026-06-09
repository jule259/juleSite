# Next.js 学习笔记

> PHP 开发者视角的 Next.js 概念对照

## 路由

```
PHP 方式：                    Next.js App Router：
/games.php                    app/games/page.tsx
/game-detail.php?id=5         app/games/[id]/page.tsx
/admin/games.php              app/admin/games/page.tsx
/api/games.php                app/api/games/route.ts
```

## Server Components vs Client Components

```typescript
// Server Component（默认）—— 相当于 PHP 后端渲染
// 可以直接访问数据库、文件系统
// 不能使用 onClick、useState 等浏览器 API
export default async function GameList() {
  const games = await db.game.findMany(); // 直接查数据库！
  return <div>{games.map(...)}</div>;
}

// Client Component —— 相当于 PHP + jQuery
// 需要加 'use client' 声明
// 可以使用 onClick、useState、useEffect 等
'use client';
export default function FilterBar() {
  const [search, setSearch] = useState('');
  return <input onChange={e => setSearch(e.target.value)} />;
}
```

## 数据获取

| PHP 方式 | Next.js 方式 |
|----------|-------------|
| `file_get_contents('api/...')` | `fetch('/api/games')` （客户端） |
| 数据库直接查询 | Server Component 中直接查 DB |
| `$_GET['id']` | `params.id` （App Router 自动提供） |

## API Routes

```typescript
// app/api/games/route.ts
// ≈ games.php（处理 GET / POST 请求）

export async function GET(request: NextRequest) {
  // 相当于 if ($_SERVER['REQUEST_METHOD'] === 'GET')
  const games = await db.game.findMany();
  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  // 相当于 if ($_SERVER['REQUEST_METHOD'] === 'POST')
  const body = await request.json(); // ≈ json_decode($_POST)
  const game = await db.game.create({ data: body });
  return NextResponse.json(game, { status: 201 });
}
```

## 关键区别

- Next.js 用 `export default function` 定义页面（而不是文件名映射）
- 每个页面文件必须 `export default` 一个 React 组件
- Server Component 默认，需要用 `'use client'` 声明为客户端组件
- 路由参数通过 `params` prop 传入，不需要写 URL 解析代码
