'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormReturn,
} from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import { Button } from './button';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-1', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
  }
>(({ className, required, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(
        error && 'text-red-500 dark:text-red-900',
        required && `after:content-['_*'] after:text-red-500`,
        className,
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-stone-500 dark:text-stone-400', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(
        'text-sm font-medium text-red-500 dark:text-red-900',
        className,
      )}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};

////////////////////////////////////////////////////////////

export type DefaultFormFooterProps<T extends FieldValues> = {
  /** Form to control */
  form: UseFormReturn<T>;
  /** Is submit loading */
  loading?: boolean;
  /** Is form disabled */
  disabled?: boolean;
  /** Callback for cancel (replaces default function) */
  onCancel?: () => void;

  /** Wrapper class */
  className?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Should cancel button be shown (default true) */
  withCancel?: boolean;
  /** Allow submit clean form */
  allowSubmitClean?: boolean;
};

export function DefaultFormFooter<T extends FieldValues>(
  props: DefaultFormFooterProps<T>,
) {
  const disabled =
    props.disabled ||
    (!props.allowSubmitClean && !props.form.formState.isDirty) ||
    props.loading;

  return (
    <div className={cn('flex gap-2', props.className)}>
      <Button disabled={disabled} type='submit'>
        {props.loading && <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />}
        {props.submitLabel || 'Submit'}
      </Button>
      {props.withCancel !== false && (
        <Button
          disabled={disabled}
          type='button'
          variant='outline'
          onClick={
            props.onCancel ||
            (() => {
              props.form.reset();
            })
          }
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

export function useFormSubmit<T extends (...values: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): { onSubmit: T; loading: boolean } {
  // Used to indicate loading
  const [loading, setLoading] = React.useState<boolean>(false);

  // Submit function
  const onSubmit = React.useCallback((...args: any[]) => {
    // Call fn
    const promise = callback(...args);

    // If async
    if (promise?.catch) {
      // Start loading
      setLoading(true);

      // Call fn
      promise.catch(() => {}).finally(() => setLoading(false));
    }
  }, deps);

  return { onSubmit: onSubmit as unknown as T, loading };
}
