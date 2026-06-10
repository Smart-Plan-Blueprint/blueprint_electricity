import { useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
import { Button, Field } from "@blueprint/ui";

const empty = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  reg_number: "",
  tax_number: "",
  commission_rate: "5",
  opening_float: "0"
};

export default function MerchantFormModal({ editing, onSave, onClose }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || "",
        contact_name: editing.contact_name || "",
        email: editing.email || "",
        phone: editing.phone || "",
        address: editing.address || "",
        reg_number: editing.reg_number || "",
        tax_number: editing.tax_number || "",
        commission_rate: String(editing.commission_rate ?? "5"),
        opening_float: "0"
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [editing]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Business name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid contact email address.");
      return;
    }
    onSave(form);
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <p className="eyebrow">{editing ? "Edit merchant" : "Onboard merchant"}</p>
            <h2>{editing ? editing.name : "New reseller account"}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <form className="merchant-form" onSubmit={submit}>
          <div className="form-grid">
            <Field label="Business name" value={form.name} onChange={set("name")} placeholder="Acme Energy (Pty) Ltd" />
            <Field label="Contact person" value={form.contact_name} onChange={set("contact_name")} placeholder="Full name" />
            <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="accounts@business.bw" />
            <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="+267 7x xxx xxx" />
            <Field label="Registration number" value={form.reg_number} onChange={set("reg_number")} placeholder="BW00000000000" />
            <Field label="Tax number" value={form.tax_number} onChange={set("tax_number")} placeholder="TAX-0000000" />
            <Field label="Commission rate (%)" type="number" step="0.1" min="0" value={form.commission_rate} onChange={set("commission_rate")} />
            {!editing ? (
              <Field label="Opening float (BWP)" type="number" step="0.01" min="0" value={form.opening_float} onChange={set("opening_float")} />
            ) : null}
          </div>
          <Field label="Physical address" value={form.address} onChange={set("address")} placeholder="Plot, street, town" />

          {error ? <p className="inline-notice tone-bad">{error}</p> : null}

          <div className="section-actions">
            <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
            <Button icon={Building2}>{editing ? "Save changes" : "Onboard merchant"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
