import type { PaperOrientation, PaperSize, TemplateId } from '../../../types/templates';
import { dashboardStore } from '../stores/dashboardStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/card';
import { Badge } from '@/components/badge';
import { Switch } from '@/components/switch';

export default function TemplatePicker() {
  const { state, setState } = dashboardStore;

  return (
    <Card class="shadow-xs border-border">
      <CardHeader class="flex flex-row items-center justify-between pb-3 border-b border-border">
        <div>
          <CardTitle class="text-sm font-bold text-foreground">Print & Layout Engine</CardTitle>
          <CardDescription class="text-[11px]">Geometry and print typography presets</CardDescription>
        </div>
        <Badge variant="outline" class="font-mono text-[10px]">
          @page CSS
        </Badge>
      </CardHeader>
      <CardContent class="pt-4 space-y-4">

      {/* Theme Selector */}
      <div>
        <label class="block text-xs font-semibold text-foreground mb-1.5">Aesthetic Theme</label>
        <div class="grid grid-cols-3 gap-2">
          {[
            { id: 'classic-diploma', label: 'Classic' },
            { id: 'modern-tech', label: 'Modern Tech' },
            { id: 'iso-compliance', label: 'ISO Minimal' },
          ].map((t) => (
            <button
              type="button"
              onClick={() => {
                setState('activeTemplateId', t.id as TemplateId);
                setState('draft', 'templateId', t.id as TemplateId);
              }}
              class={`py-2 px-3 text-xs font-medium border transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
                state.activeTemplateId === t.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                  : 'bg-muted/50 text-foreground border-border hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        {/* Paper Size */}
        <div>
          <label class="block text-xs font-semibold text-foreground mb-1.5">Paper Dimension</label>
          <div class="grid grid-cols-2 gap-1.5">
            {(['A4', 'LETTER'] as PaperSize[]).map((sz) => (
              <button
                type="button"
                onClick={() => {
                  setState('paperSize', sz);
                  setState('draft', 'paperSize', sz);
                }}
                class={`py-1.5 text-xs font-medium border transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
                  state.paperSize === sz
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div>
          <label class="block text-xs font-semibold text-foreground mb-1.5">Orientation</label>
          <div class="grid grid-cols-2 gap-1.5">
            {[
              { id: 'landscape', label: 'Landscape' },
              { id: 'portrait', label: 'Portrait' },
            ].map((o) => (
              <button
                type="button"
                onClick={() => {
                  setState('orientation', o.id as PaperOrientation);
                  setState('draft', 'orientation', o.id as PaperOrientation);
                }}
                class={`py-1.5 text-xs font-medium border transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
                  state.orientation === o.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Signature Toggle using Kobalte Switch */}
      <div class="pt-3 border-t border-border flex items-center justify-between">
        <div class="pr-4">
          <p class="text-xs font-semibold text-foreground">Include Digital SVG Signatures</p>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            {state.includeSignaturesOnPrint
              ? 'Render vector signatures for digital PDF export'
              : 'Signatures blank for physical wet-ink signing'}
          </p>
        </div>
        <Switch
          checked={state.includeSignaturesOnPrint}
          onChange={(val) => setState('includeSignaturesOnPrint', val)}
          aria-label="Include digital SVG signatures"
        />
      </div>
    </CardContent>
  </Card>
);
}
