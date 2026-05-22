"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft, FileText, Check, ChevronRight, MapPin, Users,
  DollarSign, Calendar, Upload, X, AlertCircle, Clock, CreditCard, Receipt,
  Download, QrCode,
} from "lucide-react";
import QRCodeSVG from "react-qr-code";
import { useBooking } from "@/src/hooks/use-booking";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { bookingDocumentsApi } from "@/src/shared/api/booking-documents-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import type { BookingStatus, BookingDocument, BookingDocumentKind, PaymentDetails } from "@tours/types";

async function triggerPdfDownload(bookingId: string) {
  const blob = await bookingsApi.downloadTicket(bookingId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${bookingId.slice(0, 8).toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const STATUS_STYLES: Record<BookingStatus, { cls: string; dot: string }> = {
  NEW:                  { cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",            dot: "bg-sky-500"     },
  DOCUMENTS_REQUESTED:  { cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",    dot: "bg-violet-500"  },
  DOCUMENTS_SUBMITTED:  { cls: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",          dot: "bg-teal-500"    },
  IN_PROGRESS:          { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",       dot: "bg-amber-500"   },
  AWAITING_PAYMENT:     { cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",             dot: "bg-sky-500"     },
  PAID:                 { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  COMPLETED:            { cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-500"   },
  CANCELLED:            { cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",          dot: "bg-rose-500"    },
};

function getStepIndex(status: BookingStatus): number {
  if (status === "NEW" || status === "DOCUMENTS_REQUESTED" || status === "DOCUMENTS_SUBMITTED") return 0;
  if (status === "IN_PROGRESS") return 1;
  if (status === "AWAITING_PAYMENT") return 2;
  if (status === "PAID") return 2;
  if (status === "COMPLETED") return 3;
  return 0;
}

function DocRow({ doc }: { doc: BookingDocument }) {
  const t = useTranslations("dashboard");
  const confirmed = !!doc.confirmedAt;
  const rejected = !!doc.rejectionNote && !doc.confirmedAt;

  const kindLabels: Record<BookingDocumentKind, string> = {
    PASSPORT_INTERNAL: t("client.trips.kindInternalPassport"),
    PASSPORT_FOREIGN:  t("client.trips.kindForeignPassport"),
    PAYMENT_RECEIPT:   t("client.trips.kindPaymentReceipt"),
    OTHER:             t("client.trips.kindOther"),
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${confirmed ? "border-emerald-100 bg-emerald-50/60" : rejected ? "border-rose-100 bg-rose-50/60" : "border-slate-100 bg-slate-50/60"}`}>
      <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${confirmed ? "text-emerald-500" : rejected ? "text-rose-400" : "text-slate-400"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {kindLabels[doc.kind] ?? doc.kind}
          {doc.description && <> · <span className="italic">{doc.description}</span></>}
        </p>
        {confirmed && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" /> {t("client.trips.docConfirmed")}
          </p>
        )}
        {rejected && (
          <p className="text-xs text-rose-600 mt-1">
            {t("client.trips.docRejected")} {doc.rejectionNote}
          </p>
        )}
        {!confirmed && !rejected && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {t("client.trips.docPending")}
          </p>
        )}
      </div>
    </div>
  );
}

interface TicketCardProps {
  bookingId: string;
  tourTitle: string;
  country: string;
  guestsCount: number;
  totalPriceUsd: number;
  preferredDate: string | null;
  paidAt: string | null;
}

function TicketCard({ bookingId, tourTitle, country, guestsCount, totalPriceUsd, preferredDate, paidAt }: TicketCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [downloading, setDownloading] = useState(false);
  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/dashboard/trips/${bookingId}`
    : `/${locale}/dashboard/trips/${bookingId}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      await triggerPdfDownload(bookingId);
    } catch {
      toast.error(t("client.trips.ticketDownloadError"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="tv-surface-elevated overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <QrCode className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t("client.trips.ticketTitle")}</h2>
            <p className="text-xs text-slate-500">{t("client.trips.ticketPresent")}</p>
          </div>
          <span className="ml-auto text-[10px] font-mono font-bold text-slate-400 tracking-widest">
            #{bookingId.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="relative my-4 flex items-center">
          <div className="absolute -left-5 h-5 w-5 rounded-full bg-slate-100" />
          <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
          <div className="absolute -right-5 h-5 w-5 rounded-full bg-slate-100" />
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">{t("client.trips.ticketTour")}</p>
              <p className="text-base font-bold text-slate-900 leading-tight line-clamp-2">{tourTitle}</p>
              {country && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-emerald-500" />{country}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t("client.trips.ticketGuests")}</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />{guestsCount} {t("client.trips.guestsLabel")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t("client.trips.ticketAmount")}</p>
                <p className="text-sm font-bold text-emerald-700">${totalPriceUsd}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t("client.trips.ticketDate")}</p>
                <p className="text-sm font-semibold text-slate-800">
                  {preferredDate
                    ? new Date(preferredDate).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })
                    : t("client.trips.ticketDateTBD")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t("client.trips.ticketPaid")}</p>
                <p className="text-sm font-semibold text-slate-800">
                  {paidAt
                    ? new Date(paidAt).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <QRCodeSVG
                value={qrUrl}
                size={110}
                fgColor="#0f172a"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center max-w-[120px] leading-tight">
              {t("client.trips.ticketScanHint")}
            </p>
          </div>
        </div>

        <div className="relative my-4 flex items-center">
          <div className="absolute -left-5 h-5 w-5 rounded-full bg-slate-100" />
          <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
          <div className="absolute -right-5 h-5 w-5 rounded-full bg-slate-100" />
        </div>

        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Download className="h-4 w-4" />
          {downloading ? t("client.trips.ticketDownloading") : t("client.trips.ticketDownload")}
        </Button>
      </div>
    </div>
  );
}

export function TouristBookingWorkspace({ bookingId, backPath = "dashboard/trips" }: { bookingId: string; backPath?: string }) {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tr";
  const t = useTranslations("dashboard");
  const qc = useQueryClient();

  const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string; description: string }> = {
    NEW:                 { label: t("client.trips.statusNew"),        cls: STATUS_STYLES.NEW.cls,                 dot: STATUS_STYLES.NEW.dot,                 description: t("client.trips.statusDescNew")              },
    DOCUMENTS_REQUESTED: { label: t("client.trips.statusDocsNeeded"), cls: STATUS_STYLES.DOCUMENTS_REQUESTED.cls, dot: STATUS_STYLES.DOCUMENTS_REQUESTED.dot, description: t("client.trips.statusDescDocsRequested")    },
    DOCUMENTS_SUBMITTED: { label: t("client.trips.statusDocsReview"), cls: STATUS_STYLES.DOCUMENTS_SUBMITTED.cls, dot: STATUS_STYLES.DOCUMENTS_SUBMITTED.dot, description: t("client.trips.statusDescDocsSubmitted")    },
    IN_PROGRESS:         { label: t("client.trips.statusInProgress"), cls: STATUS_STYLES.IN_PROGRESS.cls,         dot: STATUS_STYLES.IN_PROGRESS.dot,         description: t("client.trips.statusDescInProgress")       },
    AWAITING_PAYMENT:    { label: t("client.trips.statusPayment"),    cls: STATUS_STYLES.AWAITING_PAYMENT.cls,    dot: STATUS_STYLES.AWAITING_PAYMENT.dot,    description: t("client.trips.statusDescAwaitingPayment")  },
    PAID:                { label: t("client.trips.statusPaid"),       cls: STATUS_STYLES.PAID.cls,                dot: STATUS_STYLES.PAID.dot,                description: t("client.trips.statusDescPaid")             },
    COMPLETED:           { label: t("client.trips.statusCompleted"),  cls: STATUS_STYLES.COMPLETED.cls,           dot: STATUS_STYLES.COMPLETED.dot,           description: t("client.trips.statusDescCompleted")        },
    CANCELLED:           { label: t("client.trips.statusCancelled"),  cls: STATUS_STYLES.CANCELLED.cls,           dot: STATUS_STYLES.CANCELLED.dot,           description: t("client.trips.statusDescCancelled")        },
  };

  const STEPPER_STEPS = [
    { key: "request", label: t("client.trips.stepRequest") },
    { key: "docs",    label: t("client.trips.stepDocs")    },
    { key: "payment", label: t("client.trips.stepPayment") },
    { key: "done",    label: t("client.trips.stepDone")    },
  ];

  const KIND_LABEL: Record<BookingDocumentKind, string> = {
    PASSPORT_INTERNAL: t("client.trips.kindInternalPassport"),
    PASSPORT_FOREIGN:  t("client.trips.kindForeignPassport"),
    PAYMENT_RECEIPT:   t("client.trips.kindPaymentReceipt"),
    OTHER:             t("client.trips.kindOther"),
  };

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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["booking", bookingId] });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError("");
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError(t("client.trips.selectDocError"));
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
      toast.success(t("client.trips.docUploadedToast"));
    } catch (e) {
      const msg = extractErrorMessage(e);
      setUploadError(msg);
      toast.error(t("client.trips.docUploadErrorLabel"), { description: msg });
    } finally {
      setUploadPending(false);
    }
  }

  async function handleReceiptUpload() {
    if (!selectedReceipt) {
      setReceiptError(t("client.trips.selectReceiptError"));
      return;
    }
    setReceiptPending(true);
    setReceiptError("");
    try {
      await bookingDocumentsApi.uploadDocument(bookingId, selectedReceipt, "PAYMENT_RECEIPT", t("client.trips.kindPaymentReceipt"));
      setSelectedReceipt(null);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
      await invalidate();
      toast.success(t("client.trips.receiptUploadedToast"));
    } catch (e) {
      const msg = extractErrorMessage(e);
      setReceiptError(msg);
      toast.error(t("client.trips.receiptUploadErrorLabel"), { description: msg });
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
        {t("client.trips.detailLoadError")}
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
  const isPaidOrDone = status === "PAID" || status === "COMPLETED";
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
        {t("client.trips.backLink")}
      </Link>

      {/* Header card */}
      <div className="tv-surface p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="relative w-full sm:w-28 sm:h-28 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/70 shrink-0">
            {tour?.coverImage ? (
              <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="112px" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">{t("client.trips.noPhoto")}</div>
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
                {booking.guestsCount} {t("client.trips.guestsLabel")}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <DollarSign className="h-3.5 w-3.5" />
                ${booking.totalPriceUsd}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Calendar className="h-3 w-3" />
                {new Date(booking.createdAt).toLocaleDateString(locale)}
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

      {/* Ticket card — PAID / COMPLETED */}
      {isPaidOrDone && (
        <TicketCard
          bookingId={bookingId}
          tourTitle={tourTitle}
          country={tour?.country ?? ""}
          guestsCount={booking.guestsCount}
          totalPriceUsd={booking.totalPriceUsd}
          preferredDate={booking.preferredDate}
          paidAt={booking.paidAt}
        />
      )}

      {/* Payment block — AWAITING_PAYMENT */}
      {canUploadReceipt && pd && (
        <div
          className="tv-surface-elevated p-5 space-y-4"
          style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd" }}
        >
          <h2 className="text-base font-semibold text-sky-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-sky-600" />
            {t("client.trips.paymentTitle")}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-sky-600 font-semibold w-20 shrink-0">{t("client.trips.paymentBankLabel")}</span>
              <span className="text-sky-900 font-medium">{pd.bankName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-600 font-semibold w-20 shrink-0">{t("client.trips.paymentCardLabel")}</span>
              <span className="text-sky-900 font-bold tracking-wider">{pd.cardNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-600 font-semibold w-20 shrink-0">{t("client.trips.paymentAmountLabel")}</span>
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
                <Check className="h-4 w-4" /> {t("client.trips.receiptUploaded")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-sky-800 font-medium flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-sky-600" />
                {t("client.trips.uploadReceiptHint")}
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
                    <p className="text-sm text-sky-600">{t("client.trips.receiptClickToSelect")}</p>
                    <p className="text-xs text-sky-400 mt-1">{t("client.trips.receiptFileTypes")}</p>
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
                {receiptPending ? t("client.trips.uploadingLabel") : t("client.trips.sendReceiptBtn")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Documents section */}
      <div className="tv-surface-elevated p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          {t("client.trips.docsTitle")}
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
              {t("client.trips.docsRequestedHint")}
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t("client.trips.docTypeLabel")}</label>
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

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t("client.trips.docOwnerLabel")}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("client.trips.docOwnerPlaceholder")}
                maxLength={200}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t("client.trips.docFileLabel")}</label>
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
                    <p className="text-sm text-slate-500">{t("client.trips.docClickToSelect")}</p>
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
              {uploadPending ? t("client.trips.uploadingLabel") : t("client.trips.uploadDocBtn")}
            </Button>
          </div>
        ) : status === "NEW" ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            {t("client.trips.managerWillReview")}
          </p>
        ) : passportDocs.length === 0 && !canUpload ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t("client.trips.noDocs")}</p>
        ) : null}
      </div>

      {/* Status history */}
      {booking.statusHistory.length > 0 && (
        <div className="tv-surface-elevated p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">{t("client.trips.historyTitle")}</h2>
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
                      {new Date(h.createdAt).toLocaleString(locale)}
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
