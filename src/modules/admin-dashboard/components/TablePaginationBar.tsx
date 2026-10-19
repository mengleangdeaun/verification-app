import { For } from 'solid-js';
import { Button } from '@/components/button';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isFetching?: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export default function TablePaginationBar(props: Props) {
  const startItem = () => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1);
  const endItem = () => Math.min(props.page * props.pageSize, props.total);

  const visiblePages = () => {
    const total = props.totalPages;
    const current = props.page;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (current >= total - 2) {
      return [total - 4, total - 3, total - 2, total - 1, total];
    }
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  return (
    <div class="px-4 py-3 sm:px-6 border-t border-border bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
      <div class="flex items-center gap-2">
        <span class="tabular-nums">
          Showing <strong class="text-foreground font-mono">{startItem()}</strong> to{' '}
          <strong class="text-foreground font-mono">{endItem()}</strong> of{' '}
          <strong class="text-foreground font-mono">{props.total}</strong> credentials
        </span>
        {props.isFetching && (
          <span class="inline-flex items-center gap-1 text-[11px] text-primary">
            <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Syncing...
          </span>
        )}
      </div>

      <div class="flex items-center gap-4">
        {/* Page Size Selector */}
        <div class="flex items-center gap-1.5">
          <label for="table-pagesize" class="text-xs">Per page:</label>
          <select
            id="table-pagesize"
            value={props.pageSize}
            onChange={(e) => props.onPageSizeChange(Number(e.currentTarget.value))}
            class="h-8 border border-input bg-background px-2 text-xs font-mono tabular-nums focus:ring-1 focus:ring-ring focus:outline-none cursor-pointer"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        {/* Navigation Buttons */}
        <div class="inline-flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={props.page <= 1}
            onClick={() => props.onPageChange(props.page - 1)}
          >
            Prev
          </Button>

          <div class="hidden sm:inline-flex items-center gap-1">
            <For each={visiblePages()}>
              {(p) => (
                <button
                  type="button"
                  onClick={() => props.onPageChange(p)}
                  class={`h-8 w-8 text-xs font-mono tabular-nums font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
                    p === props.page
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              )}
            </For>
          </div>

          <Button
            variant="outline"
            size="xs"
            disabled={props.page >= props.totalPages}
            onClick={() => props.onPageChange(props.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
