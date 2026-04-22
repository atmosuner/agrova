/**
 * Fills empty msgstr in src/locales/tr/messages.po.
 * 1) msgstr = msgid when the source is already Turkish.
 * 2) Known English msgids get Turkish (product default locale = tr per DESIGN.md).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PO from 'pofile'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const trPath = path.join(__dirname, '../src/locales/tr/messages.po')

/** English (or mixed) source strings -> Turkish for owner/worker UI */
const EN_TO_TR = {
  Active: 'Aktif',
  Activity: 'Aktivite',
  Add: 'Ekle',
  Address: 'Adres',
  'Active fields (today)': 'Aktif tarlalar (bugün)',
  'Back to login': 'Girişe dön',
  'Create an account': 'Hesap oluştur',
  'Data export': 'Veri dışa aktarma',
  'Work email and password.': 'İş e-postası ve şifre.',
  'Owner sign-in': 'Sahip girişi',
  'Worker device': 'Worker cihazı',
  'Sign in (owner)': 'Giriş (sahip)',
  Email: 'E-posta',
  Password: 'Şifre',
  'Sign in': 'Giriş yap',
  'Signing in…': 'Giriş yapılıyor…',
  Privacy: 'Gizlilik',
  // po may split; use exact msgids from extract:
  'Android (Chrome)': 'Android (Chrome)',
  'Chrome’da agrova.app adresini açın.': "Chrome’da agrova.app adresini açın.",
  Download: 'İndir',
  Equipment: 'Ekipman',
  Fields: 'Tarlalar',
  Issues: 'Sorunlar',
  People: 'Kişiler',
  Settings: 'Ayarlar',
  Tasks: 'Görevler',
  Today: 'Bugün',
  Weather: 'Hava',
  'Open menu': 'Menüyü aç',
  'Close': 'Kapat',
  'Save': 'Kaydet',
  'Cancel': 'İptal',
  'Delete': 'Sil',
  'Edit': 'Düzenle',
  'Search': 'Ara',
  'Loading': 'Yükleniyor',
  'Error': 'Hata',
  'Success': 'Başarılı',
  'Optional': 'İsteğe bağlı',
  'Required': 'Gerekli',
  'Name': 'Ad',
  'Phone': 'Telefon',
  'Role': 'Rol',
  'Notes': 'Notlar',
  'Date': 'Tarih',
  'Status': 'Durum',
  'Priority': 'Öncelik',
  'Normal': 'Normal',
  'Low': 'Düşük',
  'Urgent': 'Acil',
  'Done': 'Bitti',
  'Open': 'Açık',
  'Blocked': 'Bloke',
  'Foreman': 'Formen',
  Agronomist: 'Ziraat mühendisi',
  Owner: 'Sahip',
  'Pending': 'Bekleyen',
  'In progress': 'Devam ediyor',
  'Form validation': 'Form doğrulama',
  'No results': 'Sonuç yok',
  'Try again': 'Yeniden dene',
  'Something went wrong': 'Bir şeyler ters gitti',
  'Network error': 'Ağ hatası',
  'Off': 'Kapalı',
  'On': 'Açık',
  'None': 'Yok',
  'All': 'Tümü',
  'Filter': 'Filtre',
  'Sort': 'Sırala',
  'Export': 'Dışa aktar',
  'Import': 'İçe aktar',
  'CSV': 'CSV',
  'Map': 'Harita',
  'List': 'Liste',
  'Table': 'Tablo',
  'Kanban': 'Kanban',
  'New': 'Yeni',
  'Report': 'Rapor',
  'Resolve': 'Çöz',
  'Photo': 'Fotoğraf',
  'Voice': 'Ses',
  'Submit': 'Gönder',
  'Back': 'Geri',
  'Next': 'İleri',
  'Previous': 'Önceki',
  'Page': 'Sayfa',
  of: ' / ',
  'No data': 'Veri yok',
  'Total': 'Toplam',
  'rows': 'satır',
  'Refresh': 'Yenile',
  'More': 'Daha fazla',
  'Less': 'Daha az',
  'Sign out': 'Çıkış yap',
  'Profile': 'Profil',
  'Notifications': 'Bildirimler',
  'History': 'Geçmiş',
  'This week': 'Bu hafta',
  'Offline': 'Çevrimdışı',
  'Online': 'Çevrimiçi',
  'Syncing': 'Eşitleniyor',
  'Synced': 'Eşitlendi',
  'Chemicals': 'Kimyasallar',
  'Usage': 'Kullanım',
  'Attach': 'Ekle',
  'Detach': 'Çıkar',
  'Applicator': 'Uygulayıcı',
}

const looksTurkish = (s) => /[ğüşıöçĞÜŞİÖÇİ]/.test(s) || /^(Ağ |Bu |Ç|İ|Ş|Ğ|Ö|Ü|ı)/.test(s)

function pickMsgstr(msgid) {
  if (EN_TO_TR[msgid] != null) return EN_TO_TR[msgid]
  if (looksTurkish(msgid) || msgid.length < 2) return msgid
  // Short Latin tokens often UI English
  if (msgid.length < 32 && !/\s{2,}/.test(msgid) && /^[A-Za-z][A-Za-z .,&\-']+$/.test(msgid)) {
    return EN_TO_TR[msgid] ?? msgid
  }
  return msgid
}

const raw = fs.readFileSync(trPath, 'utf8')
const po = PO.parse(raw)
let filled = 0
for (const item of po.items) {
  const cur = (item.msgstr[0] ?? '').trim()
  if (cur) continue
  if (!item.msgid) continue
  item.msgstr[0] = pickMsgstr(item.msgid)
  filled++
}
fs.writeFileSync(trPath, po.toString(), 'utf8')
console.log('Filled empty msgstr:', filled, 'in', trPath)
