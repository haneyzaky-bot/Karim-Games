هذا المجلد مخصص لحزم الصوت (اختياري) ولا يتم شحن الصوت داخل الريبو لتقليل الحجم.

✅ الفكرة:
- تضع حزمة/حزم صوت داخل:
  assets/audio_packs/<pack_id>/
- وتضع ملف تعريف الحزم:
  assets/audio_packs/meta.json

✅ شكل meta.json (مثال):
{
  "defaultPackId": "hafs_48k_mono",
  "packs": [
    {
      "id": "hafs_48k_mono",
      "name": "حفص - 48kbps Mono (m4a)",
      "basePath": "assets/audio_packs/hafs_48k_mono",
      "format": "m4a",
      "naming": "SSS_AAA.m4a"
    }
  ]
}

✅ نظام التسمية:
- SSS = رقم السورة 3 أرقام (مثال: 002)
- AAA = رقم الآية 3 أرقام (مثال: 001)
- مثال ملف: 002_001.m4a

✅ إعدادات ضغط مقترحة (FFmpeg):
- AAC-LC
- 48kbps
- Mono
- 44.1kHz
أمر مثال (تحويل ملف واحد):
  ffmpeg -i input.mp3 -ac 1 -ar 44100 -c:a aac -b:a 48k output.m4a

ملاحظة: صفحة القرآن ستعمل بدون صوت إن لم توجد حزمة صوت.
