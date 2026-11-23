# Personal data rules

## Consent (text version v1.0)

Show this checkbox, unticked by default, before sending a lead. Send `consent_text_version: "v1.0"`.

* **UZ:** «Men FundingPro (fundingpro.uz) grant arizasini tayyorlashda yordam berish maqsadida men bilan telefon yoki e-pochta orqali bog‘lanishiga hamda ushbu maqsadda ismim, kontaktlarim va tashkilotim haqidagi ma’lumotlarni qayta ishlashiga roziman.»
* **RU:** «Я согласен(на), чтобы FundingPro (fundingpro.uz) связался со мной по телефону или e-mail для помощи в подготовке грантовой заявки и обрабатывал для этого моё имя, контакты и данные об организации.»
* **EN:** “I agree that FundingPro (fundingpro.uz) may contact me by phone or e-mail to help me prepare a grant application and may process my name, contact details and organisation details for this purpose.”

If the wording changes, FundingPro issues a new version (`v1.1`, …).

## Rules

* Send leads only after the user ticks the consent box. Without consent → `422`, nothing is stored.
* Send only the fields listed in the API. No passport, tax ID, birth date or similar.
* Never put personal data in URLs, query strings, `utm_*` or `external_user_id`. Use an opaque internal id.
* Use HTTPS only (the API refuses plain HTTP).
* **Erasure requests:** if a user asks you to delete their data, forward the request (phone/e-mail) to FundingPro. We anonymise their leads. FundingPro staff can also do this from the admin panel.
* Retention: leads that did not become clients are anonymised after 12 months (FundingPro policy).

## Where data is stored

Leads are stored by FundingPro. Under Uzbekistan's Law on Personal Data (art. 27¹), data of citizens of Uzbekistan must be stored on servers in Uzbekistan. FundingPro is confirming the storage location with legal counsel **before production launch**. Partners will be notified of the final arrangement.
