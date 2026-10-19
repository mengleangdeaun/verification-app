import { TextField, TextFieldLabel, TextFieldInput } from '@/components/text-field';

interface Props {
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name?: string | null;
  signatory2Title?: string | null;
  onUpdate: (field: 'signatory1Name' | 'signatory1Title' | 'signatory2Name' | 'signatory2Title', val: string) => void;
}

export default function SignatoryFields(props: Props) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-5 border-t border-border mt-6">
      <div class="space-y-4">
        <TextField class="space-y-2">
          <TextFieldLabel>Signatory 1 Full Name *</TextFieldLabel>
          <TextFieldInput
            required
            value={props.signatory1Name}
            onInput={(e) => props.onUpdate('signatory1Name', e.currentTarget.value)}
            placeholder="Dr. Virak Both"
          />
        </TextField>
        <TextField class="space-y-2">
          <TextFieldLabel>Signatory 1 Title *</TextFieldLabel>
          <TextFieldInput
            required
            value={props.signatory1Title}
            onInput={(e) => props.onUpdate('signatory1Title', e.currentTarget.value)}
            placeholder="Executive Director"
          />
        </TextField>
      </div>

      <div class="space-y-4">
        <TextField class="space-y-2">
          <TextFieldLabel>Signatory 2 Full Name (Optional)</TextFieldLabel>
          <TextFieldInput
            value={props.signatory2Name || ''}
            onInput={(e) => props.onUpdate('signatory2Name', e.currentTarget.value)}
            placeholder="Saing Dararith"
          />
        </TextField>
        <TextField class="space-y-2">
          <TextFieldLabel>Signatory 2 Title (Optional)</TextFieldLabel>
          <TextFieldInput
            value={props.signatory2Title || ''}
            onInput={(e) => props.onUpdate('signatory2Title', e.currentTarget.value)}
            placeholder="Managing Director"
          />
        </TextField>
      </div>
    </div>
  );
}
