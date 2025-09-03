'use client'
import React from "react";
import { HexColorPicker } from "react-colorful";

import styles from "./SwatchesPicker.module.css"

export const SwatchesPicker = ({ color, onChange, presetColors }) => {
    return (
        <div className={styles.picker}>
            <HexColorPicker color={color} onChange={onChange} />

            <div className={styles.pickerSwatches}>
                {presetColors.map((presetColor) => (
                    <button
                        key={presetColor}
                        className={styles.pickerSwatch}
                        style={{ background: presetColor }}
                        onClick={() => onChange(presetColor)}
                    />
                ))}
            </div>
        </div>
    );

};
