'use client';
import Image from "next/image";
import { CATEGORY_COLORS } from "./components/category_colors";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";
import CustomCalendar from "./components/CustomCalendar";
import ExpenseChart from "./components/ExpenseChart";

import React, { useState, useEffect } from "react";

/**
 * 家計簿アプリケーションのメインコンポーネント
 * @returns {JSX.Element} アプリケーションのJSXエレメント
 */
export default function Home() {
  /**
   * カテゴリー管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [categories, setCategories] = useState([]);

  /**
   * 支出管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [expenses, setExpenses] = useState([]);

  /**
   * 支出データ管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [expenseData, setExpenseData] = useState({
    date: new Date(),
    amount: '',
    memo: '',
    selectedCategory: '',
    color: '',
  });

  /**
   * カレンダー選択日管理state
   * @type {[Date, React.Dispatch<React.SetStateAction<Date>>]}
   */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * 編集中の支出データ管理state
   * @type {[object|null, React.Dispatch<React.SetStateAction<object|null>>]}
   */
  const [editingExpense, setEditingExpense] = useState(null);

  /**
   * 編集モードフラグ管理state
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * コンポーネントマウント時、ローカルストレージからデータ読み込み
   */
  useEffect(() => {
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || [];
    if (storedCategories.length > 0) {
        setCategories(storedCategories);
    } else {
        const initialCategories = [
            { id: Date.now().toString(), name: '食費', color: CATEGORY_COLORS[0] },
            { id: (Date.now() + 1).toString(), name: '交通費', color: CATEGORY_COLORS[1] },
            { id: (Date.now() + 2).toString(), name: '日用品', color: CATEGORY_COLORS[2] }
        ];
        setCategories(initialCategories);
        localStorage.setItem('categories', JSON.stringify(initialCategories));
    }

    const storedExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const parsedExpenses = storedExpenses.map(expense => ({
      ...expense,
      date: new Date(expense.date),
    }));
    setExpenses(parsedExpenses);
  }, []);

 return (
    <main>
      <h1>理想の家計簿</h1>
      <hr />
      <CategoryForm
        categories={categories} setCategories={setCategories}
        expenses={expenses} setExpenses={setExpenses} 
        expenseData={expenseData} setExpenseData={setExpenseData }
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <ExpenseForm 
        categories={categories}
        expenses={expenses} setExpenses={setExpenses}
        expenseData={expenseData} setExpenseData={setExpenseData}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <CustomCalendar
        expenses={expenses} setExpenses={setExpenses}
        categories={categories}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        setEditingExpense={setEditingExpense} setIsEditMode={setIsEditMode} />
      <ExpenseChart
        expenses={expenses}
        setExpenses={setExpenses}
        categories={categories}
        selectedDate={selectedDate} />
    </main>
  )
}