import { useEffect, useState } from "react"

export default function App() {
  const [projects, setProjects] = useState([])

  return (
    <div style={{ padding: 20 }}>
      <h1>📁 Мои проекты</h1>

      <p>Mini App работает 🚀</p>
    </div>
  )
}

useEffect(() => {
  const tg = window.Telegram?.WebApp
  tg?.ready()
}, [])

//Загружаем проект
import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId?.toString())

    setProjects(data || [])
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📁 Мои проекты</h2>

      {projects.length === 0 && <p>Пока нет проектов 🤷‍♂️</p>}

      {projects.map((p, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{p.title}</h3>
          <p>👤 {p.client_name}</p>
          <p>💰 {p.budget}</p>
          <p>📅 {p.deadline}</p>
          <p>📊 {p.status}</p>
        </div>
      ))}
    </div>
  )
}