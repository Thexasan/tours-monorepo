import Link from "next/link";
import { getLocale } from "next-intl/server";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Условия бронирования — Traveling Tours",
};

export default async function TermsPage() {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-teal-50 text-teal-600">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Последнее обновление: 22 мая 2026 г.</p>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Условия бронирования
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-12">
          Оставляя заявку на туристической платформе Traveling Tours, вы соглашаетесь с приведёнными ниже условиями.
        </p>

        <div className="space-y-10 text-slate-700">

          <Section title="1. Процесс бронирования">
            <p>
              Заявка на бронирование не является автоматическим подтверждением тура.
              После отправки заявки наш менеджер свяжется с вами в течение 20 минут
              (в рабочее время: пн–пт 09:00–19:00 МСК) для уточнения деталей и
              подтверждения наличия мест.
            </p>
            <p>
              Тур считается забронированным только после письменного подтверждения от менеджера
              и внесения предоплаты.
            </p>
          </Section>

          <Section title="2. Оплата">
            <ul className="space-y-2 list-none">
              <Li>Оплата производится <strong>после подтверждения брони менеджером</strong> — не в момент подачи заявки</Li>
              <Li>Реквизиты для оплаты предоставляются менеджером индивидуально</Li>
              <Li>Принимаем банковский перевод, карты российских и зарубежных банков</Li>
              <Li>Стоимость тура фиксируется в USD на момент подтверждения бронирования</Li>
            </ul>
          </Section>

          <Section title="3. Документы для оформления тура">
            <p>
              Для оформления тура вам потребуется предоставить копии документов
              (паспорт, загранпаспорт) через личный кабинет. Передача документов
              осуществляется по зашифрованному каналу. Данные используются исключительно
              для оформления туристических услуг.
            </p>
          </Section>

          <Section title="4. Отмена и изменение бронирования">
            <ul className="space-y-2 list-none">
              <Li><strong>До подтверждения менеджером</strong> — отмена бесплатна, без штрафов</Li>
              <Li><strong>После подтверждения, до внесения оплаты</strong> — отмена бесплатна</Li>
              <Li><strong>После внесения предоплаты</strong> — условия отмены зависят от тура и туроператора, уточняются менеджером</Li>
              <Li>Изменение дат или состава группы — по согласованию с менеджером, возможна доплата</Li>
            </ul>
          </Section>

          <Section title="5. Реферальная программа">
            <p>
              Если вы пришли по реферальной ссылке партнёра или другого клиента,
              вознаграждение начисляется только после полной оплаты тура. Реферальное
              вознаграждение не влияет на стоимость тура для вас.
            </p>
            <p>
              Самореферал (попытка записать себя в качестве своего же реферера)
              технически заблокирован. Злоупотребление реферальной программой может
              привести к аннулированию бонусов.
            </p>
          </Section>

          <Section title="6. Ответственность сторон">
            <p>
              Traveling Tours выступает агентом между клиентом и туроператором.
              Мы несём ответственность за качество сервиса бронирования, корректную
              передачу данных туроператору и своевременное информирование клиента.
            </p>
            <p>
              Туроператор несёт ответственность за непосредственное исполнение
              туристических услуг (перелёт, проживание, экскурсии).
            </p>
          </Section>

          <Section title="7. Форс-мажор">
            <p>
              В случае обстоятельств непреодолимой силы (закрытие границ, стихийные бедствия,
              пандемия и т.д.) мы совместно с туроператором предлагаем перенос тура или возврат
              средств в соответствии с действующим законодательством.
            </p>
          </Section>

          <Section title="8. Персональные данные">
            <p>
              Оставляя заявку, вы даёте согласие на обработку персональных данных
              в соответствии с нашей{" "}
              <Link href={`/${locale}/privacy`} className="text-teal-700 font-medium hover:underline">
                Политикой конфиденциальности
              </Link>.
            </p>
          </Section>

          <Section title="9. Применимое право">
            <p>
              Настоящие условия регулируются законодательством Российской Федерации.
              Споры разрешаются путём переговоров, а при невозможности достичь согласия —
              в судебном порядке по месту нахождения исполнителя.
            </p>
          </Section>

          <Section title="10. Контакты">
            <p>
              По вопросам бронирования:{" "}
              <a href="mailto:support@traveling-tours.com" className="text-teal-700 font-medium hover:underline">
                support@traveling-tours.com
              </a>
            </p>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4">
          <Link
            href={`/${locale}/privacy`}
            className="text-sm text-teal-700 font-medium hover:underline"
          >
            Политика конфиденциальности →
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
