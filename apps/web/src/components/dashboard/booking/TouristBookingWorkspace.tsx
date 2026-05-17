"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft, FileText, Check, ChevronRight, MapPin, Users,
  DollarSign, Calendar, Upload, X, AlertCircle, Clock, CreditCard, Receipt,
} from "lucide-react";
import { useBooking } from "@/src/hooks/use-booking";
import { bookingDocumentsApi } from "@/src/shared/api/booking-documents-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import type { BookingStatus, BookingDocument, BookingDocumentKind, PaymentDetails } from "@tours/types";

const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string; description: string }> = {
  NEW:                 { label: "Новая",               cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",           dot: "bg-sky-500",     description: "Заявка получена, менеджер скоро свяжется" },
  DOCUMENTS_REQUESTED: { label: "Нужны документы",    cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",   dot: "bg-violet-500",  description: "Загрузите запрошенные документы ниже" },
  DOCUMENTS_SUBMITTED: { label: "Документы на проверке", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-100", dot: "bg-orange-500", description: "Менеджер проверяет ваши документы" },
  IN_PROGRESS:         { label: "В работе",            cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",      dot: "bg-amber-500",   description: "Документы подтверждены, заявка в обработке" },
  AWAITING_PAYMENT:    { label: "Ожидает оплаты",      cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",            dot: "bg-sky-500",     description: "Переведите оплату по реквизитам и загрузите квитанцию" },
  PAID:                { label: "Оплачена",            cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500", description: "Оплата получена, готовимся к поездке!" },
  COMPLETED:           { label: "Завершена",           cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",     dot: "bg-slate-500",   description: "Поездка завершена. Надеемся, вам понравилось!" },
  CANCELLED:           { label: "Отменена",            cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",         dot: "bg-rose-500",    description: "Заявка отменена" },
};

const STEPPER_STEPS = [
  { key: "request", label: "Заявка",     statuses: ["NEW", "DOCUMENTS_REQUESTED", "DOCUMENTS_SUBMITTED"] },
  { key: "docs",    label: "Документы",  statuses: ["IN_PROGRESS"] },
  { key: "payment", label: "Оплата",     statuses: ["PAID"] },
  { key: "done",    label: "Поездка",    statuses: ["COMPLETED"] },
] as const;

function getStepIndex(status: BookingStatus): number {
  if (status === "NEW" || status === "DOCUMENTS_REQUESTED" || status === "DOCUMENTS_SUBMITTED") return 0;
  if (status === "IN_PROGRESS") return 1;
  if (status === "AWAITING_PAYMENT") return 2;
  if (status === "PAID") return 2;
  if (status === "COMPLETED") return 3;
  return 0;
}

const KIND_LABEL: Record<BookingDocumentKind, string> = {
  PASSPORT_INTERNAL: "Внутренний паспорт",
  PASSPORT_FOREIGN:  "Заграничный паспорт",
  PAYMENT_RECEIPT:   "Квитанция об оплате",
  OTHER:             "Другой документ",
};

function DocRow({ doc }: { doc: BookingDocument }) {
  const confirmed = !!doc.confirmedAt;
  const rejected = !!doc.rejectionNote && !doc.confirmedAt;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${confirmed ? "border-emerald-100 bg-emerald-50/60" : rejected ? "border-rose-100 bg-rose-50/60" : "border-slate-100 bg-slate-50/60"}`}>
      <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${confirmed ? "text-emerald-500" : rejected ? "text-rose-400" : "text-slate-400"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {KIND_LABEL[doc.kind] ?? doc.kind}
          {doc.description && <> · <span className="italic">{doc.description}</span></>}
        </p>
        {confirmed && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" /> Подтверждён менеджером
          </p>
        )}
        {rejected && (
          <p className="text-xs text-rose-600 mt-1">
            Нужны исправления: {doc.rejectionNote}
          </p>
        )}
        {!confirmed && !rejected && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> На проверке
          </p>
        )}
      </div>
    </div>
  );
}

export function TouristBookingWorkspace({ bookingId, backPath = "dashboard/trips" }: { bookingId: string; backPath?: string }) {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";
  const qc = useQueryClient();

  const { data: booking, isLoading, isError } = useBooking(bookingId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kind, setKind] = useState<BookingDocumentKind>("PASSPORT_FOREIGN");
  const [description, setDescription] = useState("");
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);
  const [receiptPending, setReceiptPending] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const showToast = (msg: string) => {
    toast.success(msg);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["booking", bookingId] });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError("");
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Выберите файл");
      return;
    }
    setUploadPending(true);
    setUploadError("");
    try {
      await bookingDocumentsApi.uploadDocument(bookingId, selectedFile, kind, description || undefined);
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await invalidate();
      showToast("Документ загружен");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setUploadError(msg);
      toast.error("Ошибка загрузки документа", { description: msg });
    } finally {
      setUploadPending(false);
    }
  }

  async function handleReceiptUpload() {
    if (!selectedReceipt) {
      setReceiptError("Выберите файл квитанции");
      return;
    }
    setReceiptPending(true);
    setReceiptError("");
    try {
      await bookingDocumentsApi.uploadDocument(bookingId, selectedReceipt, "PAYMENT_RECEIPT", "Квитанция об оплате");
      setSelectedReceipt(null);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
      await invalidate();
      showToast("Квитанция загружена — менеджер проверит и подтвердит оплату");
    } catch (e) {
      const msg = extractErrorMessage(e);
      setReceiptError(msg);
      toast.error("Ошибка загрузки квитанции", { description: msg });
    } finally {
      setReceiptPending(false);
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
        Не удалось загрузить данные. Попробуйте обновить страницу.
      </div>
    );
  }

  const tour = booking.tour;
  const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru ?? "—") : "—";
  const statusMeta = STATUS_META[booking.status]!;
  const status = booking.status;
  const stepIndex = getStepIndex(status);
  const canUpload = status === "DOCUMENTS_REQUESTED";
  const canUploadReceipt = status === "AWAITING_PAYMENT";
  const passportDocs = booking.documents.filter((d) => d.kind !== "PAYMENT_RECEIPT");
  const receiptDocs = booking.documents.filter((d) => d.kind === "PAYMENT_RECEIPT");
  const pd = (booking.paymentDetails ?? null) as PaymentDetails | null;

  return (
    <div className="space-y-5">
      <Link
        href={`/${locale}/${backPath}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Мои поездки
      </Link>

      {/* Header card */}
      <div className="tv-surface p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="relative w-full sm:w-28 sm:h-28 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/70 shrink-0">
            {tour?.coverImage ? (
              <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="112px" />
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
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                {tour.country}
              </p>
            )}
            <p className="text-sm text-slate-600">{statusMeta.description}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {booking.guestsCount} гостей
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <DollarSign className="h-3.5 w-3.5" />
                ${booking.totalPriceUsd}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Calendar className="h-3 w-3" />
                {new Date(booking.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="tv-surface-elevated p-5">
        <div className="flex items-center gap-0">
          {STEPPER_STEPS.map((step, i) => {
            const done = stepIndex > i;
            const active = stepIndex === i && status !== "CANCELLED";
            const disabled = stepIndex < i || status === "CANCELLED";
            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    done   ? "bg-teal-600 text-white shadow-sm" :
                    active ? "bg-teal-600 text-white ring-4 ring-teal-500/20" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight px-1 ${
                    active ? "text-teal-700" : done ? "text-slate-700" : "text-slate-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPPER_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${done ? "bg-teal-600" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment block — shown only in AWAITING_PAYMENT */}
      {canUploadReceipt && pd && (
        <div
          className="tv-surface-elevated p-5 space-y-4"
          style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd" }}
        >
          <h2 className="text-base font-semibold text-sky-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-sky-600" />
            Реквизиты для оплаты
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-sky-600 font-semibold w-20 shrink-0">Банк:</span>
              <span className="text-sky-900 font-medium">{pd.bankName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-600 font-semibold w-20 shrink-0">Карта/счёт:</span>
              <span className="text-sky-900 font-bold tracking-wider">{pd.cardNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-600 font-semibold w-20 shrink-0">Сумма:</span>
              <span className="text-sky-900 font-bold">${pd.amount}</span>
            </div>
            {pd.instructions && (
              <p className="text-sky-700 bg-sky-100 rounded-xl px-3 py-2.5 text-xs leading-relaxed mt-2">
                {pd.instructions}
              </p>
            )}
          </div>

          {receiptDocs.length > 0 ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <p className="text-sm font-medium text-emerald-700 flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" /> Квитанция загружена — ожидаем подтверждения
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-sky-800 font-medium flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-sky-600" />
                Загрузите скриншот перевода
              </p>
              <div
                className="border-2 border-dashed border-sky-200 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all"
                onClick={() => receiptInputRef.current?.click()}
              >
                {selectedReceipt ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-sky-600" />
                    <span className="text-sm font-medium text-slate-700">{selectedReceipt.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedReceipt(null); if (receiptInputRef.current) receiptInputRef.current.value = ""; }}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-sky-300 mx-auto mb-2" />
                    <p className="text-sm text-sky-600">Нажмите для выбора файла</p>
                    <p className="text-xs text-sky-400 mt-1">JPEG, PNG, PDF — до 10 МБ</p>
                  </>
                )}
              </div>
              <input
                ref={receiptInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => { setSelectedReceipt(e.target.files?.[0] ?? null); setReceiptError(""); }}
                className="sr-only"
              />
              {receiptError && (
                <p className="text-sm text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />{receiptError}
                </p>
              )}
              <Button
                onClick={handleReceiptUpload}
                disabled={receiptPending || !selectedReceipt}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                {receiptPending ? "Загрузка…" : "Отправить квитанцию"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Documents section */}
      <div className="tv-surface-elevated p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Документы
        </h2>

        {passportDocs.length > 0 && (
          <div className="space-y-2">
            {passportDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </div>
        )}

        {canUpload ? (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-violet-700 bg-violet-50 rounded-xl px-4 py-3 border border-violet-100">
              Менеджер запросил документы. Загрузите паспорт(а) — это безопасно, файлы видны только вам и менеджеру.
            </p>

            {/* Kind selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Тип документа</label>
              <div className="flex flex-wrap gap-2">
                {(["PASSPORT_FOREIGN", "PASSPORT_INTERNAL", "OTHER"] as BookingDocumentKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      kind === k
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    {KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Чей документ? (необязательно)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Например: Загранник Ивана"
                maxLength={200}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:border-teal-500 transition-colors"
              />
            </div>

            {/* File picker */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Файл (JPEG, PNG, PDF, до 10 МБ)</label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span className="text-sm font-medium text-slate-700">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Нажмите для выбора файла</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={onFileChange}
                className="sr-only"
              />
            </div>

            {uploadError && (
              <p className="text-sm text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />{uploadError}
              </p>
            )}

            <Button onClick={handleUpload} disabled={uploadPending || !selectedFile} className="w-full">
              {uploadPending ? "Загрузка…" : "Загрузить документ"}
            </Button>
          </div>
        ) : status === "NEW" ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Менеджер скоро рассмотрит заявку и при необходимости запросит документы.
          </p>
        ) : passportDocs.length === 0 && !canUpload ? (
          <p className="text-sm text-slate-400 py-4 text-center">Документы не загружались</p>
        ) : null}
      </div>

      {/* Status history */}
      {booking.statusHistory.length > 0 && (
        <div className="tv-surface-elevated p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">История заявки</h2>
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
  );
}
