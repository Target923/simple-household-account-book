import Image from "next/image";
import styles from "./page.module.css";

import CategoryForm from "./components/CategoryForm";

export default function Home() {
  return (
    <main>
      <h1>理想の家計簿</h1>
      <CategoryForm />
    </main>
  )
}