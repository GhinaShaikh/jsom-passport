import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import jsomBuilding from '../assets/jsom-building.jpg'
import { updatePassport, signOut, uploadGalleryPhoto, uploadProfilePhoto } from '../lib/supabase'

const UTD = {
  orange: '#C75B12',
  orangeLight: '#E8722A',
  orangeDark: '#9E4A0E',
  green: '#154734',
  white: '#FFFFFF',
  gray: '#3A3A3A',
}

const PAGES = ['cover', 'bio', 'about', 'jsom', 'campus', 'gallery']
const PAGE_LABELS = ['Cover', 'Profile', 'About Me', 'Your JSOM', 'Campus Map', 'Memories']

const jsomFacts = [
  { icon: '🎓', label: '#1 in Texas', detail: 'Ranked #1 public business school in Texas by U.S. News & World Report' },
  { icon: '🌍', label: 'Global Network', detail: 'Over 80,000 alumni spanning 100+ countries worldwide' },
  { icon: '🏢', label: 'Corporate Hub', detail: 'Located in the heart of the Dallas–Fort Worth business corridor' },
  { icon: '📊', label: 'Top Programs', detail: "Home to one of the nation's leading MBA and MS Finance programs" },
  { icon: '🤝', label: 'Industry Ties', detail: 'Partnerships with Fortune 500 companies including AT&T, Toyota & Goldman Sachs' },
  { icon: '⭐', label: 'AACSB Accredited', detail: 'Holds the gold standard of business school accreditation since 1994' },
]

const aboutFields = [
  { key: 'about_me', label: 'ABOUT ME', placeholder: 'What makes you, you?', rows: 3 },
  { key: 'fun_fact', label: 'FUN FACT', placeholder: 'What makes you fun?', rows: 2 },
  { key: 'utd_memory', label: 'FAVOURITE UTD MEMORY', placeholder: 'A comet memory you just cannot forget!', rows: 2 },
  { key: 'coffee_order', label: 'COFFEE ORDER', placeholder: 'Your coffee order — arguably the most accurate personality test.', rows: 2 },
]

function MRZLine({ name }) {
  const clean = (name || '').toUpperCase().replace(/[^A-Z]/g, '').padEnd(20, '<')
  const id = String(Date.now()).slice(-9)
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(0,0,0,0.2)', letterSpacing: 1.5, lineHeight: 1.9 }}>
      <div>P&lt;UTD{clean.slice(0, 14)}{'<'.repeat(10)}</div>
      <div>{id}8UTD{'<'.repeat(14)}</div>
    </div>
  )
}

// ─── GALLERY PHOTO SLOT ───────────────────────────────────────────────────────
function PhotoSlot({ index, url, onUpload, uploading }) {
  const inputRef = useRef()
  const cols = [UTD.orange, UTD.green, '#c0392b', '#8e44ad', '#2980b9', UTD.orangeDark]
  const c = cols[index % cols.length]

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return }
    await onUpload(index, file)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        background: url ? 'transparent' : `linear-gradient(135deg,${c}18,${c}28)`,
        border: `1px solid ${c}44`,
        borderRadius: 5,
        aspectRatio: '4/3',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: uploading ? 'wait' : 'pointer',
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { if (!uploading) { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 8px 20px ${c}33` } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${c}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: `${c}99`, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>UPLOADING…</div>
        </div>
      ) : url ? (
        <>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="photo-overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}>
            <div style={{ color: 'white', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2 }}>✎ CHANGE</div>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 24, opacity: 0.45, marginBottom: 4 }}>📷</div>
          <div style={{ color: `${c}99`, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>TAP TO ADD</div>
        </>
      )}
    </div>
  )
}

// ─── PROFILE PHOTO SLOT ───────────────────────────────────────────────────────
function ProfilePhotoSlot({ url, onUpload, uploading }) {
  const inputRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return }
    await onUpload(file)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        width: 96, height: 120, flexShrink: 0, borderRadius: 4,
        border: `2px solid ${UTD.orange}55`,
        background: url ? 'transparent' : `linear-gradient(135deg,${UTD.orange}15,${UTD.green}15)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: uploading ? 'wait' : 'pointer', overflow: 'hidden', position: 'relative',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => { if (!uploading) e.currentTarget.style.transform = 'scale(1.03)' }}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {uploading ? (
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${UTD.orange}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      ) : url ? (
        <>
          <img src={url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="photo-overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}>
            <div style={{ color: 'white', fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>✎ CHANGE</div>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 28, marginBottom: 4 }}>👤</div>
          <div style={{ color: UTD.orange, fontSize: 8, fontFamily: 'monospace', opacity: 0.7 }}>+ PHOTO</div>
        </>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PassportPage() {
  const { user, passport, refreshPassport } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [flipDir, setFlipDir] = useState('next')
  const [saving, setSaving] = useState(false)

  const [aboutLocal, setAboutLocal] = useState({
    about_me: passport?.about_me ?? '',
    fun_fact: passport?.fun_fact ?? '',
    utd_memory: passport?.utd_memory ?? '',
    coffee_order: passport?.coffee_order ?? '',
  })

  // Build gallery map { slotIndex: url } from passport.gallery_photos array
  const [galleryPhotos, setGalleryPhotos] = useState(() => {
    const map = {}
    ;(passport?.gallery_photos ?? []).forEach(p => { map[p.slot] = p.url })
    return map
  })
  const [profilePhoto, setProfilePhoto] = useState(passport?.profile_photo_url ?? '')
  const [uploadingSlot, setUploadingSlot] = useState(null)

  const handleAboutChange = (key, value) => {
    setAboutLocal(prev => ({ ...prev, [key]: value }))
    clearTimeout(window._saveTimer)
    window._saveTimer = setTimeout(async () => {
      setSaving(true)
      const { data, error } = await updatePassport(user.id, { [key]: value })
      if (!error && data) refreshPassport(data)
      setSaving(false)
    }, 900)
  }

  const handleGalleryUpload = async (slotIndex, file) => {
    setUploadingSlot(slotIndex)
    const { url, error } = await uploadGalleryPhoto(user.id, slotIndex, file)
    if (error) { alert('Upload failed: ' + error.message); setUploadingSlot(null); return }
    const newPhotos = { ...galleryPhotos, [slotIndex]: url }
    setGalleryPhotos(newPhotos)
    const asArray = Object.entries(newPhotos).map(([slot, u]) => ({ slot: Number(slot), url: u }))
    const { data, error: dbError } = await updatePassport(user.id, { gallery_photos: asArray })
    if (!dbError && data) refreshPassport(data)
    setUploadingSlot(null)
  }

  const handleProfileUpload = async (file) => {
    setUploadingSlot('profile')
    const { url, error } = await uploadProfilePhoto(user.id, file)
    if (error) { alert('Upload failed: ' + error.message); setUploadingSlot(null); return }
    setProfilePhoto(url)
    const { data, error: dbError } = await updatePassport(user.id, { profile_photo_url: url })
    if (!dbError && data) refreshPassport(data)
    setUploadingSlot(null)
  }

  const goTo = (idx) => {
    if (idx === page || flipping) return
    setFlipDir(idx > page ? 'next' : 'prev')
    setFlipping(true)
    setTimeout(() => { setPage(idx); setFlipping(false) }, 310)
  }

  const handleSignOut = async () => {
    if (!window.confirm('Sign out of your passport?')) return
    await signOut()
    navigate('/', { replace: true })
  }

  const isCover = page === 0

  if (!passport) {
    return (
      <div style={{ minHeight: '100vh', background: UTD.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 12, letterSpacing: 3 }}>LOADING PASSPORT…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 40% 20%, ${UTD.green} 0%, #071a10 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '16px 12px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;500;600&display=swap');
        @keyframes flipNext{0%{transform:perspective(1000px) rotateY(0)}50%{transform:perspective(1000px) rotateY(-10deg);opacity:0.7}100%{transform:perspective(1000px) rotateY(0)}}
        @keyframes flipPrev{0%{transform:perspective(1000px) rotateY(0)}50%{transform:perspective(1000px) rotateY(10deg);opacity:0.7}100%{transform:perspective(1000px) rotateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .flip-next{animation:flipNext 0.31s ease-in-out}
        .flip-prev{animation:flipPrev 0.31s ease-in-out}
        .navbtn:hover{opacity:1!important;background:rgba(199,91,18,0.2)!important}
        .about-row:hover{background:rgba(199,91,18,0.04)!important}
        .photo-slot-wrap:hover .photo-overlay{opacity:1!important}
        textarea.afield{
          width:100%;box-sizing:border-box;background:transparent;border:none;
          border-bottom:1px dashed ${UTD.orange}77;outline:none;resize:none;
          font-family:'Libre Baskerville',serif;color:${UTD.gray};
          font-size:13px;line-height:1.6;padding:2px 0;
        }
        textarea.afield::placeholder{color:#bbb;font-style:italic;}
        div:hover > .photo-overlay { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ color: UTD.orangeLight, fontFamily: "'Oswald', sans-serif", fontSize: 10, letterSpacing: 5, opacity: 0.7 }}>COMET PASSPORT · JSOM</div>
        {saving && <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 8, letterSpacing: 2 }}>SAVING…</div>}
      </div>

      <div
        className={flipping ? (flipDir === 'next' ? 'flip-next' : 'flip-prev') : ''}
        style={{
          width: 'min(430px,100%)', minHeight: 590,
          background: isCover
            ? `linear-gradient(155deg,${UTD.green} 0%,#0d3327 50%,${UTD.green} 100%)`
            : `linear-gradient(155deg,#f8f3ee 0%,#f0ebe2 60%,#f8f3ee 100%)`,
          borderRadius: 10,
          boxShadow: isCover
            ? `0 40px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(199,91,18,0.25)`
            : `0 40px 80px rgba(0,0,0,0.35),0 0 0 1px rgba(0,0,0,0.07)`,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, background: `linear-gradient(180deg,${UTD.orange} 0%,${UTD.orangeDark} 50%,${UTD.orange} 100%)`, opacity: isCover ? 1 : 0.45 }} />

        {isCover && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
            <defs><pattern id="tp" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <text x="2" y="16" fontSize="9" fill="white" fontFamily="monospace">UTD</text>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#tp)" />
          </svg>
        )}

        {!isCover && <div style={{ position: 'absolute', top: 13, right: 16, fontFamily: 'monospace', fontSize: 9, color: 'rgba(0,0,0,0.2)', letterSpacing: 2 }}>PAGE {String(page).padStart(2, '0')}</div>}

        <div style={{ padding: '30px 26px 26px 34px' }}>

          {/* COVER */}
          {page === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 520, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 10, width: '100%' }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
                  {[...Array(5)].map((_, i) => <div key={i} style={{ width: 5, height: 5, background: UTD.orange, borderRadius: '50%', opacity: 0.7 }} />)}
                </div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, color: UTD.orange, letterSpacing: 4, textAlign: 'center' }}>THE UNIVERSITY OF TEXAS AT DALLAS</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, color: UTD.white, letterSpacing: 1, textAlign: 'center' }}>Naveen Jindal School of Management</div>
                <div style={{ width: 50, height: 1, background: 'rgba(199,91,18,0.5)', marginTop: 6 }} />
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, color: UTD.white, letterSpacing: 5, fontWeight: 600 }}>COMET PASSPORT</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', color: UTD.orangeLight, fontSize: 12 }}>Digital Identity Document</div>
              </div>
              <div style={{ border: '1px solid rgba(199,91,18,0.35)', borderRadius: 8, padding: '16px 22px', textAlign: 'center', width: '82%', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 8, letterSpacing: 3, marginBottom: 5 }}>ISSUED TO</div>
                <div style={{ color: UTD.white, fontFamily: "'Oswald', sans-serif", fontSize: 20, letterSpacing: 3 }}>{passport.name?.toUpperCase()}</div>
                <div style={{ color: UTD.orangeLight, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 11, marginTop: 3 }}>{passport.major || 'Naveen Jindal School of Management'}</div>
                <div style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace', fontSize: 9, marginTop: 6, letterSpacing: 2 }}>{passport.passport_no}</div>
              </div>
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <MRZLine name={passport.name} />
              </div>
            </div>
          )}

          {/* BIO */}
          {page === 1 && (
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", color: UTD.orange, fontSize: 10, letterSpacing: 4, marginBottom: 18 }}>PERSONAL DETAILS</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <ProfilePhotoSlot url={profilePhoto} onUpload={handleProfileUpload} uploading={uploadingSlot === 'profile'} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ color: UTD.orange, fontFamily: 'monospace', fontSize: 7, letterSpacing: 2, opacity: 0.6 }}>FULL NAME</div>
                    <div style={{ color: UTD.gray, fontFamily: "'Oswald', sans-serif", fontSize: 17, letterSpacing: 2 }}>{passport.name?.toUpperCase()}</div>
                  </div>
                  {[['EMAIL', passport.email], ['PROGRAM', passport.major || '—'], ['CLASS OF', passport.year || '—']].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: UTD.orange, fontFamily: 'monospace', fontSize: 7, letterSpacing: 2, opacity: 0.55 }}>{k}</div>
                      <div style={{ color: UTD.gray, fontFamily: "'Libre Baskerville', serif", fontSize: 11 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: `${UTD.orange}28` }} />
                <div style={{ color: `${UTD.orange}70`, fontFamily: 'monospace', fontSize: 7, letterSpacing: 2 }}>PASSPORT VALIDITY</div>
                <div style={{ flex: 1, height: 1, background: `${UTD.orange}28` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: `${UTD.orange}0a`, border: `1px solid ${UTD.orange}22`, borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
                {[['ISSUED', new Date(passport.issued_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()], ['PASSPORT NO.', passport.passport_no], ['STATUS', 'ACTIVE']].map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ color: UTD.orange, fontFamily: 'monospace', fontSize: 7, letterSpacing: 1, opacity: 0.6, marginBottom: 3 }}>{k}</div>
                    <div style={{ color: UTD.gray, fontFamily: 'monospace', fontSize: 9 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '11px 14px', background: `${UTD.green}0d`, borderLeft: `3px solid ${UTD.green}`, borderRadius: '0 4px 4px 0' }}>
                <div style={{ color: UTD.green, fontFamily: 'monospace', fontSize: 7, letterSpacing: 2, marginBottom: 3 }}>SCHOOL</div>
                <div style={{ color: UTD.gray, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 12 }}>Naveen Jindal School of Management</div>
                <div style={{ color: `${UTD.gray}77`, fontFamily: 'monospace', fontSize: 9, marginTop: 2 }}>The University of Texas at Dallas</div>
              </div>
            </div>
          )}

          {/* ABOUT ME */}
          {page === 2 && (
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", color: UTD.orange, fontSize: 10, letterSpacing: 4, marginBottom: 4 }}>ABOUT ME</div>
              <div style={{ color: `${UTD.gray}77`, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 10, marginBottom: 14 }}>Tap any field to write — saves automatically</div>
              {aboutFields.map(({ key, label, placeholder, rows }) => (
                <div key={key} className="about-row" style={{ borderLeft: `2px solid ${UTD.orange}44`, padding: '10px 10px 10px 12px', borderRadius: '0 4px 4px 0', borderBottom: `1px solid ${UTD.orange}18`, marginBottom: 4, transition: 'background 0.15s' }}>
                  <div style={{ color: UTD.orange, fontFamily: 'monospace', fontSize: 8, letterSpacing: 2, opacity: 0.6, marginBottom: 5 }}>{label}</div>
                  <textarea className="afield" rows={rows} value={aboutLocal[key]} placeholder={placeholder} onChange={e => handleAboutChange(key, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* YOUR JSOM */}
          {page === 3 && (
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", color: UTD.orange, fontSize: 10, letterSpacing: 4, marginBottom: 14 }}>YOUR JSOM</div>
              <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 16, border: `1px solid ${UTD.orange}22`, height: 130, background: `linear-gradient(135deg, ${UTD.green}33, ${UTD.orange}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={jsomBuilding} alt="JSOM Building" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8 }} />
              </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  "In 1975, a small School of Management was founded at The University of Texas at Dallas with a simple belief: that business education should prepare leaders for a changing world. Over the decades, that vision grew into what we now know as the Naveen Jindal School of Management—a vibrant, global community of students, faculty, and alumni shaping industries across the world.",
                  "Through the support and legacy of alumnus Naveen Jindal, the school expanded its reach, its programs, and its impact—growing from a small academic unit into one of the largest business schools in the nation.",
                  "But the true story of JSOM is not just its growth. It is the people who walked its halls.",
                  "It is the friendships formed between classes, the mentors who believed in us, the late nights of ambition and uncertainty, and the quiet moments when we realized our futures were beginning to take shape.",
                  "JSOM is where possibilities turned into paths, where classmates became lifelong friends, and where every Comet found a place to belong.",
                  "And every reunion reminds us of something special: no matter where life takes us, JSOM will always be home.",
                ].map((para, i) => (
                  <p key={i} style={{
                    margin: 0,
                    color: i === 2 || i === 5 ? UTD.orange : UTD.gray,
                    fontFamily: "'Libre Baskerville', serif",
                    fontStyle: i === 2 || i === 5 ? 'italic' : 'normal',
                    fontWeight: i === 2 || i === 5 ? 700 : 400,
                    fontSize: i === 2 || i === 5 ? 12 : 11,
                    lineHeight: 1.75,
                  }}>{para}</p>
                ))}
              </div>

         {/* CAMPUS MAP */}
          {page === 4 && (
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", color: UTD.orange, fontSize: 10, letterSpacing: 4, marginBottom: 4 }}>CAMPUS MAP</div>
              <div style={{ color: `${UTD.gray}88`, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 11, marginBottom: 12 }}>
                The University of Texas at Dallas
              </div>
              <iframe
                src="https://map.concept3d.com/?id=1772#!s/"
                width="100%"
                height="450"
                style={{ border: 'none', display: 'block', borderRadius: 8 }}
                title="UTD Campus Map"
                allowFullScreen
              />
              <div style={{
                marginTop: 10, padding: '8px 12px',
                background: `${UTD.green}0d`,
                borderLeft: `3px solid ${UTD.green}`,
                borderRadius: '0 4px 4px 0',
              }}>
                <div style={{ color: UTD.gray, fontFamily: "'Libre Baskerville', serif", fontSize: 10, lineHeight: 1.6 }}>
                  📍 800 W Campbell Rd, Richardson, TX 75080
                </div>
              </div>
            </div>
          )}

          {/* MEMORIES */}
          {page === 5 && (
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", color: UTD.orange, fontSize: 10, letterSpacing: 4, marginBottom: 4 }}>MY MEMORIES</div>
              <div style={{ color: `${UTD.gray}88`, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 11, marginBottom: 16 }}>
                A place for the moments that made today worth remembering.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[...Array(6)].map((_, i) => (
                  <PhotoSlot key={i} index={i} url={galleryPhotos[i] || null} onUpload={handleGalleryUpload} uploading={uploadingSlot === i} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
        <button className="navbtn" onClick={() => page > 0 && goTo(page - 1)} style={{ background: 'rgba(199,91,18,0.1)', border: '1px solid rgba(199,91,18,0.28)', color: page === 0 ? 'rgba(199,91,18,0.2)' : UTD.orangeLight, borderRadius: 5, padding: '8px 16px', cursor: page === 0 ? 'default' : 'pointer', fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: 3, opacity: page === 0 ? 0.4 : 0.85, transition: 'all 0.2s' }}>← PREV</button>
        <div style={{ display: 'flex', gap: 7 }}>
          {PAGES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} title={PAGE_LABELS[i]} style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, border: 'none', background: i === page ? UTD.orange : 'rgba(199,91,18,0.25)', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
          ))}
        </div>
        <button className="navbtn" onClick={() => page < PAGES.length - 1 && goTo(page + 1)} style={{ background: 'rgba(199,91,18,0.1)', border: '1px solid rgba(199,91,18,0.28)', color: page === PAGES.length - 1 ? 'rgba(199,91,18,0.2)' : UTD.orangeLight, borderRadius: 5, padding: '8px 16px', cursor: page === PAGES.length - 1 ? 'default' : 'pointer', fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: 3, opacity: page === PAGES.length - 1 ? 0.4 : 0.85, transition: 'all 0.2s' }}>NEXT →</button>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace', fontSize: 8, letterSpacing: 3 }}>{passport.passport_no}</div>
        <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 8, letterSpacing: 2, cursor: 'pointer' }}>SIGN OUT</button>
      </div>
    </div>
  )
}
