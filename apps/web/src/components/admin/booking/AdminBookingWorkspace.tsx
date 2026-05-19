"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft, FileText, Check, ChevronRight, MapPin, Users,
  DollarSign, Mail, Phone, Calendar, Download, Clock, AlertCircle, X, CreditCard,
} from "lucide-react";
import { useBooking } from "@/src/hooks/use-booking";
import { bookingDocumentsApi } from "@/src/shared/api/booking-documents-api";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import type { PaymentDetails } from "@tours/types";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import type { BookingStatus, BookingDocument } from "@tours/types";

const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  NEW:                 { label: "Новая",               cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",           dot: "bg-sky-500" },
  DOCUMENTS_REQUESTED: { label: "Ждём документы",      cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",  dot: "bg-violet-500" },
  DOCUMENTS_SUBMITTED: { label: "Документы загружены", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",  dot: "bg-orange-500" },
  IN_PROGRESS:         { label: "В работе",            cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",     dot: "bg-amber-500" },
  AWAITING_PAYMENT:    { label: "Ждём оплату",         cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",           dot: "bg-sky-500" },
  PAID:                { label: "Оплачена",            cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  COMPLETED:           { label: "Завершена",           cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",    dot: "bg-slate-500" },
  CANCELLED:           { label: "Отменена",            cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",        dot: "bg-rose-500" },
};

const KIND_LABEL: Record<string, string> = {
  PASSPORT_INTERNAL: "Внутренний паспорт",
  PASSPORT_FOREIGN:  "Заграничный паспорт",
  PAYMENT_RECEIPT:   "Квитанция об оплате",
  OTHER:             "Другой документ",
};

function DocRow({ doc, bookingId }: { doc: BookingDocument; bookingId: string }) {
  const downloadUrl = bookingDocumentsApi.getDownloadUrl(bookingId, doc.id);
  const confirmed = !!doc.confirmedAt;
  const rejected = !!doc.rejectionNote && !doc.confirmedAt;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
      <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {KIND_LABEL[doc.kind] ?? doc.kind}
          {doc.description && <> · <span className="italic">{doc.description}</span></>}
        </p>
        {confirmed && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" /> Подтверждён
          </p>
        )}
        {rejected && (
          <p className="text-xs text-rose-600 mt-1">Отклонён: {doc.rejectionNote}</p>
        )}
      </div>
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-orange-700 hover:bg-orange-50 transition-colors"
        title="Скачать"
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}

export function AdminBookingWorkspace({ bookingId }: { bookingId: string }) {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";
  const qc = useQueryClient();

  const { data: booking, isLoading, isError } = useBooking(bookingId);

  const [reqNote, setReqNote] = useState("");
  const [reqPending, setReqPending] = useState(false);
  const [reqError, setReqError] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectPending, setRejectPending] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const [payBankName, setPayBankName] = useState("");
  const [payCardNumber, setPayCardNumber] = useState("");
  const [payInstructions, setPayInstructions] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payPending, setPayPending] = useState(false);
  const [payError, setPayError] = useState("");

  const showToast = (msg: string) => toast.success(msg);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["booking", bookingId] });

  async function handleUpdateStatus(newStatus: BookingStatus, note?: string) {
    setActionPending(true);
    setActionError("");
    try {
      await bookingsApi.updateStatus(bookingId, { status: newStatus, managerNotes: note });
      await invalidate();
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      const labels: Partial<Record<BookingStatus, string>> = {
        IN_PROGRESS: "Заявка принята",
        PAID: "Отмечена как оплаченная",
        COMPLETED: "Тур завершён",
        CANCELLED: "Заявка отменена",
      };
      showToast(labels[newStatus] ?? "Статус обновлён");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setActionError(msg);
      toast.error("Не удалось обновить статус", { description: msg });
    } finally {
      setActionPending(false);
    }
  }

  async function handleRequestPayment() {
    if (!payBankName.trim() || !payCardNumber.trim() || !payInstructions.trim()) {
      setPayError("Заполните все поля реквизитов");
      return;
    }
    setPayPending(true);
    setPayError("");
    try {
      await bookingsApi.requestPayment(bookingId, {
        bankName: payBankName.trim(),
        cardNumber: payCardNumber.trim(),
        instructions: payInstructions.trim(),
        amount: payAmount ? Number(payAmount) : undefined,
      });
      await invalidate();
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      showToast("Счёт выставлен, турист получил уведомление");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setPayError(msg);
      toast.error("Не удалось выставить счёт", { description: msg });
    } finally {
      setPayPending(false);
    }
  }

  async function handleCancel() {
    if (cancelReason.trim().length < 3) {
      setCancelError("Укажите причину (минимум 3 символа)");
      return;
    }
    setActionPending(true);
    setCancelError("");
    try {
      await bookingsApi.updateStatus(bookingId, { status: "CANCELLED", cancelReason: cancelReason.trim() });
      await invalidate();
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      setCancelReason("");
      setShowCancelModal(false);
      showToast("Заявка отменена");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setCancelError(msg);
      toast.error("Не удалось отменить заявку", { description: msg });
    } finally {
      setActionPending(false);
    }
  }

  async function handleRequestDocuments() {
    setReqPending(true);
    setReqError("");
    try {
      await bookingDocumentsApi.requestDocuments(bookingId, reqNote || undefined);
      setReqNote("");
      await invalidate();
      showToast("Запрос документов отправлен туристу");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setReqError(msg);
      toast.error("Не удалось отправить запрос", { description: msg });
    } finally {
      setReqPending(false);
    }
  }

  async function handleConfirmDocuments() {
    setConfirmPending(true);
    setConfirmError("");
    try {
      await bookingDocumentsApi.confirmDocuments(bookingId);
      await invalidate();
      showToast("Документы подтверждены");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setConfirmError(msg);
      toast.error("Не удалось подтвердить документы", { description: msg });
    } finally {
      setConfirmPending(false);
    }
  }

  async function handleRejectDocuments() {
    if (rejectionNote.trim().length < 3) {
      setRejectError("Укажите причину (минимум 3 символа)");
      return;
    }
    setRejectPending(true);
    setRejectError("");
    try {
      await bookingDocumentsApi.rejectDocuments(bookingId, rejectionNote.trim());
      setRejectionNote("");
      setShowRejectModal(false);
      await invalidate();
      showToast("Запрос исправлений отправлен туристу");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setRejectError(msg);
      toast.error("Не удалось отправить запрос исправлений", { description: msg });
    } finally {
      setRejectPending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-28 rounded bg-slate-100" />
        <div className="tv-surface h-40" />
        <div className="tv-surface h-48" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="tv-surface p-8 text-center text-rose-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        Не удалось загрузить заявку. Попробуйте обновить страницу.
      </div>
    );
  }

  const tour = booking.tour;
  const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru ?? "—") : "—";
  const statusMeta = STATUS_META[booking.status]!;
  const status = booking.status;

  return (
    <div className="space-y-5">
      <Link
        href={`/${locale}/admin/bookings`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Все заявки
      </Link>

      {/* Booking header card */}
      <div className="tv-surface p-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="relative w-full md:w-36 md:h-36 aspect-video md:aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/70 shrink-0">
            {tour?.coverImage ? (
              <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="144px" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">Без фото</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 leading-tight flex-1">{tourTitle}</h1>
              <span className={`tv-chip ${statusMeta.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>
            {tour?.country && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                <MapPin className="h-3.5 w-3.5 text-orange-600" />
                {tour.country}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {booking.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {booking.contactPhone}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {booking.contactName} · {booking.guestsCount} гостей
              </div>
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <DollarSign className="h-3.5 w-3.5" />
                ${booking.totalPriceUsd}
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
              <Calendar className="h-3 w-3" />
              Создана {new Date(booking.createdAt).toLocaleString("ru-RU")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left: documents + history */}
        <div className="space-y-4">
          <div className="tv-surface-elevated p-5">
            {(() => {
              const passportDocs = booking.documents.filter((d) => d.kind !== "PAYMENT_RECEIPT");
              const receiptDocs = booking.documents.filter((d) => d.kind === "PAYMENT_RECEIPT");
              return (
                <>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Документы туриста
                    {passportDocs.length > 0 && (
                      <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {passportDocs.length}
                      </span>
                    )}
                  </h2>
                  {passportDocs.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Документы ещё не загружены</p>
                  ) : (
                    <div className="space-y-2">
                      {passportDocs.map((doc) => (
                        <DocRow key={doc.id} doc={doc} bookingId={bookingId} />
                      ))}
                    </div>
                  )}

                  {receiptDocs.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <CreditCard className="h-4 w-4 text-sky-500" />
                        Квитанции об оплате
                      </h3>
                      <div className="space-y-2">
                        {receiptDocs.map((doc) => (
                          <DocRow key={doc.id} doc={doc} bookingId={bookingId} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {booking.statusHistory.length > 0 && (
            <div className="tv-surface-elevated p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">История статусов</h2>
              <div className="relative">
                {booking.statusHistory.map((h, i) => {
                  const toMeta = STATUS_META[h.toStatus];
                  const isLast = i === booking.statusHistory.length - 1;
                  return (
                    <div key={h.id} className="flex gap-3 pb-4 relative">
                      {!isLast && (
                        <div className="absolute left-[9px] top-5 bottom-0 w-px bg-slate-200" />
                      )}
                      <span className={`h-[18px] w-[18px] rounded-full ${toMeta?.dot ?? "bg-slate-300"} ring-2 ring-white shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {h.fromStatus && (
                            <>
                              <span className={`text-xs font-medium tv-chip ${STATUS_META[h.fromStatus]?.cls ?? ""}`}>
                                {STATUS_META[h.fromStatus]?.label}
                              </span>
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                            </>
                          )}
                          <span className={`text-xs font-medium tv-chip ${toMeta?.cls ?? ""}`}>
                            {toMeta?.label}
                          </span>
                        </div>
                        {h.note && (
                          <p className="text-xs text-slate-500 mt-1 italic">«{h.note}»</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(h.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: actions rail */}
        <div>
          <div className="tv-surface-elevated p-5 space-y-4 sticky top-6">
            <h2 className="text-base font-semibold text-slate-900">Действия</h2>

            {actionError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{actionError}
              </p>
            )}

            {/* NEW: accept + request docs + cancel */}
            {status === "NEW" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Новая заявка. Примите её, чтобы начать оформление — турист получит уведомление.
                </p>
                <Button
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={actionPending}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {actionPending ? "…" : "✓ Принять заявку"}
                </Button>
                <div className="pt-1 border-t border-slate-100 space-y-3">
                  <p className="text-xs text-slate-500">Или сразу запросить документы:</p>
                  <textarea
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="Примечание туристу (необязательно)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 transition-colors"
                  />
                  {reqError && <p className="text-xs text-rose-600">{reqError}</p>}
                  <Button
                    variant="outline"
                    onClick={handleRequestDocuments}
                    disabled={reqPending}
                    className="w-full"
                  >
                    {reqPending ? "Отправка…" : "Запросить документы"}
                  </Button>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => { setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                    className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Отменить заявку
                  </Button>
                </div>
              </div>
            )}

            {/* IN_PROGRESS: request docs + request payment + cancel */}
            {status === "IN_PROGRESS" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Запросите документы у туриста:</p>
                  <textarea
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="Примечание туристу (необязательно)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 transition-colors"
                  />
                  {reqError && <p className="text-xs text-rose-600">{reqError}</p>}
                  <Button
                    variant="outline"
                    onClick={handleRequestDocuments}
                    disabled={reqPending}
                    className="w-full"
                  >
                    {reqPending ? "Отправка…" : "Запросить документы"}
                  </Button>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-sky-600" />
                    Выставить счёт на оплату
                  </p>
                  <input
                    type="text"
                    value={payBankName}
                    onChange={(e) => setPayBankName(e.target.value)}
                    placeholder="Банк (напр. Сбербанк)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-colors"
                  />
                  <input
                    type="text"
                    value={payCardNumber}
                    onChange={(e) => setPayCardNumber(e.target.value)}
                    placeholder="Карта / счёт (напр. 4276 1234 5678 9012)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-colors"
                  />
                  <textarea
                    value={payInstructions}
                    onChange={(e) => setPayInstructions(e.target.value)}
                    placeholder="Инструкции туристу (на чьё имя, что писать в комментарии…)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-colors"
                  />
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`Сумма (по умолч. $${booking.totalPriceUsd})`}
                    min={0}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-colors"
                  />
                  {payError && <p className="text-xs text-rose-600">{payError}</p>}
                  <Button
                    onClick={handleRequestPayment}
                    disabled={payPending}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    {payPending ? "Отправка…" : "Выставить счёт"}
                  </Button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => { setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                    className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Отменить заявку
                  </Button>
                </div>
              </div>
            )}

            {/* DOCUMENTS_REQUESTED: waiting + cancel */}
            {status === "DOCUMENTS_REQUESTED" && (
              <div className="space-y-3">
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-center space-y-2">
                  <Clock className="h-6 w-6 text-violet-500 mx-auto" />
                  <p className="text-sm font-medium text-violet-800">Ожидание документов</p>
                  <p className="text-xs text-violet-600">
                    Туристу отправлено уведомление. Обновите страницу, чтобы проверить статус.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                  className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Отменить заявку
                </Button>
              </div>
            )}

            {/* DOCUMENTS_SUBMITTED: confirm / reject + cancel */}
            {status === "DOCUMENTS_SUBMITTED" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Турист загрузил документы. Проверьте и подтвердите или запросите исправления.
                </p>
                {confirmError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />{confirmError}
                  </p>
                )}
                <Button
                  onClick={handleConfirmDocuments}
                  disabled={confirmPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {confirmPending ? "Подтверждение…" : "✓ Подтвердить документы"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setRejectionNote(""); setRejectError(""); setShowRejectModal(true); }}
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  Запросить исправления
                </Button>
                <div className="pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => { setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                    className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Отменить заявку
                  </Button>
                </div>
              </div>
            )}

            {/* AWAITING_PAYMENT: show bank details + receipt check + confirm */}
            {status === "AWAITING_PAYMENT" && (() => {
              const receiptDocs = booking.documents.filter((d) => d.kind === "PAYMENT_RECEIPT");
              const pd = booking.paymentDetails as PaymentDetails | null;
              return (
                <div className="space-y-3">
                  {pd && (
                    <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-2">Реквизиты для оплаты</p>
                      <p className="text-sm text-sky-900"><span className="font-semibold">Банк:</span> {pd.bankName}</p>
                      <p className="text-sm text-sky-900"><span className="font-semibold">Карта/счёт:</span> {pd.cardNumber}</p>
                      <p className="text-sm text-sky-900"><span className="font-semibold">Сумма:</span> ${pd.amount}</p>
                      {pd.instructions && <p className="text-xs text-sky-700 italic mt-1">{pd.instructions}</p>}
                    </div>
                  )}

                  {receiptDocs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                        <p className="text-sm font-medium text-amber-800">Квитанция загружена — проверьте ниже</p>
                      </div>
                      <Button
                        onClick={() => handleUpdateStatus("PAID")}
                        disabled={actionPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {actionPending ? "…" : "✓ Подтвердить оплату"}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center space-y-1">
                      <Clock className="h-6 w-6 text-amber-500 mx-auto" />
                      <p className="text-sm font-medium text-amber-800">Ожидание квитанции</p>
                      <p className="text-xs text-amber-600">Турист должен загрузить скриншот перевода</p>
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={() => { setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                      className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      Отменить заявку
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* PAID: complete */}
            {status === "PAID" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Оплата получена. После завершения тура закройте заявку.
                </p>
                <Button
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  disabled={actionPending}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                >
                  {actionPending ? "…" : "Завершить тур"}
                </Button>
              </div>
            )}

            {(status === "COMPLETED" || status === "CANCELLED") && (
              <p className="text-sm text-slate-400 text-center py-4">
                {status === "COMPLETED" ? "Тур завершён. Действий нет." : "Заявка отменена."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="tv-surface-elevated p-6 w-full max-w-md space-y-4 rounded-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Запросить исправления</h2>
            <p className="text-sm text-slate-500">
              Опишите, что нужно исправить. Турист получит email с вашим комментарием и сможет загрузить документы заново.
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Например: паспорт нечёткий, нужна страница с пропиской"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 transition-colors"
            />
            {rejectError && <p className="text-sm text-rose-600">{rejectError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Отмена
              </Button>
              <Button
                onClick={handleRejectDocuments}
                disabled={rejectPending}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {rejectPending ? "Отправка…" : "Отправить"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="tv-surface-elevated p-6 w-full max-w-md space-y-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Отменить заявку</h2>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Укажите причину отмены. Турист получит email-уведомление.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Например: клиент передумал, тур снят с продажи…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-rose-500/15 focus:border-rose-400 transition-colors"
            />
            {cancelError && <p className="text-sm text-rose-600">{cancelError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Назад
              </Button>
              <Button
                onClick={handleCancel}
                disabled={actionPending}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionPending ? "Отмена…" : "Отменить заявку"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
