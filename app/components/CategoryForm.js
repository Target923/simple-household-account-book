'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SwatchesPicker } from './SwatchesPicker'

import styles from './CategoryForm.module.css';
import { CATEGORY_COLORS } from './category_colors';

import { IoTrashBin } from 'react-icons/io5';
import { IoColorPaletteSharp } from "react-icons/io5";
import { MdModeEdit } from "react-icons/md";

export default function CategoryForm({ categories, expenses, expenseData, setExpenseData, editingExpense, setEditingExpense, isEditMode, setIsEditMode }) {

    const queryClient = useQueryClient();

    const [categoryName, setCategoryName] = useState('');
    const [placeholder, setPlaceholder] = useState('新規カテゴリー')

    const [editingCategory, setEditingCategory] = useState('');
    const [editingColorId, setEditingColorId] = useState(null);

    // ================================
    // useMutationでデータ更新を定義
    // ================================

    /**
     * カテゴリ登録用ミューテーション
     */
    const createMutation = useMutation({
        mutationFn: async (newCategory) => {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
            if (!response.ok) {
                throw new Error('カテゴリーの登録に失敗しました');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            setCategoryName('');
            setPlaceholder('新規カテゴリー');
        },
        onError: (error) => {
            alert(`カテゴリーの登録に失敗しました: ${error.message}`);
        }
    });

    /**
     * カテゴリ削除用ミューテーション
     */
    const deleteMutation = useMutation({
        mutationFn: async (categoryId) => {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'カテゴリーの削除に失敗しました');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
        },
        onError: (error) => {
            alert(`カテゴリーの削除に失敗しました: ${error.message}`);
        }
    });

    /**
     * カテゴリ名更新用ミューテーション
     */
    const updateNameMutation = useMutation({
        mutationFn: async (updatedData) => {
            const { categoryId, newName } = updatedData;
            const currentCategory = categories.find(cat => cat.id === categoryId);

            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    color: currentCategory.color,
                    sortOrder: currentCategory.sortOrder,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'カテゴリーの更新に失敗しました');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['expenses']);
            setEditingCategory('');
        },
        onError: (error) => {
            alert(`カテゴリーの更新に失敗しました: ${error.message}`);
        }
    });

    /**
     * カテゴリカラー更新用ミューテーション
     */
    const updateColorMutation = useMutation({
        mutationFn:
    })

    /**
     * 入力フォームの値変更時、categoryNameの状態を更新
     * @param {ChangeEvent<HTMLInputElement>} event - Input要素の変更イベント
     */
    function handleChange(event) {
        setCategoryName(event.target.value);
    }

    /**
     * カテゴリ名編集入力フォームの変更時
     * @param {ChangeEvent<HTMLInputElement>} event - Input要素の変更イベント
     */
    const handleEditChange = (event) => {
        setEditingCategory({
            ...editingCategory,
            name: event.target.value,
        })
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
                saveCategoryToDB();
            }
        }
    }

    /**
     * カテゴリ編集保存ハンドラ
     * @param {string} categoryId - 編集中ID
     */
    const handleSaveEdit = async (categoryId) => {
        if (!editingCategory?.name) {
            setEditingCategory('');
            return;
        }

        const isCategoryExists = categories.some(cat => cat.name === editingCategory.name && cat.id !== categoryId);
        if (isCategoryExists) {
            setEditingCategory('');
            alert(`${editingCategory.name}は既に存在します`);
            return
        };

        try {
            await updateNameMutation.mutateAsync({ categoryId, newName: editingCategory.name });
        } catch (error) {

        }
    };
    
    /**
     * 新しいカテゴリを生成し、DBとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    async function saveCategoryToDB() {
        const isCategoryExists = categories.some(cat => cat.name === categoryName);
        if (isCategoryExists) return;

        try {
            await createMutation.mutateAsync({
                name: categoryName,
                color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
                sortOrder: categories.length,
            });
        } catch (error) {

        }
    }

    /**
     * カテゴリボタンクリック時に実行、支出データの選択カテゴリー項目に保存
     * @param {string} categoryName - 選択中カテゴリ
     */
    function handleClickCategory(categoryName) {
        const currentColor = categories.find(cat => cat.name === categoryName).color;

        if (isEditMode && editingExpense) {
            const updatedExpense = {
                ...editingExpense,
                selectedCategory: categoryName,
                selectedCategoryName: categoryName,
                color: currentColor,
            }
            setEditingExpense(updatedExpense);
        }

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
    async function handleDelete(categoryId, categoryName) {
        if (confirm(`${categoryName}を削除しますか？`)) {
            try {
                await deleteMutation.mutateAsync(categoryId);
                await deleteBudgetsByCategory(categoryName);
            } catch (error) {

            }
        }
    }

    /**
     * 指定されたカテゴリの予算データ削除
     * @param {string} categoryName - 削除対象のカテゴリ名
     */
    async function deleteBudgetsByCategory(categoryName) {
        try {
            const budgetsResponse = await fetch('/api/budgets');
            
            if (budgetsResponse.ok) {
                const budgets = await budgetsResponse.json();
                const targetBudgets = budgets.filter(budget => budget.categoryName === categoryName);

                const deletePromises = targetBudgets.map(budget =>
                    fetch(`/api/budgets/${budget.id}`, {
                        method: 'DELETE',
                    })
                );

                await Promise.all(deletePromises);
            }
        } catch (error) {
            console.error('予算データの削除に失敗しました:', error);
        }
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
    const handleColorChange = async (categoryId, newColor) => {
        try {
            await updateColorMutation.mutateAsync()
        } catch (error) {
            console.error('カテゴリーの色更新に失敗しました', error);
        }
    };

    return (
        <div className={styles.formContainer} data-category-form>
            <div className={styles.categoryList}>
                <h2>カテゴリー選択</h2>
                <ul className={styles.categories}>
                    {categories.map((category) => (
                        <li
                            className={
                                `${styles.category}
                                ${(expenseData.selectedCategory === category.name ||
                                    (isEditMode && editingExpense?.selectedCategoryName === category.name)) ?
                                    styles.categorySelected : ''}
                                ${editingColorId === category.id ? styles.categoryOpen : ''}`
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClickCategory(category.name);
                            }}
                            key={category.id}
                            style={{
                                borderColor: category.color,
                                borderTopColor: `${category.color}90`,
                                borderLeftColor: `${category.color}90`,
                                backgroundColor: (expenseData.selectedCategory === category.name ||
                                (isEditMode && editingExpense?.selectedCategoryName === category.name)) ?
                                `${category.color}95` : 'transparent'
                            }}
                        >
                            <div className={styles.categoryDetails}>
                                {editingCategory && editingCategory.id === category.id ? (
                                    <input
                                        type="text"
                                        value={editingCategory.name}
                                        onChange={handleEditChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveEdit(category.id, category.name);
                                            }
                                        }}
                                        onBlur={() => handleSaveEdit(category.id, category.name)}
                                        autoFocus
                                        className={styles.editInput}
                                    />
                                ) : (
                                    <div className={styles.categoryName}>
                                        {category.name}
                                    </div>
                                )}
                                <div className={styles.categoryIcons}>
                                    <MdModeEdit
                                        className={styles.Icon}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCategory(
                                                editingCategory.id === category.id ?
                                                '' :
                                                { id: category.id, name: category.name }
                                            );
                                        }}
                                        title='編集'
                                    />
                                    <IoColorPaletteSharp
                                        className={styles.Icon}
                                        onClick={(e) => {
                                            e.stopPropagation(); // 親要素のonClickイベント無効化
                                            setEditingColorId(editingColorId === category.id ? null : category.id);
                                        }}
                                        title='カラーパレット'
                                    />
                                    <IoTrashBin
                                        className={styles.Icon}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(category.id, category.name);
                                        }}
                                        title='削除'
                                    />
                                </div>
                            </div>
                            <div
                                className={`${styles.colorPickerContainer}
                                            ${editingColorId === category.id ? styles.pickerOpen : ''}`}
                            >
                                <SwatchesPicker
                                    color={category.color}
                                    onChange={(newColor) => handleColorChange(category.id, newColor)}
                                    presetColors={CATEGORY_COLORS}
                                />
                            </div>
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