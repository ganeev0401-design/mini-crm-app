import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready()

    console.log("TG USER:", tg?.initDataUnsafe?.user)
    console.log("ENV URL:", import.meta.env.VITE_SUPABASE_URL)
    console.log("ENV KEY:", import.meta.env.VITE_SUPABASE_KEY)

    loadProjects()
  }, [])

  async function loadProjects() {
    const user = await getUser()

    console.log("USER:", user)

    if (!user) return

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("telegram_id", user.telegram_id)

    console.log("PROJECTS FROM DB:", data, error)

    setProjects(data || [])
  }

  // 🔥 ГЛАВНАЯ ФИКС-ФУНКЦИЯ
  async function getUser() {
    const tg = window.Telegram?.WebApp

    // 👉 fallback (чтобы всё работало даже без Telegram и backend)
    const fallbackUser = {
      telegram_id: "691710580",
      name: "Local User"
    }

    // ❗ если Telegram нет — сразу fallback
    if (!tg) {
      console.log("NO TELEGRAM → fallback")
      return fallbackUser
    }

    try {
      const res = await fetch(
        "https://mini-crm-backend-5jsf.onrender.com/auth",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            initData: tg.initData
          })
        }
      )

      const data = await res.json()

      console.log("AUTH RESPONSE:", data)

      // 👉 если backend вернул юзера
      if (data?.telegram_id) {
        return data
      }

      return fallbackUser
    } catch (err) {
      console.log("AUTH ERROR → fallback", err)
      return fallbackUser
    }
  }

  async function updateStatus(id, status) {
    await supabase
      .from("projects")
      .update({ status })
      .eq("id", id)

    loadProjects()
  }

  async function markPaid(id) {
    await supabase
      .from("projects")
      .update({ paid: true, status: "done" })
      .eq("id", id)

    loadProjects()
  }

  const total = projects.reduce((sum, p) => {
    const val = parseInt(p.budget)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const paid = projects.reduce((sum, p) => {
    const val = parseInt(p.budget)
    if (p.paid) return sum + (isNaN(val) ? 0 : val)
    return sum
  }, 0)

  const pending = total - paid

  const today = new Date()

  const overdue = projects.filter(
    (p) => new Date(p.deadline) < today && p.status !== "done"
  )

  const waiting = projects.filter(
    (p) => p.status === "waiting_payment"
  )

  const active = projects.filter(
    (p) => p.status === "active"
  )

  function renderProject(p, i) {
    return (
      <div
        key={i}
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 15,
          marginBottom: 10
        }}
      >
        <h3>{p.title}</h3>

        <p>👤 {p.client_name}</p>
        <p>💰 {p.budget}</p>
        <p>📅 {p.deadline}</p>

        <p>
          📊 {p.status} | {p.paid ? "✅ Оплачено" : "❌ Не оплачено"}
        </p>

        <div style={{ marginTop: 10 }}>
          <button onClick={() => updateStatus(p.id, "active")}>
            В работе
          </button>

          <button onClick={() => updateStatus(p.id, "waiting_payment")}>
            Ждём оплату
          </button>

          <button onClick={() => updateStatus(p.id, "done")}>
            Завершено
          </button>

          {!p.paid && (
            <button onClick={() => markPaid(p.id)}>
              💸 Отметить оплачено
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2>💰 Деньги</h2>
        <p>Всего: {total}</p>
        <p>Получено: {paid}</p>
        <p>В работе: {pending}</p>
      </div>

      <h1>📁 Мои проекты</h1>

      <h2>🔴 Просрочено</h2>
      {overdue.length === 0 && <p>Нет просроченных</p>}
      {overdue.map(renderProject)}

      <h2>🟡 Ждут оплату</h2>
      {waiting.length === 0 && <p>Нет</p>}
      {waiting.map(renderProject)}

      <h2>🟢 В работе</h2>
      {active.length === 0 && <p>Нет</p>}
      {active.map(renderProject)}
    </div>
  )
}