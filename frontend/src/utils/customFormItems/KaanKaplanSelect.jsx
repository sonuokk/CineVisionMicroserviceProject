import { Field, useField } from 'formik'
import React from 'react'

export default function KaanKaplanSelect({...props}) {

    const [field, , helpers] = useField(props);

    const selectProps = {
        ...field,
        ...props,
        onChange: props.multiple
            ? (event) => helpers.setValue(Array.from(event.target.selectedOptions).map(option => option.value))
            : props.onChange || field.onChange
    };

  return (
    <Field as="select" {...selectProps}>

        {!props.multiple ? <option value="" defaultValue hidden>{props.placeholder}</option> : null}

        {(props.options || []).map(option => {
            return (
                <option key={option.key} value={option.key}>
                    {option.value}
                </option>
            )
        })}
    </Field>
  )
}

