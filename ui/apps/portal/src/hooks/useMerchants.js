import { useMemo, useState } from "react";
import {
  createDemoMerchants,
  generateApiKey,
  kycDocumentTypes,
  nextMerchantId
} from "../data/merchantData";

export default function useMerchants(onToast = () => {}) {
  const [merchants, setMerchants] = useState(createDemoMerchants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const selected = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedId) || null,
    [merchants, selectedId]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const status = statusFilter.toUpperCase();
    return merchants.filter((merchant) => {
      const haystack = [merchant.name, merchant.contact_name, merchant.email, merchant.reg_number]
        .join(" ")
        .toLowerCase();
      return (!status || merchant.status === status) && (!term || haystack.includes(term));
    });
  }, [merchants, search, statusFilter]);

  const stats = useMemo(() => {
    const active = merchants.filter((merchant) => merchant.status === "ACTIVE").length;
    const pending = merchants.filter((merchant) => merchant.kyc_status === "PENDING").length;
    const float = merchants.reduce((total, merchant) => total + Number(merchant.balance || 0), 0);
    const avgCommission = merchants.length
      ? merchants.reduce((total, merchant) => total + Number(merchant.commission_rate || 0), 0) / merchants.length
      : 0;
    return { total: merchants.length, active, pending, float, avgCommission };
  }, [merchants]);

  function authenticate(email, password) {
    const target = String(email || "").trim().toLowerCase();
    return merchants.find(
      (merchant) => merchant.email.toLowerCase() === target && merchant.password === password
    ) || null;
  }

  function findMerchant(id) {
    return merchants.find((merchant) => merchant.id === id) || null;
  }

  function patch(id, updater) {
    setMerchants((current) =>
      current.map((merchant) => (merchant.id === id ? { ...merchant, ...updater(merchant) } : merchant))
    );
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(merchant) {
    setEditing(merchant);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function saveMerchant(form) {
    if (editing) {
      patch(editing.id, () => ({
        name: form.name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        reg_number: form.reg_number,
        tax_number: form.tax_number,
        commission_rate: Number(form.commission_rate) || 0
      }));
      onToast("success", `Updated ${form.name}.`);
      closeForm();
      return;
    }

    const id = nextMerchantId();
    const merchant = {
      id,
      name: form.name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      reg_number: form.reg_number,
      tax_number: form.tax_number,
      status: "PENDING",
      kyc_status: "PENDING",
      pricing_model: "commission",
      commission_rate: Number(form.commission_rate) || 0,
      balance: Number(form.opening_float) || 0,
      api_key: "",
      api_key_status: "PENDING",
      api_key_last_used: null,
      kyc_documents: kycDocumentTypes.map((type) => ({ type, status: "MISSING" })),
      ledger: Number(form.opening_float)
        ? [{
            id: `led_${Math.floor(Math.random() * 1e9)}`,
            type: "TOPUP",
            amount: Number(form.opening_float),
            balance_after: Number(form.opening_float),
            note: "Opening float",
            created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
          }]
        : [],
      created_at: new Date().toISOString().slice(0, 10)
    };

    setMerchants((current) => [merchant, ...current]);
    onToast("success", `${form.name} onboarded — pending KYC review.`);
    closeForm();
    setSelectedId(id);
  }

  function approveKyc(id) {
    patch(id, () => ({
      kyc_status: "APPROVED",
      status: "ACTIVE",
      api_key: generateApiKey(),
      api_key_status: "ACTIVE",
      kyc_documents: kycDocumentTypes.map((type) => ({ type, status: "VERIFIED" }))
    }));
    onToast("success", "KYC approved — merchant activated with a live API key.");
  }

  function rejectKyc(id) {
    patch(id, () => ({ kyc_status: "REJECTED", status: "SUSPENDED", api_key_status: "REVOKED" }));
    onToast("error", "KYC rejected — merchant suspended.");
  }

  function setStatus(id, status) {
    patch(id, () => ({
      status,
      api_key_status: status === "SUSPENDED" ? "REVOKED" : status === "ACTIVE" ? "ACTIVE" : "PENDING"
    }));
    onToast(status === "ACTIVE" ? "success" : "error", `Merchant ${status.toLowerCase()}.`);
  }

  function topUp(id, amount, note) {
    const value = Number(amount);
    if (!value || value <= 0) {
      onToast("error", "Enter an amount greater than zero.");
      return;
    }
    patch(id, (merchant) => {
      const balance = Number(merchant.balance || 0) + value;
      return {
        balance,
        ledger: [
          {
            id: `led_${Math.floor(Math.random() * 1e9)}`,
            type: "TOPUP",
            amount: value,
            balance_after: balance,
            note: note || "Wallet top-up",
            created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
          },
          ...merchant.ledger
        ]
      };
    });
    onToast("success", "Wallet topped up.");
  }

  function setCommission(id, rate) {
    patch(id, () => ({ commission_rate: Number(rate) || 0 }));
    onToast("success", "Commission rate saved.");
  }

  function regenerateKey(id) {
    patch(id, () => ({ api_key: generateApiKey(), api_key_status: "ACTIVE", api_key_last_used: null }));
    onToast("success", "New API key generated. The previous key no longer works.");
  }

  function revokeKey(id) {
    patch(id, () => ({ api_key_status: "REVOKED" }));
    onToast("error", "API key revoked.");
  }

  return {
    merchants: filtered,
    stats,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selected,
    authenticate,
    findMerchant,
    selectMerchant: setSelectedId,
    closeDrawer: () => setSelectedId(null),
    formOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    saveMerchant,
    approveKyc,
    rejectKyc,
    setStatus,
    topUp,
    setCommission,
    regenerateKey,
    revokeKey
  };
}
