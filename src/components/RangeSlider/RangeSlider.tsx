import React from 'react'

import FormRange from 'react-bootstrap/FormRange';
interface Props {
    defaultValue?: number;
    typeClass?: 1 | 2;
    value?: number;
    onChange?: ((value: number) => void | undefined) | undefined;
    min?: number;
    max?: number;
}

const RangeSlider = ({
    defaultValue = 1,
    typeClass = 1,
    value,
    onChange,
    min = 1,
    max = 20000
}: Props) => {
    return (
        <FormRange
            className={typeClass === 1 ? 'range-slider-1' : 'range-slider-2'}
            value={value}
            onChange={(e) => onChange && onChange(Number(e.target.value))}
            min={min}
            max={max}
        />
    )
}

export default RangeSlider