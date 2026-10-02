import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';

/** Categorical palette (same order as charts) offered as quick picks. */
export const SWATCHES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948', '#898781'];

/**
 * Color input: palette swatches plus a custom picker. Works with formControlName.
 */
@Component({
  selector: 'app-color-field',
  standalone: true,
  imports: [FormsModule, ColorPickerModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorFieldComponent), multi: true }],
  template: `
    <div class="swatches" role="radiogroup" aria-label="Color">
      @for (c of swatches; track c) {
        <button type="button" class="swatch" role="radio" [attr.aria-checked]="value() === c" [attr.aria-label]="c"
          [style.background]="c" (click)="pick(c)"><i class="pi pi-check"></i></button>
      }
      <span class="swatch custom" [class.on]="isCustom()" title="Custom color">
        <p-colorpicker [ngModel]="value()" (ngModelChange)="pick($event)" appendTo="body" />
      </span>
    </div>
  `,
})
export class ColorFieldComponent implements ControlValueAccessor {
  protected readonly swatches = SWATCHES;
  protected value = signal('#2a78d6');
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected isCustom(): boolean {
    return !SWATCHES.includes(this.value());
  }

  protected pick(c: string): void {
    const v = c.startsWith('#') ? c : `#${c}`;
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }

  writeValue(v: string | null): void { this.value.set(v || SWATCHES[0]); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
