import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/utils";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
  id?: string;
}

function FieldWrapper({ label, hint, error, required, children, id }: FieldWrapperProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-amber ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children(describedBy) /* consumer passes fieldId via closure below */}
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-error font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hint, error, required, id, className, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={fieldId}>
      {(describedBy) => (
        <input
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy}
          aria-invalid={!!error || undefined}
          required={required}
          className={cx(
            "w-full min-h-11 rounded-xl border px-3.5 py-2.5 text-[16px] bg-surface text-ink placeholder:text-ink-secondary transition-colors duration-150",
            error ? "border-error" : "border-border-strong focus:border-sage",
            className
          )}
          {...props}
        />
      )}
    </FieldWrapper>
  );
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, required, id, className, rows = 5, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={fieldId}>
      {(describedBy) => (
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={!!error || undefined}
          required={required}
          className={cx(
            "w-full rounded-xl border px-3.5 py-2.5 text-[16px] bg-surface text-ink placeholder:text-ink-secondary leading-relaxed transition-colors duration-150 resize-y",
            error ? "border-error" : "border-border-strong focus:border-sage",
            className
          )}
          {...props}
        />
      )}
    </FieldWrapper>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, id, className, children, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={fieldId}>
      {(describedBy) => (
        <select
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy}
          aria-invalid={!!error || undefined}
          required={required}
          className={cx(
            "w-full min-h-11 rounded-xl border px-3.5 py-2.5 text-[16px] bg-surface text-ink transition-colors duration-150",
            error ? "border-error" : "border-border-strong focus:border-sage",
            className
          )}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
});
