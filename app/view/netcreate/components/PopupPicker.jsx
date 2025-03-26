import React, { useRef, useState, useCallback, useEffect } from 'react';
import SwatchesPicker from './SwatchesPicker.jsx';
import { useClickOutside } from './useeffects-library.js';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// eventually move this to settings manager
const PRESET_COLORS = ['#cd9323', '#1a53d8', '#9a2151', '#0d6416', '#8d2808'];

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PopupPicker = ({ color, onChange, name }) => {
  const popover = useRef();
  const [isOpen, toggle] = useState(false);

  const close = useCallback(() => toggle(false), []);
  useClickOutside(popover, close);

  return (
    <div className="picker">
      <label htmlFor={name}>${name}</label>
      <div
        className="swatch"
        style={{ backgroundColor: color }}
        onClick={() => toggle(true)}
      />
      <div className="tooltip"></div>
      {isOpen && (
        <div className="popover" ref={popover}>
          <SwatchesPicker
            color={color}
            onChange={onChange}
            presetColors={PRESET_COLORS}
          />
        </div>
      )}
    </div>
  );
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PopupPicker;
