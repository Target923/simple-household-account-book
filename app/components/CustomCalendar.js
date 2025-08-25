'use client';
import { useState, useMemo } from 'react';

import Modal from './Modal';

import styles from './CustomCalendar.module.css';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FaTimes, FaTrash } from 'react-icons/fa';

/**
 * カスタムカレンダーコンポーネント
 * @param {object} props コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {function} props.setExpenses - 支出リスト更新関数
 * @param {Array<object>} props.categories - カテゴリリスト
 * @returns {JSX.Element} カレンダーコンポーネントのJSXエレメント
 */
export default function CustomCalendar({ expenses, setExpenses, categories }) {
    /**
     * モーダル開閉状態、選択支出データ管理state
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    const [isModalOpen, setIsModalOpen] = useState(false);

    /**
     * 選択日付の支出リスト管理state
     * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array>>]}
     */
    const [selectedDateExpenses, setSelectedDateExpenses] = useState([]);

    /**
     * カテゴリのカラーマップ管理Memo
     * @type {object}
     */
    const categoryColors = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.name] = cat.color;
            return acc;
        }, {});
    }, [categories]);

    /**
     * 日付文字列をISO形式に変換するユーティリティ関数
     * @param {string | Date} dateValue - 日付/日付文字列
     * @returns {string} YYYY-MM-DD形式の日付文字列
     */
    const getISODateString = (dateValue) => {
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }
        return dateValue.split('T')[0];
    };

    /**
     * 支出データをFullCalendarイベント形式に変換
     * @type {Array<object>}
     */
    const calendarEvents = useMemo(() => {
        const dailyTotals = expenses.reduce((acc, expense) => {
            const date = getISODateString(expense.date);
            acc[date] = (acc[date] || 0) + Number(expense.amount);
            return acc;
        }, {});

        return Object.keys(dailyTotals).map(date => ({
            id: date,
            title: `合計: ${dailyTotals[date]}円`,
            date: date,
            backgroundColor: '#c0c0c0',
        }));
    }, [expenses]);

    /**
     * イベントのドラッグ&ドロップハンドラ
     * @param {object} eventDrapInfo - ドラッグ&ドロップイベント情報
     */
    const handleEventDrop = (eventDropInfo) => {
        const newDate = eventDropInfo.event.startStr;
        const oldDate = eventDropInfo.oldEvent.startStr;

        const targetExpenses = expenses.filter(
            expense => getISODateString(expense.date) === oldDate
        );

        const otherExpenses = expenses.filter(
            expense => getISODateString(expense.date) !== oldDate
        );

        const updateTargetExpenses = targetExpenses.map(expense => ({
            ...expense,
            date: newDate + 'T' + (expense.date instanceof Date ?
                expense.date.toISOString().split('T')[1] :
                expense.date.split('T')[1]),
        }));

        const updateExpenses = [...otherExpenses, ...updateTargetExpenses];
        setExpenses(updateExpenses);
        localStorage.setItem('expenses', JSON.stringify(updateExpenses));
    };

    /**
     * イベントクリックハンドラ
     * クリック日の支出データをモーダル表示
     * @param {object} eventClickInfo - イベントクリック情報
     */
    const handleEventClick = (eventClickInfo) => {
        const clickedDate = eventClickInfo.event.startStr;

        const expensesOnClickedDate = expenses.filter(
            expense => getISODateString(expense.date) === clickedDate
        );

        setSelectedDateExpenses(expensesOnClickedDate);
        setIsModalOpen(true);
    };

    /**
     * 支出削除ハンドラ
     * @param {string} expenseId - 支出ID
     */
    const handleDeleteExpense = (expenseId) => {
        const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

        const newSelectedExpenses = updatedExpenses.filter(
            exp => getISODateString(exp.date) ===
                getISODateString(selectedDateExpenses[0]?.date)
        );
        setSelectedDateExpenses(newSelectedExpenses);

        if (newSelectedExpenses.length === 0) {
            setIsModalOpen(false);
        }
    };

    return (
        <div className={styles.customCalendarContainer}>
            <FullCalendar 
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="ja"
                headerToolbar={{
                    left: 'prev.next today',
                    center: 'title',
                    right: '',
                }}
                events={calendarEvents}
                editable={true}
                eventDrop={handleEventDrop}
                eventClick={handleEventClick}
            />

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h3 className={styles.modalTitle}>
                        {selectedDateExpenses.length > 0 ?
                            new Date(selectedDateExpenses[0].date).toLocaleDateString() :
                            '支出詳細'
                        }
                        の支出
                    </h3>
                    {selectedDateExpenses.length > 0 ? (
                        <ul className={styles.modalList}>
                            {selectedDateExpenses.map(expense => (
                                <li
                                    key={expense.id}
                                    className={styles.modalItem}
                                    style={{
                                        borderColor: categoryColors[expense.selectedCategoryName] || '#ccc',
                                    }}
                                >
                                    <div className={styles.modalItemDetails}>
                                        <p>{expense.selectedCategoryName}</p>
                                        <p>{expense.memo}</p>
                                        <p>{expense.amount}円</p>
                                    </div>
                                    <div
                                        className={styles.modalDeleteButton}
                                        onClick={() => handleDeleteExpense(expense.id)}
                                    >
                                        <FaTrash />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No Data</p>
                    )}
                </Modal>
            )}
        </div>
    );
}
