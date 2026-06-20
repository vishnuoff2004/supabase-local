import React, { useCallback } from 'react';
import { formatPrice } from '../../utils/formatPrice';

function PriceRangeSlider({ min = 0, max = 10000, step = 100, value, onChange }) {
  const [minVal, maxVal] = value;

  // Calculate percentage of maxVal relative to min and max range
  const pct = ((maxVal - min) / (max - min)) * 100;

  const handleMax = useCallback((e) => {
    const raw = Number(e.target.value);
    // Keep minVal fixed to min (0) and update maxVal
    onChange([min, raw]);
  }, [min, onChange]);

  return (
    <div className="price-slider single">
      <div className="price-slider__track" />
      <div
        className="price-slider__fill"
        style={{ left: '0%', width: `${pct}%` }}
      />
      <input
        type="range"
        className="price-slider__input price-slider__input--single"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={handleMax}
        aria-label="Maximum price"
      />
      <div className="price-slider__values">
        <span className="price-slider__value price-slider__value--min">{formatPrice(min)}</span>
        <span className="price-slider__value price-slider__value--max">{formatPrice(maxVal)}</span>
      </div>
    </div>
  );
}

export default PriceRangeSlider;
