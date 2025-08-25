'use client'
import React from 'react';
import styles from './Modal.module.css'

/**
 * モーダルコンポーネント
 * @param {object} props - コンポーネントプロパティ
 * @param {React.ReactNode} props.children - モーダル内の子要素
 * @param {boolean} props.isOpen - モーダル開閉状態
 * @param {function} props.onClose - モーダル閉鎖ハンドラ
 * @returns {JSX.Element | null} モーダルJSXエレメント
 */
export default function Modal({ children, isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}