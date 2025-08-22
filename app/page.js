'use client';
import Image from "next/image";
import styles from "./page.module.css";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";

import { useState, useEffect } from "react";

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
  });

  /**
   * コンポーネントマウント時、ローカルストレージからデータ読み込み
   */
  useEffect(() => {
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || [];
    if (storedCategories.length > 0) {
        setCategories(storedCategories);
    } else {
        const initialCategories = [
            { id: Date.now().toString(), name: '食費' },
            { id: (Date.now() + 1).toString(), name: '交通費' },
            { id: (Date.now() + 2).toString(), name: '日用品' }
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
        expenseData={expenseData} setExpenseData={setExpenseData}/>
      <ExpenseForm 
        categories={categories} setExpenses={setExpenses}
        expenseData={expenseData} setExpenseData={setExpenseData}/>
      <ExpenseList
        expenses={expenses}
        setExpenses={setExpenses}
        categories={categories}/>
    </main>
  )
}