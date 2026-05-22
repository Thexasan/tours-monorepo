import Link from "next/link";
import { getLocale } from "next-intl/server";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Политика конфиденциальности — Traveling Tours",
};

export default async function PrivacyPage() {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-teal-50 text-teal-600">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Последнее обновление: 22 мая 2026 г.</p>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Политика конфиденциальности
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-12">
          Traveling Tours уважает вашу конфиденциальность. В этом документе объясняется, какие данные мы собираем, зачем и как их защищаем.
        </p>

        <div className="space-y-10 text-slate-700">

          <Section title="1. Кто мы">
            <p>
              Traveling Tours — туристическая реферальная платформа для бронирования туров.
              Мы выступаем оператором персональных данных в соответствии с Федеральным законом № 152-ФЗ
              «О персональных данных» (Россия) и применимым законодательством стран присутствия.
            </p>
          </Section>

          <Section title="2. Какие данные мы собираем">
            <ul className="space-y-2 list-none">
              <Li>Контактные данные: имя, email, номер телефона</Li>
              <Li>Документы: серия/номер паспорта (внутреннего и/или загранпаспорта) — только для оформления тура</Li>
              <Li>Данные поездки: желаемые даты, количество гостей, тип размещения</Li>
              <Li>Технические данные: IP-адрес, тип браузера, страницы просмотра (для аналитики)</Li>
              <Li>Реферальные данные: код приглашения, если вы перешли по реферальной ссылке</Li>
            </ul>
          </Section>

          <Section title="3. Зачем мы собираем данные">
            <ul className="space-y-2 list-none">
              <Li>Обработка и подтверждение заявок на бронирование туров</Li>
              <Li>Связь с вами по статусу заявки (email, уведомления)</Li>
              <Li>Оформление туристических документов и страховки</Li>
              <Li>Начисление бонусов и комиссий по реферальной программе</Li>
              <Li>Соблюдение требований законодательства</Li>
            </ul>
          </Section>

          <Section title="4. Как мы храним и защищаем данные">
            <p>
              Данные хранятся на защищённых серверах с применением шифрования (TLS/HTTPS).
              Доступ к персональным данным имеют только сотрудники, непосредственно занятые обработкой вашей заявки.
              Паспортные данные хранятся не дольше, чем это необходимо для выполнения заказа, и удаляются
              по вашему письменному запросу.
            </p>
          </Section>

          <Section title="5. Передача данных третьим лицам">
            <p className="mb-3">
              Мы не продаём ваши данные. Данные могут передаваться только:
            </p>
            <ul className="space-y-2 list-none">
              <Li>Туроператорам и отелям — для оформления тура, который вы забронировали</Li>
              <Li>Страховым компаниям — при оформлении туристической страховки</Li>
              <Li>Государственным органам — по законному требованию</Li>
            </ul>
          </Section>

          <Section title="6. Cookies и аналитика">
            <p>
              Мы используем cookies для корректной работы сайта (авторизация, реферальный трекинг).
              Аналитические cookies помогают нам улучшать сервис. Вы можете отключить cookies
              в настройках браузера, однако это может повлиять на работу некоторых функций сайта.
            </p>
          </Section>

          <Section title="7. Ваши права">
            <ul className="space-y-2 list-none">
              <Li>Запросить копию ваших данных, которые мы храним</Li>
              <Li>Потребовать исправления неверных данных</Li>
              <Li>Потребовать удаления данных (если нет активных заявок)</Li>
              <Li>Отозвать согласие на обработку данных в любой момент</Li>
            </ul>
            <p className="mt-3">
              Для реализации прав напишите нам на{" "}
              <a href="mailto:privacy@traveling-tours.com" className="text-teal-700 font-medium hover:underline">
                privacy@traveling-tours.com
              </a>
            </p>
          </Section>

          <Section title="8. Срок хранения данных">
            <p>
              Данные аккаунта хранятся до момента его удаления. Данные заявок (включая паспортные)
              хранятся в течение 3 лет с момента завершения тура в соответствии с требованиями
              бухгалтерского и налогового законодательства, после чего удаляются.
            </p>
          </Section>

          <Section title="9. Изменения политики">
            <p>
              Мы можем обновлять эту политику. При существенных изменениях уведомим вас по email.
              Актуальная версия всегда доступна на этой странице.
            </p>
          </Section>

          <Section title="10. Контакты">
            <p>
              По вопросам конфиденциальности:{" "}
              <a href="mailto:privacy@traveling-tours.com" className="text-teal-700 font-medium hover:underline">
                privacy@traveling-tours.com
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4">
          <Link
            href={`/${locale}/terms`}
            className="text-sm text-teal-700 font-medium hover:underline"
          >
            Условия бронирования →
          </Link>
          <Link
            href={`/${locale}`}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-[15px] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
