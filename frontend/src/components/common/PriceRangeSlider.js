import React, { useCallback } from 'react';

function PriceRangeSlider({ min = 0, max = 10000, step = 100, value, onChange }) {
  const [minVal, maxVal] = value;

  const minPct = ((minVal - min) / (max - min)) * 100;
  const maxPct = ((maxVal - min) / (max - min)) * 100;

  const handleMin = useCallback((e) => {
    const raw = Number(e.target.value);
    onChange([Math.min(raw, maxVal - step), maxVal]);
  }, [maxVal, step, onChange]);

  const handleMax = useCallback((e) => {
    const raw = Number(e.target.value);
    onChange([minVal, Math.max(raw, minVal + step)]);
  }, [minVal, step, onChange]);

  return (
    <div className="price-slider dual">
      <div className="price-slider__track" />
      <div
        className="price-slider__fill"
        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
      />
      <input
        type="range"
        className="price-slider__input price-slider__input--min"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={handleMin}
        aria-label="Minimum price"
      />
      <input
        type="range"
        className="price-slider__input price-slider__input--max"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={handleMax}
        aria-label="Maximum price"
      />
      <div className="price-slider__values">
        <span className="price-slider__value price-slider__value--min">₹{minVal}</span>
        <span className="price-slider__value price-slider__value--max">₹{maxVal}</span>
      </div>
    </div>
  );
}

export default PriceRangeSlider;
