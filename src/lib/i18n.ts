export type Lang = "en" | "hi";

export const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // nav (full + short)
  "nav.dashboard": "Dashboard",
  "nav.deliveries": "Deliveries",
  "nav.customers": "Daily customers",
  "nav.walkin": "Walk-in",
  "nav.settings": "Settings",
  "nav.short.dashboard": "Home",
  "nav.short.deliveries": "Deliver",
  "nav.short.customers": "Daily",
  "nav.short.walkin": "Walk-in",
  "nav.short.settings": "Settings",
  "app.signOut": "Sign out",

  // dashboard
  "dash.title": "Dashboard",
  "period.today": "Today",
  "period.week": "This week",
  "period.month": "This month",
  "dash.sales": "Sales",
  "dash.toCollect": "To collect",
  "dash.salesHint": "Everything sold {period}.",
  "dash.toCollectHint": "Everyone who owes you money right now.",
  "dash.dailyDeliveries": "Daily deliveries",
  "dash.walkinCustomers": "Walk-in customers",
  "dash.dailyCustomers": "Daily customers",
  "dash.starredItems": "Starred items",
  "dash.sold": "Sold",
  "dash.earned": "Earned",
  "dash.noDeliveries": "No deliveries yet.",
  "dash.noWalkin": "No walk-in sales yet.",
  "dash.nobodyDaily": "Nobody owes from the daily round.",
  "dash.daysOverdue": "{n} days overdue",

  // deliveries
  "deliv.title": "Log deliveries",
  "deliv.subtitle": "Enter what each customer got today, then save. Add extra items with “+ Add item”.",
  "deliv.date": "Delivery date",
  "deliv.dayTotal": "Day total",
  "deliv.addItem": "+ Add item…",
  "deliv.custom": "Custom item…",
  "deliv.save": "Save today's round",
  "deliv.saving": "Saving...",
  "deliv.saved": "Saved.",
  "deliv.needCustomers": "Add customers first to start logging deliveries.",
  "deliv.goCustomers": "Go to customers",

  // customers
  "cust.title": "Daily customers",
  "cust.subtitle": "People you deliver to regularly.",
  "cust.add": "+ Add daily customer",
  "cust.none": "No daily customers yet. Add your first one above.",
  "cust.paidUp": "Paid up",
  "cust.due": "{amt} due",
  "cust.noContact": "No contact on file",

  // walk-in
  "walk.title": "Walk-in orders",
  "walk.subtitle": "One-time or casual sales that aren't tied to a regular customer.",

  // settings
  "set.title": "Settings",
  "set.subtitle": "Defaults used across your customers and deliveries.",
  "set.businessName": "Business name",
  "set.reminderDay": "Reminder day of month (1–28)",
  "set.reminderHint": "Reminders appear starting on this day for customers with outstanding dues.",
  "set.save": "Save settings",
  "set.saving": "Saving...",
  "set.saved": "Saved.",
  "set.language": "Language",
  "set.languageHint": "Choose the language for the app.",
  "set.yourItems": "Your items",
  "set.starItems": "Star items",
  "set.installTitle": "Install app",
  "set.installAndroid": "Install Dairy Ledger on your phone for one-tap access, like a normal app.",
  "set.installIos": "On iPhone: tap the Share button in Safari, then “Add to Home Screen”.",
  "set.installed": "App is installed. ✓",
  "set.installBtn": "Install app",

  // common
  "common.save": "Save",
  "common.cancel": "Cancel",
};

const hi: Dict = {
  "nav.dashboard": "डैशबोर्ड",
  "nav.deliveries": "डिलीवरी",
  "nav.customers": "रोज़ के ग्राहक",
  "nav.walkin": "फुटकर",
  "nav.settings": "सेटिंग्स",
  "nav.short.dashboard": "होम",
  "nav.short.deliveries": "डिलीवरी",
  "nav.short.customers": "ग्राहक",
  "nav.short.walkin": "फुटकर",
  "nav.short.settings": "सेटिंग",
  "app.signOut": "साइन आउट",

  "dash.title": "डैशबोर्ड",
  "period.today": "आज",
  "period.week": "इस हफ़्ते",
  "period.month": "इस महीने",
  "dash.sales": "बिक्री",
  "dash.toCollect": "वसूलना है",
  "dash.salesHint": "{period} बिकी हर चीज़।",
  "dash.toCollectHint": "अभी जिन पर आपका पैसा बकाया है।",
  "dash.dailyDeliveries": "रोज़ की डिलीवरी",
  "dash.walkinCustomers": "फुटकर ग्राहक",
  "dash.dailyCustomers": "रोज़ के ग्राहक",
  "dash.starredItems": "स्टार आइटम",
  "dash.sold": "बिका",
  "dash.earned": "कमाई",
  "dash.noDeliveries": "अभी कोई डिलीवरी नहीं।",
  "dash.noWalkin": "अभी कोई फुटकर बिक्री नहीं।",
  "dash.nobodyDaily": "रोज़ के राउंड में किसी का बकाया नहीं।",
  "dash.daysOverdue": "{n} दिन से बकाया",

  "deliv.title": "डिलीवरी दर्ज करें",
  "deliv.subtitle": "हर ग्राहक को आज क्या दिया वो भरें, फिर सेव करें। “+ आइटम जोड़ें” से और चीज़ें जोड़ें।",
  "deliv.date": "डिलीवरी तारीख़",
  "deliv.dayTotal": "दिन का कुल",
  "deliv.addItem": "+ आइटम जोड़ें…",
  "deliv.custom": "कस्टम आइटम…",
  "deliv.save": "आज का राउंड सेव करें",
  "deliv.saving": "सेव हो रहा है...",
  "deliv.saved": "सेव हो गया।",
  "deliv.needCustomers": "डिलीवरी दर्ज करने के लिए पहले ग्राहक जोड़ें।",
  "deliv.goCustomers": "ग्राहक पेज पर जाएँ",

  "cust.title": "रोज़ के ग्राहक",
  "cust.subtitle": "जिन्हें आप नियमित डिलीवरी करते हैं।",
  "cust.add": "+ नया ग्राहक जोड़ें",
  "cust.none": "अभी कोई ग्राहक नहीं। ऊपर से पहला जोड़ें।",
  "cust.paidUp": "पूरा चुकता",
  "cust.due": "{amt} बकाया",
  "cust.noContact": "कोई संपर्क नहीं",

  "walk.title": "फुटकर ऑर्डर",
  "walk.subtitle": "एक बार की बिक्री जो किसी नियमित ग्राहक से जुड़ी नहीं है।",

  "set.title": "सेटिंग्स",
  "set.subtitle": "आपके ग्राहकों और डिलीवरी में उपयोग होने वाले डिफ़ॉल्ट।",
  "set.businessName": "व्यवसाय का नाम",
  "set.reminderDay": "महीने का रिमाइंडर दिन (1–28)",
  "set.reminderHint": "बकाया वाले ग्राहकों के लिए इस दिन से रिमाइंडर दिखते हैं।",
  "set.save": "सेटिंग्स सेव करें",
  "set.saving": "सेव हो रहा है...",
  "set.saved": "सेव हो गया।",
  "set.language": "भाषा",
  "set.languageHint": "ऐप की भाषा चुनें।",
  "set.yourItems": "आपके आइटम",
  "set.starItems": "स्टार आइटम",
  "set.installTitle": "ऐप इंस्टॉल करें",
  "set.installAndroid": "Dairy Ledger को अपने फ़ोन में इंस्टॉल करें — सामान्य ऐप की तरह एक टैप में खुलेगा।",
  "set.installIos": "आईफ़ोन पर: Safari में Share बटन दबाएँ, फिर “Add to Home Screen” चुनें।",
  "set.installed": "ऐप इंस्टॉल हो चुका है। ✓",
  "set.installBtn": "ऐप इंस्टॉल करें",

  "common.save": "सेव करें",
  "common.cancel": "रद्द करें",
};

const dicts: Record<Lang, Dict> = { en, hi };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = dicts[lang]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
