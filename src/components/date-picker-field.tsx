import { For, Show, createMemo, createUniqueId } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseDate } from '@ark-ui/solid';
import {
  DatePicker,
  DatePickerControl,
  DatePickerInput,
  DatePickerTrigger,
  DatePickerPositioner,
  DatePickerContent,
  DatePickerView,
  DatePickerViewControl,
  DatePickerPrevTrigger,
  DatePickerNextTrigger,
  DatePickerViewTrigger,
  DatePickerRangeText,
  DatePickerContext,
  DatePickerTable,
  DatePickerTableHead,
  DatePickerTableBody,
  DatePickerTableRow,
  DatePickerTableHeader,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
} from '@/components/date-picker';
import { TextFieldLabel } from '@/components/text-field';
import { cn } from '@/utils';

interface DatePickerFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (dateStr: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  class?: string;
}

export function DatePickerField(props: DatePickerFieldProps) {
  const defaultId = createUniqueId();
  const fieldId = () => props.id || defaultId;

  const parsedValue = createMemo(() => {
    if (!props.value) return [];
    try {
      const s = String(props.value).trim();
      if (!s) return [];
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return [parseDate(s)];
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const [m, d, y] = s.split('/');
        return [parseDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)];
      }
      return [parseDate(s)];
    } catch {
      return [];
    }
  });

  return (
    <div class={cn("space-y-2", props.class)}>
      <TextFieldLabel for={fieldId()}>
        {props.label}
      </TextFieldLabel>

      <DatePicker
        id={fieldId()}
        closeOnSelect
        selectionMode="single"
        value={parsedValue()}
        onValueChange={(details) => {
          if (details.value && details.value[0]) {
            const v = details.value[0];
            const iso = `${v.year}-${String(v.month).padStart(2, '0')}-${String(v.day).padStart(2, '0')}`;
            props.onChange(iso);
          } else if (details.valueAsString && details.valueAsString[0]) {
            const s = details.valueAsString[0];
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
              const [m, d, y] = s.split('/');
              props.onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
            } else {
              props.onChange(s);
            }
          } else {
            props.onChange('');
          }
        }}
        format={(date) => `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`}
        parse={(str) => {
          try {
            const s = str.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return parseDate(s);
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
              const [m, d, y] = s.split('/');
              return parseDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
            }
            return parseDate(s);
          } catch {
            return undefined;
          }
        }}
        positioning={{ placement: 'bottom-start', gutter: 4, sameWidth: false }}
      >
        <DatePickerControl class="relative flex items-center w-full">
          <DatePickerInput
            placeholder={props.placeholder || 'YYYY-MM-DD'}
            required={props.required}
            class={props.value ? 'pr-14' : 'pr-8'}
          />

          <div class="absolute right-1.5 flex items-center gap-0.5">
            <Show when={Boolean(props.value)}>
              <button
                type="button"
                aria-label="Clear date"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onChange('');
                }}
                class="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                title="Clear date"
              >
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Show>

            <DatePickerTrigger
              aria-label="Toggle calendar"
              class="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </DatePickerTrigger>
          </div>
        </DatePickerControl>

        <Portal>
          <DatePickerPositioner>
            <DatePickerContent>
              {/* Day View */}
              <DatePickerView view="day">
                <DatePickerContext>
                  {(api) => (
                    <div class="space-y-3">
                      <DatePickerViewControl>
                        <DatePickerPrevTrigger />
                        <DatePickerViewTrigger>
                          <DatePickerRangeText />
                        </DatePickerViewTrigger>
                        <DatePickerNextTrigger />
                      </DatePickerViewControl>

                      <DatePickerTable>
                        <DatePickerTableHead>
                          <DatePickerTableRow>
                            <For each={api().weekDays}>
                              {(weekDay) => (
                                <DatePickerTableHeader>
                                  {weekDay.narrow}
                                </DatePickerTableHeader>
                              )}
                            </For>
                          </DatePickerTableRow>
                        </DatePickerTableHead>
                        <DatePickerTableBody>
                          <For each={api().weeks}>
                            {(week) => (
                              <DatePickerTableRow>
                                <For each={week}>
                                  {(day) => (
                                    <DatePickerTableCell value={day}>
                                      <DatePickerTableCellTrigger>
                                        {day.day}
                                      </DatePickerTableCellTrigger>
                                    </DatePickerTableCell>
                                  )}
                                </For>
                              </DatePickerTableRow>
                            )}
                          </For>
                        </DatePickerTableBody>
                      </DatePickerTable>
                    </div>
                  )}
                </DatePickerContext>
              </DatePickerView>

              {/* Month View */}
              <DatePickerView view="month">
                <DatePickerContext>
                  {(api) => (
                    <div class="space-y-3">
                      <DatePickerViewControl>
                        <DatePickerPrevTrigger />
                        <DatePickerViewTrigger>
                          <DatePickerRangeText />
                        </DatePickerViewTrigger>
                        <DatePickerNextTrigger />
                      </DatePickerViewControl>

                      <DatePickerTable>
                        <DatePickerTableBody>
                          <For each={api().getMonthsGrid({ columns: 4, format: 'short' })}>
                            {(months) => (
                              <DatePickerTableRow>
                                <For each={months}>
                                  {(month) => (
                                    <DatePickerTableCell value={month.value}>
                                      <DatePickerTableCellTrigger>
                                        {month.label}
                                      </DatePickerTableCellTrigger>
                                    </DatePickerTableCell>
                                  )}
                                </For>
                              </DatePickerTableRow>
                            )}
                          </For>
                        </DatePickerTableBody>
                      </DatePickerTable>
                    </div>
                  )}
                </DatePickerContext>
              </DatePickerView>

              {/* Year View */}
              <DatePickerView view="year">
                <DatePickerContext>
                  {(api) => (
                    <div class="space-y-3">
                      <DatePickerViewControl>
                        <DatePickerPrevTrigger />
                        <DatePickerViewTrigger>
                          <DatePickerRangeText />
                        </DatePickerViewTrigger>
                        <DatePickerNextTrigger />
                      </DatePickerViewControl>

                      <DatePickerTable>
                        <DatePickerTableBody>
                          <For each={api().getYearsGrid({ columns: 4 })}>
                            {(years) => (
                              <DatePickerTableRow>
                                <For each={years}>
                                  {(year) => (
                                    <DatePickerTableCell value={year.value}>
                                      <DatePickerTableCellTrigger>
                                        {year.label}
                                      </DatePickerTableCellTrigger>
                                    </DatePickerTableCell>
                                  )}
                                </For>
                              </DatePickerTableRow>
                            )}
                          </For>
                        </DatePickerTableBody>
                      </DatePickerTable>
                    </div>
                  )}
                </DatePickerContext>
              </DatePickerView>
            </DatePickerContent>
          </DatePickerPositioner>
        </Portal>
      </DatePicker>
    </div>
  );
}
