/**
 * @file ExpenseList.js
 * @description 月または日付毎の支出を表示、円グラフで集計するコンポーネント
 */

'use client';
import { useState, useMemo, useRef, useEffect } from 'react';

import styles from './ExpenseList.module.css';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { FaTrash } from 'react-icons/fa';

/**
 * 支出とカテゴリーデータを基に、カレンダーと円グラフを表示するコンポーネント
 * 日付を選択すると、その日の支出データを表示
 * @param {object} props - コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {string} props.expenses.date - 支出の日付
 * @param {string} props.expenses.amount - 支出金額
 * @param {string} props.expenses.selectedCategoryName - カテゴリ名
 * @param {Array<object>} props.categories - カテゴリーリスト
 * @param {function name(params)} props.onDeleteExpense - 支出リスト削除関数
    
 }}
 * @returns {JSX.Element} 支出リストのJSXエレメント
 */
export default function ExpenseList({ expenses, setExpenses, categories }) {

    /**
     * カレンダーで選択された日付を管理するstate
     * 初期値は現在の日付
     * @type {[Date, React.Dispatch<React.SetStateAction<Date>>]}
     */
    const [selectedDate, setSelectedDate] = useState(new Date());

    /**
     * 選択された日付に一致する支出をフィルタリングしたリスト
     * expenses/selectedDate変更時、再計算
     * @type {Array<object>}
     */
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === selectedDate.getFullYear() &&
                        expenseDate.getMonth() === selectedDate.getMonth() &&
                        expenseDate.getDate() === selectedDate.getDate();
        });
    }, [expenses, selectedDate]);

    /**
     * カテゴリ毎の金額の集計データ(グラフ表示用)
     * filteredExpenses変更時、再計算
     * @type {Array<{name: string, value: number}>}
     */
    const aggregatedData = useMemo(() => {
        return filteredExpenses.reduce((acc, expense) => {
            const existingCategory = acc.find(item => item.name === expense.selectedCategoryName);

            if (existingCategory) {
                existingCategory.value += Number(expense.amount);
            } else {
                acc.push({
                    name: expense.selectedCategoryName,
                    value: Number(expense.amount)
                });
            }

            return acc;
        }, []);
    }, [filteredExpenses]);

    /**
     * 円グラフの色設定用配列
     * @constant
     * @type {Array<string>}
     */
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A0', '#19FFD1'];

    /**
     * 円グラフのラベルをカスタマイズする関数
     * @param {object} props - Rechartsが提供するプロパティ(中心座標、半径、割合、etc...)
     * @returns {JSX.Element|null} SVGの<text>要素またはnull
     */
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const data = aggregatedData[index];
        if (!data) return null;

        const percentage = (percent * 100).toFixed(0);

        if (percentage === '0') return null;

        return (
            <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="20">
            <tspan x={x} dy="-0.5em">{`${data.name} ${percentage}%`}</tspan>
            <tspan x={x} dy="1em">{`${data.value}円`}</tspan>
            </text>
        );
    };

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
     * @returns {JSX.Element} 円グラフまたはメッセージ
     */
    const renderChart = () => {
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
                <PieChart width={300} height={300}>
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
                    >
                        {
                            filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    function handleDeleteExpense(expenseId) {
        const updateExpenses = expenses.filter(expense => expense.id !== expenseId);
        setExpenses(updateExpenses);
        localStorage.setItem('expenses', JSON.stringify(updateExpenses));
    }

    return (
        <div className={styles.expenseListContainer}>
            <div className={styles.calendarList}>
                <Calendar
                    onChange={(date) => setSelectedDate(date)}
                    value={selectedDate}
                />
                <h2>{selectedDate.toLocaleDateString()}の支出</h2>
                {filteredExpenses.length > 0 && (
                    <ul className={styles.expensesList}>
                        {filteredExpenses.map(expense => (
                            <li className={styles.expenseItems} key={expense.id}>
                                <div>
                                    {expense.amount}円 - {expense.selectedCategoryName}
                                </div>
                                <div
                                    className={styles.deleteIcon}
                                    onClick={() => handleDeleteExpense(expense.id)}
                                >
                                    <FaTrash /> 削除
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>         
            <div ref={pieChartRef} className={styles.pieChart}>
                {renderChart()}
            </div>
        </div>
    );
}