import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentFormComponent } from '../document-form/document-form.component';
import { DocumentPreviewComponent } from '../document-preview/document-preview.component';
import { TemplateApiService } from '../../services/template-api.service';
import { TemplateEngineService } from '../../services/template-engine.service';
import { DocumentTemplate, ResolvedSection } from '../../models/template.model';

@Component({
  selector: 'app-nda-creator',
  standalone: true,
  imports: [DocumentFormComponent, DocumentPreviewComponent, MatProgressSpinnerModule],
  templateUrl: './nda-creator.component.html',
  styleUrl: './nda-creator.component.scss',
})
export class NdaCreatorComponent implements OnInit, OnDestroy {
  private templateApi = inject(TemplateApiService);
  private templateEngine = inject(TemplateEngineService);
  private destroy$ = new Subject<void>();

  template = signal<DocumentTemplate | null>(null);
  formGroup = signal<FormGroup>(new FormGroup({}));
  formValues = signal<Record<string, unknown>>({});

  resolvedSections = computed<ResolvedSection[]>(() => {
    const tmpl = this.template();
    const values = this.formValues();
    if (!tmpl) return [];
    return this.templateEngine.resolve(tmpl.sections, values);
  });

  ndaType = computed(() => {
    const values = this.formValues();
    return (values['nda_type'] as string) || 'Mutual';
  });

  ngOnInit(): void {
    this.templateApi
      .getTemplate('nda')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tmpl) => {
          this.template.set(tmpl);
          const group = this.buildFormGroup(tmpl);
          this.formGroup.set(group);
          this.formValues.set(group.value);

          group.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((values) => this.formValues.set(values));
        },
        error: (err) => {
          console.error('Failed to load template:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildFormGroup(tmpl: DocumentTemplate): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const field of tmpl.fields) {
      const validators = field.required ? [Validators.required] : [];
      controls[field.key] = new FormControl(field.default ?? null, validators);
    }
    return new FormGroup(controls);
  }
}
