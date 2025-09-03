'use client';
import { useState, useEffect } from 'react';
import { SwatchesPicker } from './SwatchesPicker'

import styles from './CategoryForm.module.css';
import { CATEGORY_COLORS } from './category_colors';

import { IoTrashBin } from 'react-icons/io5';
import { IoAddCircleSharp, IoColorPaletteSharp } from "react-icons/io5";

export default function CategoryForm({ categories, setCategories, expenseData, setExpenseData }) {
    const [categoryName, setCategoryName] = useState('');
    const [placeholder, setPlaceholder] = useState('新規カテゴリー')
    const [editingColorId, setEditingColorId] = useState(null);

    /**
     * 入力フォームの値変更時、categoryNameの状態を更新
     * @param {ChangeEvent<HTMLInputElement>} event - Input要素の変更イベント
     */
    function handleChange(event) {
        setCategoryName(event.target.value);
    }


    /**
     * 入力フォームクリック時、placeholderを非表示
     * @param {FocusEvent<HTMLInputElement>} event - Focusイベント
     */
    const handleFocus = () => {
        setPlaceholder('');
    };

    const handleBlur = (e) => {
        if (e.target.value === '') setPlaceholder('新規カテゴリー');
    };

    /**
     * 登録ボタンクリック時に実行、新規カテゴリを保存
     * @param {MouseEvent<HTMLButtonElement>} event - Button要素の変更イベント 
     */
    function handleClickRegister(event) {
        if (event.type === 'click' || event.key === 'Enter') {
            event.preventDefault();
            if (categoryName.trim()) {
                saveCategoryInLocalStorage();
            }
        }
    }

    /**
     * カテゴリボタンクリック時に実行、支出データの選択カテゴリー項目に保存
     * @param {string} categoryName - 選択中カテゴリ
     */
    function handleClickCategory(categoryName) {
        const currentColor = categories.find(cat => cat.name === categoryName).color;

        setExpenseData(prevExpenseData => ({
            ...prevExpenseData,
            selectedCategory: categoryName,
            color: currentColor,
        }));
    }

    /**
     * カテゴリ削除関数(選択中カテゴリもリセット)
     * @param {string} categoryId - 削除するID
     * @param {string} categoryName - 選択中カテゴリ
     */
    function handleDelete(categoryId, categoryName) {
        const updatedCategories = categories.filter(cat => cat.id !== categoryId);
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));

        const existingBudgets = JSON.parse(localStorage.getItem('budgets')) || []
        const updatedBudgets = existingBudgets.filter(budget => budget.categoryName !== categoryName);
        localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
    }
    useEffect(() => {
        if (categories.length > 0) {
            const isFound = categories.some(cat => cat.name === expenseData.selectedCategory);

            if (!isFound) {
                setExpenseData(prevExpenseData => ({
                    ...prevExpenseData,
                    selectedCategory: '',
                }));
            }
        }
    }, [categories, expenseData.selectedCategory, setExpenseData]);

    /**
     * カテゴリカラー更新関数
     * @param {string} categoryId - 更新カテゴリID
     * @param {string} newColor - 新しい色のHEXコード
     */
    const handleColorChange = (categoryId, newColor) => {
        const updatedCategories = categories.map(category =>
            category.id === categoryId ? {...category, color: newColor} : category
        );
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));

        if (expenseData.selectedCategory === categories.find(cat => cat.id === categoryId)?.name) {
            setExpenseData(prev => ({ ...prev, color: newColor }));
        }
    };

    /**
     * 新しいカテゴリを生成し、ローカルストレージとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    function saveCategoryInLocalStorage() {
        const newCategory = {
            id: Date.now().toString(),
            name: categoryName,
            color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
        };

        const existingCategories = JSON.parse(localStorage.getItem('categories')) || [];
        const updatedCategories = [...existingCategories, newCategory];
        setCategories(updatedCategories);

        localStorage.setItem('categories', JSON.stringify(updatedCategories));

        setCategoryName('')
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.categoryList}>
                <h2>カテゴリー選択</h2>
                <ul className={styles.categories}>
                    {categories.map((category) => (
                        <li
                            className={
                                `${styles.category}
                                ${expenseData.selectedCategory === category.name ? styles.selected : ''}`
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClickCategory(category.name);
                            }}
                            key={category.id}
                            style={{
                                borderColor: category.color,
                                backgroundColor: expenseData.selectedCategory === category.name ? `${category.color}95` : 'transparent'
                            }}
                        >
                            <div className={styles.categoryDetails}>
                                <div className={styles.categoryName}>
                                    {category.name}
                                </div>
                                <div className={styles.categoryIcons}>
                                    <IoColorPaletteSharp
                                        className={styles.Icon}
                                        onClick={(e) => {
                                            e.stopPropagation(); // 親要素のonClickイベント無効化
                                            setEditingColorId(editingColorId === category.id ? null : category.id);
                                        }}
                                    />
                                    <IoTrashBin
                                        className={styles.Icon}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(category.id, category.name);
                                        }}
                                    />
                                </div>
                            </div>
                            {editingColorId === category.id && (
                                <div className={`${styles.colorPickerContainer} ${editingColorId === category.id ? styles.visible : ''}`}>
                                    <SwatchesPicker
                                        color={category.color}
                                        onChange={(newColor) => handleColorChange(category.id, newColor)}
                                        presetColors={CATEGORY_COLORS}
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                    <li className={styles.register}>
                        <input
                            type="text"
                            id="categoryName"
                            value={categoryName}
                            onChange={handleChange}
                            onKeyDown={handleClickRegister}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={placeholder}
                        ></input>
                    </li>
                </ul>
            </div>
        </div>
    );
}