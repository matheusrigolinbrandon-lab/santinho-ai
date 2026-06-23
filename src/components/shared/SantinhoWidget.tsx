'use client'

import { useState, useRef, useEffect } from 'react'

const KB = [
  { k: ['ola','oi','bom dia','boa tarde','boa noite','hello'], r: 'Olá! 😊 Bem-vindo(a) à **Fundição Tropical**!\n\nSou o Santinho, consultor especialista. Estamos em **Maringá/PR** com tradição há **mais de 40 anos**.\n\nPosso te ajudar com:\n• Peças para cemitério\n• Imagens sacras\n• Churrasqueiras e espetos\n• Apliques para móveis\n• Peças sob medida\n\nO que você precisa?' },
  { k: ['cemiterio','tumulo','cruz','anjo','jazigo','sepultura','placa','coroa','letras'], r: 'Nossa linha para **cemitério**:\n\n✝️ Cruz Latina Grande (40×80cm) — R$280\n✝️ Cruz Latina Média (28×55cm) — R$180\n👼 Anjo Chorão (35×65cm) — R$680\n📋 Placa Memoriam — R$95\n🔤 Letras Tumulares — R$12/un\n\nAlumínio fundido, durável. Qual peça e quantidade você precisa?' },
  { k: ['sacro','religioso','imagem','nossa senhora','aparecida','cristo','sao francisco','crucifixo'], r: 'Linha **sacra**:\n\n🕊️ N. Sra. Aparecida 60cm — R$450\n🙏 São Francisco 50cm — R$380\n✝️ Cristo Redentor 30cm — R$180\n⛪ Crucifixo Parede 80cm — R$520\n\nAlto relevo riquíssimo. Qual te interessa?' },
  { k: ['churrasco','grelha','espeto','churrasqueira','ferro'], r: 'Para **churrasco**:\n\n🔥 Grelha Ferro 60×40cm — R$185\n🔥 Grelha Ferro 80×50cm — R$265\n🍖 Espeto Giratório Inox 120cm — R$145\n🎁 Kit Espeto+Garfo+Faca — R$195\n\nQual você precisa?' },
  { k: ['puxador','aplique','movel','armario','gaveta'], r: '**Apliques para móveis**:\n\n🪑 Puxador Colonial (par) — R$35\n🪑 Puxador Art Nouveau (par) — R$48\n📐 Cantoneiras (c/4) — R$52\n\nNatural, pintado ou patinado. Quantidade?' },
  { k: ['sob medida','personalizado','medida','projeto'], r: 'Fazemos **peças sob medida**! 📐\n\nPreciso de:\n1️⃣ Foto ou referência visual\n2️⃣ Medidas em cm (L×A×P)\n3️⃣ Material: alumínio, ferro ou inox\n4️⃣ Acabamento e quantidade\n\nOrçamento em até 24h úteis!' },
  { k: ['preco','valor','quanto','custa','custo'], r: 'Faixa de preços:\n\n📦 Cemitério: R$12 a R$680\n🕊️ Sacro: R$180 a R$520\n🔥 Churrasco: R$85 a R$320\n🪑 Apliques: R$35 a R$52\n\nPara valor exato com frete, me diga produto, quantidade e cidade!' },
  { k: ['orcamento','orcar','cotacao'], r: 'Para o **orçamento**:\n\n1️⃣ Produto(s) desejado(s)\n2️⃣ Quantidade\n3️⃣ Acabamento\n4️⃣ Cidade para frete\n\nRespondo em até 4 horas úteis!' },
  { k: ['prazo','entrega','demora','dias'], r: '**Prazos**:\n\n• Estoque: 3 a 7 dias úteis\n• Sob medida: 15 a 21 dias\n• Sacras: 10 a 20 dias\n\nApós pagamento, iniciamos imediatamente!' },
  { k: ['frete','envio','correio'], r: 'Enviamos para **todo o Brasil** 🚚\n\nCorreios PAC/Sedex e transportadora.\n**Frete grátis** acima de R$1.500 em Maringá/PR!' },
  { k: ['pagamento','pix','boleto','cartao'], r: '**Pagamento** 💳\n\n• PIX — 5% de desconto\n• Boleto — 3 dias úteis\n• Cartão — até 12x com juros' },
  { k: ['historia','empresa','anos','maringá','maringa','parana','tradicao'], r: 'A **Fundição Tropical** é uma empresa familiar de **Maringá, Paraná**, com **tradição há mais de 40 anos** em fundição artesanal. Atendemos todo o Brasil! 🔥' },
  { k: ['garantia','troca','defeito'], r: '**Garantia** de 12 meses ✅\n\nDefeitos de fabricação são substituídos sem custo, frete incluso.' },
]

function classify(msg: string): string | null {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const { k, r } of KB) {
    if (k.some(kw => m.includes(kw))) return r
  }
  return null
}

interface Msg { role: 'bot' | 'user' | 'sys'; text: string }

export default function SantinhoWidget() {
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState<Msg[]>([])
  const [input, setInput]     = useState('')
  const [typing, setTyping]   = useState(false)
  const [captured, setCaptured] = useState(false)
  const [showCap, setShowCap] = useState(false)
  const [capName, setCapName] = useState('')
  const [capPhone, setCapPhone] = useState('')
  const [capCity, setCapCity] = useState('')
  const [inited, setInited]   = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs, typing])

  function openWidget() {
    setOpen(true)
    if (!inited) {
      setInited(true)
      setTimeout(() => addMsg('bot', 'Olá! 😊 Bem-vindo(a) à **Fundição Tropical**!\n\nSou o **Santinho**, consultor especialista. Estamos em Maringá/PR com tradição há mais de 40 anos.\n\nPergunte sobre produtos, preços ou solicite um orçamento!'), 300)
    }
  }

  function addMsg(role: 'bot' | 'user' | 'sys', text: string) {
    setMsgs(prev => [...prev, { role, text }])
  }

  async function send() {
    const v = input.trim()
    if (!v || typing) return
    setInput('')
    addMsg('user', v)

    const shouldCap = !captured && /orcamento|preco|valor|comprar|quero|preciso|quanto custa/i.test(v)
      && msgs.filter(m => m.role === 'user').length >= 1

    setTyping(true)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 700))
    setTyping(false)

    // Try API first, fallback to local
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: v, session_id: `widget_${Date.now()}` }),
      })
      if (res.ok) {
        const data = await res.json()
        addMsg('bot', data.message)
      } else {
        throw new Error('API error')
      }
    } catch {
      const local = classify(v)
      addMsg('bot', local || 'Boa pergunta! 🤔 Não tenho essa informação agora, mas registrei para nossa equipe. Posso ajudar com produtos, preços ou prazos da Fundição Tropical!')
    }

    if (shouldCap) {
      setTimeout(() => {
        addMsg('bot', 'Para enviar seu orçamento pelo WhatsApp, preciso de algumas informações:')
        setShowCap(true)
      }, 800)
    }
  }

  async function submitCapture() {
    if (!capName.trim()) return
    setCaptured(true)
    setShowCap(false)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: capName, phone: capPhone, city: capCity, source: 'site' }),
      })
    } catch { /* non-critical */ }
    addMsg('sys', '✅ Lead salvo no CRM')
    addMsg('bot', `Perfeito, **${capName}**! 🎉 Suas informações foram salvas.\n\nNossa equipe entrará em contato pelo WhatsApp **${capPhone || 'informado'}** em até 4 horas úteis com o orçamento!\n\nPosso ajudar com mais alguma coisa?`)
  }

  function fmt(t: string) {
    return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
  }

  return (
    <>
      {/* Widget Box */}
      {open && (
        <div style={{
          position:'fixed', bottom:80, right:24, zIndex:99999,
          width:340, maxHeight:540,
          background:'#fff', borderRadius:14, border:'1px solid #ECEAE3',
          boxShadow:'0 16px 56px rgba(0,0,0,.2)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          fontFamily:'Segoe UI,system-ui,sans-serif',
        }}>
          {/* Header */}
          <div style={{ background:'#0F0F0F', padding:'12px 14px', display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:'#0F0F0F',flexShrink:0 }}>S</div>
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:'#fff' }}>Santinho</div>
              <div style={{ fontSize:9,color:'#C9A84C',display:'flex',alignItems:'center',gap:4 }}>
                <span style={{ width:5,height:5,borderRadius:'50%',background:'#1A7A4A',display:'inline-block' }} />
                Fundição Tropical · Online
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,.4)',fontSize:16,cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ background:'rgba(255,255,255,.04)',borderBottom:'1px solid #2C2C2C',padding:'3px 14px',fontSize:8,color:'#7A7670',letterSpacing:1.5,flexShrink:0 }}>
            MARINGÁ/PR · TRADIÇÃO HÁ MAIS DE 40 ANOS
          </div>

          {/* Messages */}
          <div ref={msgsRef} style={{ flex:1,overflowY:'auto',padding:10,background:'#F6F5F1',display:'flex',flexDirection:'column',gap:7,minHeight:220,maxHeight:300 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex',gap:5,alignItems:'flex-end',flexDirection:m.role==='user'?'row-reverse':'row' }}>
                {m.role !== 'user' && (
                  <div style={{ width:20,height:20,borderRadius:'50%',background:'#0F0F0F',color:'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,flexShrink:0 }}>S</div>
                )}
                <div
                  style={{
                    maxWidth:'82%', padding:'7px 10px', borderRadius:12, fontSize:12, lineHeight:1.55,
                    background: m.role==='user' ? '#0F0F0F' : m.role==='sys' ? 'rgba(201,168,76,.1)' : '#fff',
                    color: m.role==='user' ? '#fff' : m.role==='sys' ? '#7A5C0A' : '#0F0F0F',
                    borderRadius: m.role==='user' ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
                    boxShadow: m.role==='bot' ? '0 1px 3px rgba(0,0,0,.07)' : 'none',
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: fmt(m.text) }}
                />
              </div>
            ))}
            {typing && (
              <div style={{ display:'flex',gap:5,alignItems:'flex-end' }}>
                <div style={{ width:20,height:20,borderRadius:'50%',background:'#0F0F0F',color:'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800 }}>S</div>
                <div style={{ padding:'7px 11px',background:'#fff',borderRadius:'3px 12px 12px 12px',boxShadow:'0 1px 3px rgba(0,0,0,.07)',display:'flex',gap:3 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width:5,height:5,borderRadius:'50%',background:'#7A7670',display:'inline-block',animation:`bop 1.2s ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Capture form */}
          {showCap && (
            <div style={{ padding:10,background:'#fff',borderTop:'1px solid #ECEAE3',flexShrink:0 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#0F0F0F',marginBottom:7 }}>📋 Para enviar seu orçamento:</div>
              {[
                { ph:'Seu nome completo', val:capName, set:setCapName },
                { ph:'WhatsApp com DDD',  val:capPhone, set:setCapPhone },
                { ph:'Sua cidade',        val:capCity,  set:setCapCity },
              ].map((f,i) => (
                <input key={i} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ width:'100%',border:'1.5px solid #ECEAE3',borderRadius:7,padding:'6px 9px',fontSize:11,marginBottom:5,outline:'none',color:'#0F0F0F',background:'#F6F5F1',fontFamily:'inherit' }} />
              ))}
              <button onClick={submitCapture}
                style={{ width:'100%',background:'#C9A84C',color:'#0F0F0F',border:'none',borderRadius:7,padding:8,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit' }}>
                Confirmar e receber orçamento →
              </button>
            </div>
          )}

          {/* Input */}
          {!showCap && (
            <div style={{ padding:'7px 10px',borderTop:'1px solid #ECEAE3',display:'flex',gap:6,background:'#fff',flexShrink:0 }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Pergunte sobre produtos, preços..."
                style={{ flex:1,border:'1.5px solid #ECEAE3',borderRadius:18,padding:'7px 12px',fontSize:11,outline:'none',background:'#F6F5F1',color:'#0F0F0F',fontFamily:'inherit' }}
              />
              <button onClick={send} style={{ width:30,height:30,borderRadius:'50%',background:'#C9A84C',color:'#0F0F0F',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,fontSize:13 }}>
                ➤
              </button>
            </div>
          )}

          <div style={{ padding:'4px 13px',textAlign:'center',fontSize:8,color:'#7A7670',background:'#fff',borderTop:'1px solid #ECEAE3',letterSpacing:.4,flexShrink:0 }}>
            SANTINHO AI · FUNDIÇÃO TROPICAL · MARINGÁ/PR
          </div>
        </div>
      )}

      {/* Float Button */}
      <button
        onClick={open ? () => setOpen(false) : openWidget}
        style={{
          position:'fixed', bottom:24, right:24, zIndex:99999,
          width:54, height:54, borderRadius:'50%',
          background:'#C9A84C', border:'2.5px solid #E8C97A',
          boxShadow:'0 4px 22px rgba(201,168,76,.55)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', transition:'all .18s',
          fontSize:21, fontWeight:900, color:'#0F0F0F',
          fontFamily:'Segoe UI,system-ui,sans-serif',
        }}
        title="Falar com Santinho"
      >
        {open ? '✕' : 'S'}
        {!open && (
          <span style={{ position:'absolute',top:-2,right:-2,width:13,height:13,background:'#1A7A4A',borderRadius:'50%',border:'2px solid #fff' }} />
        )}
      </button>

      <style>{`
        @keyframes bop { 0%,80%,100%{transform:scale(1)} 40%{transform:scale(1.5)} }
      `}</style>
    </>
  )
}
