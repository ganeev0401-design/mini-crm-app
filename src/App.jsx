import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [projects, setProjects] = useState([])
  const [mode, setMode] = useState("crm")

  // booking state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [service, setService] = useState("")
  const [date, setDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookedSlots, setBookedSlots] = useState([])

  const slots = [
    "09:00","10:00","11:00","12:00",
    "13:00","14:00","15:00","16:00",
    "17:00","18:00"
  ]

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready()

    if (window.location.pathname.includes("booking")) {
      setMode("booking")
    }

    loadProjects()
  }, [])

  async function loadProjects() {
    const user = await getUser()
    if (!user) return

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("telegram_id", user.telegram_id)

    setProjects(data || [])
  }

  async function getUser() {
    const tg = window.Telegram?.WebApp

    const fallbackUser = {
      telegram_id: "691710580",
      name: "Local User"
    }

    if (!tg) return fallbackUser

    const res = await fetch(
      "https://mini-crm-backend-5jsf.onrender.com/auth",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData })
      }
    )

    const data = await res.json()
    return data?.telegram_id ? data : fallbackUser
  }

  // =========================
  // 📅 ГРУЗИМ ЗАНЯТЫЕ СЛОТЫ
  // =========================
  async function loadBookedSlots(selectedDate) {
    setDate(selectedDate)

    const start = new Date(selectedDate)
    const end = new Date(selectedDate)
    end.setDate(end.getDate() + 1)

    const { data } = await supabase
      .from("projects")
      .select("*")
      .gte("appointment_at", start.toISOString())
      .lt("appointment_at", end.toISOString())

    const busy = (data || []).map(p => {
      const d = new Date(p.appointment_at)
      return d.toTimeString().slice(0,5)
    })

    setBookedSlots(busy)
  }

  // =========================
  // 📌 BOOKING SUBMIT
  // =========================
  async function submitBooking() {
    if (!selectedTime || !date) {
      alert("Выбери дату и время")
      return
    }

    const datetime = new Date(`${date}T${selectedTime}`)

    await fetch(
      "https://mini-crm-backend-5jsf.onrender.com/create-booking",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          master_id: "691710580",
          client_name: name,
          client_phone: phone,
          service,
          datetime
        })
      }
    )

    alert("Запись создана 🚀")
  }

  // =========================
  // 📅 BOOKING UI
  // =========================
  if (mode === "booking") {
    return (
      <div style={{ padding: 20 }}>
        <h2>📅 Запись</h2>

        <input placeholder="Имя" onChange={e => setName(e.target.value)} />
        <br /><br />

        <input placeholder="Телефон" onChange={e => setPhone(e.target.value)} />
        <br /><br />

        <input placeholder="Услуга" onChange={e => setService(e.target.value)} />
        <br /><br />

        <input
          type="date"
          onChange={e => loadBookedSlots(e.target.value)}
        />
        <br /><br />

        {/* 🔥 СЛОТЫ */}
        {date && (
          <div>
            <h4>Выбери время:</h4>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {slots.map(time => {
                const isBusy = bookedSlots.includes(time)

                return (
                  <button
                    key={time}
                    disabled={isBusy}
                    onClick={() => setSelectedTime(time)}
                    style={{
                      padding: 10,
                      background: isBusy
                        ? "#ddd"
                        : selectedTime === time
                        ? "green"
                        : "white"
                    }}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <br />

        <button onClick={submitBooking}>
          Записаться
        </button>
      </div>
    )
  }

  // =========================
  // 💻 CRM (без изменений)
  // =========================

  const total = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0)

  const paid = projects.reduce((sum, p) => {
    if (p.paid) return sum + Number(p.budget || 0)
    return sum
  }, 0)

  const pending = total - paid

  const today = new Date()

  const overdue = projects.filter(
    p => new Date(p.deadline) < today && p.status !== "✅ Оплачено"
  )

  const waiting = projects.filter(p => p.status === "waiting_payment")
  const active = projects.filter(p => p.status === "active")

  function renderProject(p, i) {
    return (
      <div key={i} style={{
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
      }}>
        <h3>{p.title}</h3>
        <p>👤 {p.client_name}</p>
        <p>💰 {p.budget}</p>
        <p>📅 {p.deadline}</p>

        <p>
          📊 {p.status} | {p.paid ? "✅ Оплачено" : "❌ Не оплачено"}
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>💰 Деньги</h2>
      <p>Всего: {total}</p>
      <p>Получено: {paid}</p>
      <p>В работе: {pending}</p>

      <h1>📁 Мои проекты</h1>

      <h2>🔴 Просрочено</h2>
      {overdue.map(renderProject)}

      <h2>🟡 Ждут оплату</h2>
      {waiting.map(renderProject)}

      <h2>🟢 В работе</h2>
      {active.map(renderProject)}
    </div>
  )
}