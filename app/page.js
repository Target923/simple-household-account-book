'use client';
import '../app/globals.css'
import React, { useState } from "react";
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession, signOut } from "next-auth/react";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";
import CustomCalendar from "./components/CustomCalendar";
import ExpenseChart from "./components/ExpenseChart";
import LoginForm from './components/LoginForm';

/**
 * QueryClientインスタンス作成
 */
const queryClient = new QueryClient();

/**
 * Providersコンポーネントを直接組み込む
 */
const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
};

/**
 * データ取得ロジックの関数定義
 */
async function fetchCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) {
    throw new Error('カテゴリーの取得に失敗しました');
  }
  return res.json();
}

async function fetchExpenses() {
  const res = await fetch('/api/expenses');
  if (!res.ok) {
    throw new Error('支出の取得に失敗しました');
  }
  const expenseData = await res.json();
  return expenseData.map(exp => ({
    ...exp,
    date: new Date(exp.date),
  }));
}

/**
 * ホームコンポーネントロジック
 * @returns {JSX.Element} アプリケーションのJSXエレメント
 */
function HomeContent() {
  const { data: session, status } = useSession();

  const { data: categories, isPending: isCategoriesPending, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: expenses, isPending: isExpensesPending, error: expensesError } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  })

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

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return (
      <main><LoginForm /></main>
    );
  }

  if (isCategoriesPending || isExpensesPending) {
    return <div>データを読み込み中...</div>;
  }
  if (categoriesError || expensesError) {
    return <div>エラーが発生しました: {categoriesError?.message || expensesError?.message}</div>;
  }

  return (
    <main>
      <div className='header'>
        <h1>理想の家計簿</h1>
        <button onClick={() => signOut()}>ログアウト</button>
      </div>
      <hr />
      <CategoryForm
        categories={categories}
        // setCategories={setCategories}
        expenses={expenses}
        // setExpenses={setExpenses}
        expenseData={expenseData} setExpenseData={setExpenseData }
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <ExpenseForm 
        categories={categories}
        expenses={expenses} 
        // setExpenses={setExpenses}
        expenseData={expenseData} setExpenseData={setExpenseData}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <CustomCalendar
        expenses={expenses}
        categories={categories}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        setEditingExpense={setEditingExpense} setIsEditMode={setIsEditMode} />
      <ExpenseChart
        expenses={expenses}
        // setExpenses={setExpenses}
        categories={categories}
        selectedDate={selectedDate} />
    </main>
  );
}

export default function Home() {
  return (
    <AppProviders>
      <HomeContent />
    </AppProviders>
  );
}