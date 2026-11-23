import { LAB_PRICE_UZS, SUCCESS_FEE_RANGE, formatUzs } from "@/lib/offers";

const labRu = formatUzs(LAB_PRICE_UZS);
const labUz = labRu.replace("сум", "so‘m");

const ru = {
  chooseLang: "Выберите язык / Tilni tanlang",
  welcome:
    "👋 Это FundingPro — гранты для бизнеса и молодёжи Узбекистана.\n\nВыберите, что вам нужно:",
  menu: {
    business: "💼 Гранты для бизнеса",
    startup: "🚀 Гранты для стартапов",
    individual: "🎓 Для молодёжи и студентов",
    ngo: "🤝 Гранты для НКО",
    lab: `🧭 «Мой путь» — ${labRu}`,
    request: "📝 Заявка под ключ",
    site: "🌐 Открыть сайт",
    language: "🌍 Язык / Til",
  },
  grantsTitle: (n: number) => `Открытые гранты (${n}):`,
  noGrants: "Сейчас открытых грантов этого типа нет. Оставьте заявку — подберём грант под ваш проект.",
  deadline: "дедлайн",
  more: "Все гранты на сайте",
  back: "⬅️ Меню",
  lab:
    `🧭 «Мой путь» — 30 дней с наставником до реально поданной заявки.\n\n✅ CV и мотивационное письмо\n✅ 10 возможностей под вас\n✅ сертификат после подачи\n\nСтоимость: ${labRu}.`,
  labCta: "Записаться",
  requestIntro:
    `📝 Заявка под ключ: подберём грант и подготовим заявку. Первая оценка бесплатно, гонорар за успех ${SUCCESS_FEE_RANGE} — только при выигрыше.\n\nКто вы?`,
  types: { business: "Бизнес (ООО, ИП)", startup: "Стартап", ngo: "НКО", individual: "Частное лицо / молодёжь" },
  askContact:
    "Нажмите кнопку ниже, чтобы отправить номер телефона. Отправляя номер, вы соглашаетесь, что FundingPro свяжется с вами для помощи с грантовой заявкой и обработает для этого ваши данные.",
  shareContact: "📱 Отправить мой номер",
  notOwnContact: "Пожалуйста, отправьте свой номер кнопкой «Отправить мой номер».",
  requestDone: "✅ Заявка принята! Мы позвоним в течение рабочего дня и бесплатно оценим ваши шансы.",
  requestDuplicate: "✅ Мы уже получили вашу заявку и скоро свяжемся с вами.",
  requestFailed: "Не получилось сохранить заявку. Напишите нам: info@fundingpro.uz",
  unknown: "Выберите пункт меню 👇",
};

export type BotTexts = typeof ru;

const uz: BotTexts = {
  chooseLang: "Tilni tanlang / Выберите язык",
  welcome: "👋 Bu FundingPro — O‘zbekiston biznesi va yoshlari uchun grantlar.\n\nSizga nima kerak?",
  menu: {
    business: "💼 Biznes uchun grantlar",
    startup: "🚀 Startaplar uchun grantlar",
    individual: "🎓 Yoshlar va talabalar uchun",
    ngo: "🤝 NNT uchun grantlar",
    lab: `🧭 «Mening yo‘lim» — ${labUz}`,
    request: "📝 Tayyor ariza",
    site: "🌐 Saytni ochish",
    language: "🌍 Til / Язык",
  },
  grantsTitle: (n: number) => `Ochiq grantlar (${n}):`,
  noGrants: "Hozircha bu turdagi ochiq grantlar yo‘q. Ariza qoldiring — loyihangizga mos grant topamiz.",
  deadline: "muddat",
  more: "Saytdagi barcha grantlar",
  back: "⬅️ Menyu",
  lab:
    `🧭 «Mening yo‘lim» — murabbiy bilan 30 kun, haqiqiy topshirilgan arizagacha.\n\n✅ CV va motivatsion xat\n✅ siz uchun 10 ta imkoniyat\n✅ topshirgandan keyin sertifikat\n\nNarxi: ${labUz}.`,
  labCta: "Yozilish",
  requestIntro:
    `📝 Tayyor ariza: grant topamiz va arizani tayyorlaymiz. Birinchi baholash bepul, muvaffaqiyat haqi ${SUCCESS_FEE_RANGE} — faqat g‘alaba bo‘lsa.\n\nSiz kimsiz?`,
  types: { business: "Biznes (MChJ, YaTT)", startup: "Startap", ngo: "NNT", individual: "Jismoniy shaxs / yoshlar" },
  askContact:
    "Telefon raqamingizni yuborish uchun quyidagi tugmani bosing. Raqamni yuborib, FundingPro grant arizasi bo‘yicha yordam berish uchun siz bilan bog‘lanishiga va shu maqsadda ma’lumotlaringizni qayta ishlashiga rozilik bildirasiz.",
  shareContact: "📱 Raqamimni yuborish",
  notOwnContact: "Iltimos, o‘z raqamingizni «Raqamimni yuborish» tugmasi orqali yuboring.",
  requestDone: "✅ Ariza qabul qilindi! Ish kuni davomida qo‘ng‘iroq qilamiz va imkoniyatlaringizni bepul baholaymiz.",
  requestDuplicate: "✅ Arizangizni allaqachon oldik, tez orada bog‘lanamiz.",
  requestFailed: "Arizani saqlab bo‘lmadi. Bizga yozing: info@fundingpro.uz",
  unknown: "Menyudan tanlang 👇",
};

export function botTexts(locale: "ru" | "uz"): BotTexts {
  return locale === "uz" ? uz : ru;
}
