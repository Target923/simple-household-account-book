/**
 * @file ExpenseList.js
 * @description 月または日付毎の支出を表示、円グラフで集計するコンポーネント
 */

'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

import styles from './ExpenseChart.module.css';
import { CATEGORY_COLORS } from './colors';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';

/**
 * 支出とカテゴリーデータを基に、円グラフと予算グラフを表示するコンポーネント
 * @param {object} props - コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {function} props.setExpenses - 支出リスト更新関数
 * @param {Array<object>} props.categories - カテゴリーリスト
 * @param {Date} props.selectedDate - 選択された日付
 * @returns {JSX.Element} 支出チャートコンポーネント
 */
export default function ExpenseList({ expenses, setExpenses, categories, selectedDate, }) {

    /**
     * 予算データの状態管理state
     * 各カテゴリの月別予算情報を管理
     * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
     */
    const [budgets, setBudgets] = useState([]);

    /**
     * 予算入力フォームの表示状態管理
     * @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]}
     */
    const [editingBudgetId, setEditingBudgetId] = useState(null);

    /**
     * 予算入力値の状態管理
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [budgetInputValue, setBudgetInputValue] = useState('');

    /**
     * 特定の月とカテゴリの支出合計を計算する関数
     * @param {string} categoryName - カテゴリ名
     * @param {string} targetMonth - 対象月（YYYY-MM形式）
     * @returns {number} 支出合計
     */
    const calculateCategoryExpenseForMonth = useCallback((categoryName, targetMonth) => {
        return expenses
            .filter(expense => {
                const expenseMonth = expense.date.substring(0, 7);
                return expense.selectedCategoryName === categoryName &&
                        expenseMonth === targetMonth;
            })
            .reduce((total, expense) => total + Number(expense.amount), 0);
    }, [expenses]);

    /**カテゴリの予算状況を計算する関数（メイン関数）
     * @param {string} targetMonth - 対象月
     * @returns {Array} カテゴリ毎の予算状況
     */
    const calculateBudgetStatus = useCallback((targetMonth) => {
        return categories.map(category => {
            const budget = budgets.find(b =>
                b.categoryId === category.id && b.month === targetMonth
            );

            if (!budget) {
                return {
                    categoryId: category.id,
                    categoryName: category.name,
                    color: category.color,
                    hasBudget: false,
                    budgetAmount: 0,
                    totalExpense: 0,
                    usagePercentage: 0,
                    remainingBudget: 0,
                };
            }

            const totalExpense = calculateCategoryExpenseForMonth(
                category.name, targetMonth
            );
            const usagePercentage = budget.amount === 0 ? 0 : Math.round(totalExpense / budget.amount * 100);
            const remainingBudget = budget.amount - totalExpense;

            return {
                categoryId: category.id,
                categoryName: category.name,
                color: category.color,
                hasBudget: true,
                budgetAmount: budget.amount,
                totalExpense: totalExpense,
                usagePercentage: usagePercentage,
                remainingBudget: remainingBudget,
            };
        });
    }, [budgets, categories, calculateCategoryExpenseForMonth]);

    /**
     * 予算をローカルストレージに保存
     * @param {Array<object>} newBudgets - 新予算データ
     */
    const saveBudgetsToLocalStorage = useCallback((newBudgets) => {
        setBudgets(newBudgets);
        localStorage.setItem('budgets', JSON.stringify(newBudgets));
    }, []);

    /**
     * 予算設定/更新関数
     * @param {string} categoryId - カテゴリID
     * @param {string} categoryName - カテゴリ名
     * @param {number} amount - 予算額
     */
    const handleSetBudget = useCallback((categoryId, categoryName, amount) => {
        const existingBudgetIndex = budgets.findIndex(b =>
            b.categoryId === categoryId && b.month === currentMonth
        );

        let newBudgets;
        if (existingBudgetIndex >= 0) {
            newBudgets = [...budgets];
            newBudgets[existingBudgetIndex] = {
                ...newBudgets[existingBudgetIndex],
                amount: amount
            };
        } else {
            const newBudget = {
                categoryId: categoryId,
                categoryName: categoryName,
                amount: amount,
                month: currentMonth
            };
            newBudgets = [...budgets, newBudget];
        }

        saveBudgetsToLocalStorage(newBudgets);
        setEditingBudgetId(null);
        setBudgetInputValue('');
    }, [budgets, currentMonth, saveBudgetsToLocalStorage]);

    /**
     * 予算編集開始
     * @param {string} categoryId - カテゴリID
     * @param {number} currentAmount - 現在の予算額
     */
    const startEditingBudget = useCallback((categoryId, currentAmount = '') => {
        setEditingBudgetId(categoryId);
        setBudgetInputValue(String(currentAmount));
    }, []);

    /**
     * 現在の月の予算状況を計算
     * @type {string} YYYY-MM形式の現在月
     */
    const currentMonth = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }, [selectedDate]);

    /**
     * 予算状態データを更新
     * @type {Array<object>} カテゴリ毎の予算状況
     */
    const budgetStatusData = useMemo(() => {
        return calculateBudgetStatus(currentMonth);
    }, [calculateBudgetStatus, currentMonth]);

    /**
     *  ローカルストレージから予算データ読み込み
     */
    useEffect(() => {
        const storedBudgets = localStorage.getItem('budgets');
        if (storedBudgets) {
            setBudgets(JSON.parse(storedBudgets));
        }
    }, []);

    /**
     * 予算グラフ用データ生成関数
     * @return {Array<object>} 予算グラフ用データ
     */
    const budgetChartData = useMemo(() => {
        return budgetStatusData
            .filter(status => status.hasBudget)
            .map(status => ({
                categoryName: status.categoryName,
                budgetAmount: status.budgetAmount,
                totalExpense: status.totalExpense,
                usagePercentage: status.usagePercentage,
                remainingBudget: Math.max(0, status.remainingBudget),
                overExpense: Math.max(0, -status.remainingBudget),
                color: status.color,
                isOverBudget: status.remainingBudget < 0,
            }));
    }, [budgetStatusData]);

    /**
     * 予算グラフ描画用
     * @returns {JSX.Element} 予算棒グラフコンポーネント
     */
    const renderBudgetChart = () => {
        if (budgetChartData.length === 0) {
            return (
                <div>
                    <p>予算が設定されていません</p>
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={budgetChartData}
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                        type="category"
                        dataKey="categoryName"
                        width={80}
                        fontSize={12}
                    />
                    <Tooltip
                        formatter={(value, name) => {
                            if (name === 'totalExpense') return [`${value}円`, '支出額'];
                            if (name === 'budgetAmount') return [`${value}円`, '予算額'];
                            return [value, name];
                        }}
                    />
                    <legend />

                    <Bar dataKey="budgetAmount" fill="#e0e0e0" name="予算額" />
                    <Bar dataKey="totalExpense" fill="#4CAF50" name="支出額" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    /**
     * 選択された日付に一致する支出をフィルタリング（円グラフ用）
     * @type {Array<object>} 選択日の支出リスト
     */
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expenseData => {
                const expenseDate = new Date(expenseData.date);
                return expenseDate.getFullYear() === selectedDate.getFullYear() &&
                        expenseDate.getMonth() === selectedDate.getMonth() &&
                        expenseDate.getDate() === selectedDate.getDate();
        });
    }, [expenses, selectedDate]);

    /**
     * カテゴリ毎の金額の集計データ（円グラフ用）
     * @type {Array<{name: string, value: number, color: string}>}
     */
    const aggregatedData = useMemo(() => {
        return filteredExpenses.reduce((acc, expenseData) => {
            const existingCategory = acc.find(item => item.name === expenseData.selectedCategoryName);
            const categoryColor = categories.find(cat => cat.name === expenseData.selectedCategoryName)?.color;

            const colorToUse = categoryColor || CATEGORY_COLORS[acc.length % CATEGORY_COLORS.length];

            if (existingCategory) {
                existingCategory.value += Number(expenseData.amount);
            } else {
                acc.push({
                    name: expenseData.selectedCategoryName,
                    value: Number(expenseData.amount),
                    color: colorToUse,
                });
            }

            return acc;
        }, []);
    }, [filteredExpenses, categories]);

    /**
     * 円グラフのカスタムラベル描画関数
     * @param {object} props - Rechartsが提供するプロパティ(中心座標、半径、割合、etc...)
     * @returns {JSX.Element|null} SVGの<text>要素またはnull
     */
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const data = aggregatedData[index];
        if (!data) return null;

        const percentage = (percent * 100).toFixed(0);

        if (percentage === '0') return null;

        return (
            <text x={x} y={y} fill="black" textAnchor={"middle"} dominantBaseline="central">
            <tspan x={x} dy="-0.5em">{`${data.name} ${percentage}%`}</tspan>
            <tspan x={x} dy="1em">{`${data.value}円`}</tspan>
            </text>
        );
    };

    /**
     * 円グラフのサイズ管理
     */
    const pieChartRef = useRef(null);
    const [pieChartSize, setPieChartSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            if (pieChartRef.current) {
                setPieChartSize({
                    width: pieChartRef.current.clientWidth,
                    height: pieChartRef.current.clientHeight,
                });
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    /**
     * 円グラフ描画関数
     * @returns {JSX.Element} 円グラフコンポーネント
     */
    const renderPieChart = () => {
        if (filteredExpenses.length === 0) {
            return <h1>No Data</h1>;
        }

        const filteredData = aggregatedData.filter(d => d.value > 0);
        const { width, height } = pieChartSize;

        if (width === 0 || height === 0) {
            return null;
        }
        const outerRadius = Math.min(width, height) / 2 - 25;

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart width={width} height={height} className={styles.customPieChart}>
                    <Pie
                        data={filteredData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={outerRadius}
                        fill="#8884d8"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        startAngle={-270}
                        endAngle={-630}
                    >
                        {
                            filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                        }
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        );
    };

    /**
     * 支出削除関数()
     * @param {string} expenseId - 削除ID
     */
    function handleDeleteExpense(expenseDataId) {
        const updateExpenses = expenses.filter(expenseData => expenseData.id !== expenseDataId);
        setExpenses(updateExpenses);
        localStorage.setItem('expenses', JSON.stringify(updateExpenses));
    }

    return (
        <div className={styles.expenseListContainer}>
            <div className={styles.budgetsList}>
                <h3>袋分け予算グラフ {currentMonth}</h3>

                {renderBudgetChart()}

                <div>
                    <h4>デバッグ情報</h4>
                    {budgetStatusData.map(status => (
                        <div key={status.categoryName}>
                            <strong>{status.categoryName}:</strong>
                            {status.hasBudget ? (
                                <span>予算{status.budgetAmount}円,
                                    支出{status.totalExpense}円,
                                    使用率{status.usagePercentage}%,
                                    残高{status.remainingBudget}円
                                </span>
                            ) : (
                                <span>予算未設定</span>
                            )} 
                        </div>
                    ))}
                </div>
            </div>         
            <div ref={pieChartRef} className={styles.pieChart}>
                {renderPieChart()}
            </div>
        </div>
    );
}