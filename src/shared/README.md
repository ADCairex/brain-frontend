# shared/

Reusable code available to any module in the application.

## Structure

- `components/ui/` — UI primitives (shadcn/ui, Radix). Alias: `@shared/components/ui/`
- `hooks/` — Generic hooks (`use-toast`, `use-mobile`). Alias: `@shared/hooks/`
- `lib/` — Utilities (`cn()`, `PageNotFound`). Alias: `@shared/lib/`

## Usage

```js
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';
```
