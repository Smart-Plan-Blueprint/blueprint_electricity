export const merchantStatuses = ["ACTIVE", "PENDING", "SUSPENDED"];
export const kycStatuses = ["APPROVED", "PENDING", "REJECTED"];
export const kycDocumentTypes = [
  "Certificate of incorporation",
  "Director ID",
  "Proof of address",
  "Tax clearance",
  "Bank confirmation letter"
];

let idCounter = 1000;

export function nextMerchantId() {
  idCounter += 1;
  return `mrc_${idCounter}`;
}

export function generateApiKey() {
  const random = Array.from({ length: 24 }, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
  return `spb_live_${random}`;
}

export function maskApiKey(key) {
  if (!key) {
    return "—";
  }
  return `${key.slice(0, 12)}${"•".repeat(10)}${key.slice(-4)}`;
}

function ledgerEntry(type, amount, balanceAfter, note, daysAgo) {
  const date = new Date(Date.UTC(2026, 5, 9, 9, 0, 0));
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `led_${Math.floor(Math.random() * 1e9)}`,
    type,
    amount,
    balance_after: balanceAfter,
    note,
    created_at: date.toISOString().slice(0, 19).replace("T", " ")
  };
}

export function createWalletLedger(balance) {
  return [
    ledgerEntry("TOPUP", 5000, 5000, "Bank transfer float top-up", 14),
    ledgerEntry("VEND", -1850.5, 3149.5, "Electricity vending settlement", 9),
    ledgerEntry("COMMISSION", 92.53, 3242.03, "Commission earned on vends", 9),
    ledgerEntry("TOPUP", 2500, 5742.03, "Bank transfer float top-up", 4),
    ledgerEntry("VEND", -742.03 - (5000 - balance), balance, "Electricity vending settlement", 1)
  ];
}

const seed = [
  {
    name: "MOTAKASE HOLDINGS",
    contact_name: "Kabo Motakase",
    email: "accounts@motakase.co.bw",
    password: "demo1234",
    phone: "+267 71 234 567",
    address: "Plot 1123, Broadhurst, Gaborone",
    reg_number: "BW00001234567",
    tax_number: "TAX-2291045",
    status: "ACTIVE",
    kyc_status: "APPROVED",
    commission_rate: 5,
    balance: 4242.03
  },
  {
    name: "THUTO ENERGY SHOP",
    contact_name: "Lorato Thuto",
    email: "lorato@thutoenergy.bw",
    password: "demo1234",
    phone: "+267 72 998 110",
    address: "Shop 4, Maun Mall, Maun",
    reg_number: "BW00009987654",
    tax_number: "TAX-7741882",
    status: "ACTIVE",
    kyc_status: "APPROVED",
    commission_rate: 4.5,
    balance: 1880.0
  },
  {
    name: "PALAPYE SERVICE STATION",
    contact_name: "Tshepo Olebile",
    email: "finance@palapyefuel.bw",
    password: "demo1234",
    phone: "+267 73 445 220",
    address: "A1 Highway, Palapye",
    reg_number: "BW00004455221",
    tax_number: "TAX-5512098",
    status: "PENDING",
    kyc_status: "PENDING",
    commission_rate: 5,
    balance: 0
  },
  {
    name: "SEROWE MINI MART",
    contact_name: "Naledi Serowe",
    email: "naledi@serowemart.bw",
    password: "demo1234",
    phone: "+267 74 110 778",
    address: "Main Road, Serowe",
    reg_number: "BW00007788990",
    tax_number: "TAX-3398771",
    status: "SUSPENDED",
    kyc_status: "REJECTED",
    commission_rate: 3.5,
    balance: 312.4
  }
];

const customers = [
  "BLUE VILLAGE SUPERMARKET",
  "KGOSI TRADING",
  "MAUN CASH STORE",
  "LOBATSE WHOLESALERS",
  "GABORONE TECH HUB",
  "DUNDREGAN (PTY) LTD"
];

const transactionMessages = {
  SUCCESS: "Transaction completed successfully",
  FAILED: "Provider rejected the vending request"
};

export function createMerchantTransactions(merchant) {
  if (merchant.status !== "ACTIVE") {
    return [];
  }

  const seedNumber = merchant.id.split("_")[1] ? Number(merchant.id.split("_")[1]) : 1;
  const count = 30 + (seedNumber % 5) * 8;

  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const status = number % 19 === 0 || number % 11 === 0 ? "FAILED" : "SUCCESS";
    const amount = [20, 40, 50, 75, 100, 150, 200, 250, 300, 500][(seedNumber + index) % 10];
    const date = new Date(Date.UTC(2026, 5, 9, 8, 30, 0));
    date.setHours(date.getHours() - index * 6);

    return {
      transaction_id: `${merchant.id}-${String(number).padStart(4, "0")}`,
      created_at: date.toISOString().slice(0, 19).replace("T", " "),
      receipt_no: status === "SUCCESS" ? `SPB${String(800000 + seedNumber * 137 + index * 19)}` : "",
      meter_number: `14030${String(500000 + seedNumber * 311 + index * 113).padStart(6, "0")}`.slice(0, 11),
      customer_name: customers[(seedNumber + index) % customers.length],
      merchant_name: merchant.name,
      merchant_id: merchant.id,
      amount: amount.toFixed(2),
      status,
      message: transactionMessages[status]
    };
  });
}

export function createDemoMerchants() {
  return seed.map((entry, index) => {
    const date = new Date(Date.UTC(2026, 4, 2, 10, 0, 0));
    date.setDate(date.getDate() + index * 9);

    return {
      id: nextMerchantId(),
      ...entry,
      pricing_model: "commission",
      api_key: entry.status === "PENDING" ? "" : generateApiKey(),
      api_key_status: entry.status === "SUSPENDED" ? "REVOKED" : entry.status === "PENDING" ? "PENDING" : "ACTIVE",
      api_key_last_used: entry.status === "ACTIVE" ? "2026-06-09 07:42:11" : null,
      kyc_documents: kycDocumentTypes.map((type, docIndex) => ({
        type,
        status: entry.kyc_status === "APPROVED"
          ? "VERIFIED"
          : entry.kyc_status === "REJECTED" && docIndex === 1
            ? "REJECTED"
            : docIndex < 3 ? "UPLOADED" : "MISSING"
      })),
      ledger: createWalletLedger(entry.balance),
      created_at: date.toISOString().slice(0, 10)
    };
  });
}
