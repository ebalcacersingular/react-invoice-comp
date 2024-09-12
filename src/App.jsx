import React, { useMemo, useState, forwardRef, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import generatePDF from 'react-to-pdf';

const existingPromoCodes = [
  { code: "VERDE50", persent: 0.5, cats: ["Verduras", "Frutas", "Viveres"] },
  { code: "RON30RD", persent: 0.3, cats: ["Alcoholes"] }
]

const billTypes = [
  { type: "consumidor_final", title: "FACTURA PARA CONSUMIDOR FINAL" }
]

const businesses = [{
  id: 1,
  name: "Barn Market S.A.",
  rnc: "342342345",
  logo: "https://static.vecteezy.com/system/resources/previews/012/139/134/non_2x/farm-logo-barn-logo-design-free-vector.jpg",
  employees: [
    {
      id: "MP-456484",
      name: "Maura Perez"
    }
  ],
  branches: [
    {
      id: 1,
      title: "Independencia 1",
      currentShift: {
        start: "3:00 pm",
        end: "7:00 pm",
        registers: [
          {
            code: "G7TR3-00192",
            employeeId: "MP-456484",
          }
        ]
      }
    }
  ]
}]

const customers = [
  { name: "Enmanuel Balcacer", syscode: "EB-053453" }
]

const taxes = [
  { type: "I2", persent: 0.18 },
  { type: "I1", persent: 0.16 },
  { type: "EX", persent: 0 }
]

const invoiceItems = [
  { desc: "Barn Platano Verde", qty: 4, price: 19.95, tax: "EX", cats: ["Viveres"] },
  { desc: "Rica Leche Entera 1lt", qty: 2, price: 24.9, tax: "I2", cats: ["Lacteos", "Bebidas"] },
  { desc: "Snacky Papitas 350mg", qty: 1, price: 15, tax: "I1", cats: ["Snacks"] },
  { desc: "Yommies Taqueritos Chile Toreado 180g", qty: 1, price: 80.6, tax: "I2", cats: ["Snack"] },
  { desc: "Barn Katchup 600mg", qty: 1, price: 65, tax: "EX", cats: ["Salsas", "Untables", "Locales"] },
  { desc: "Le Force Vino 1gal", qty: 1, price: 144.99, tax: "I2", cats: ["Alcoholes", "Bebidas"] },
  { desc: "Barn Jugo Naranja 500ml", qty: 2, price: 20, tax: "EX", cats: ["Bebidas", "Jugos", "Locales"] },
  { desc: "Kinsu Sopa Pollo 85g", qty: 2, price: 29, tax: "I2", cats: ["Caldos", "Instantaneos"] },
]
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const InvoicePrices = ({ payments = [], promoCodes = [], items = [] }) => {
  const [totalDiscount, setTotalDiscount] = useState(0);

  const [subtotal, taxes] = useMemo(() => {
    const totalTaxes = +items.reduce(
      (prev, curr) => prev + getTaxesFromItem(curr), 0)

    const subtotal = +items.reduce((prev, curr) => {
      return prev + (curr.price * curr.qty)
    }, 0) + totalTaxes;

    return [subtotal, totalTaxes];
  }, [items]);

  const [_total, _subtotal, _tax] = useMemo(() => {
    const positiveDiscount = +("" + (totalDiscount ?? 0)).replace("-", "")
    const _total = formatter.format(subtotal - positiveDiscount)
    const _subtotal = formatter.format(subtotal);
    const _tax = formatter.format(taxes);
    return [_total, _subtotal, _tax];
  }, [subtotal, totalDiscount, taxes]);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItem: 'center',
            // gap: "20px",
            marginBottom: "10px"
          }}
        >
          <div style={{ width: "300px" }}>
            <span style={{ fontWeight: 'bold' }}>Subtotal</span>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 'bold', width: "100%", textAlign: "end", fontSize: '0.8em' }}>{_tax}</span>
            <span style={{ fontWeight: 'bold', width: "100%", textAlign: "end", fontSize: '0.8em' }}>{_subtotal}</span>
          </div>
        </div>
        {!!promoCodes?.length && <InvoiceDiscounts promoCodes={promoCodes} items={items} getTotalDiscount={setTotalDiscount} />}
        <DashBox>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItem: 'center',
              paddingTop: "20px",
              paddingBottom: "20px"
            }}
          >
            <span style={{ fontWeight: 'bold', fontSize: "30px" }}>Total</span>
            <span style={{ fontWeight: 'bold', fontSize: "30px" }}>{_total}</span>
          </div>
        </DashBox>
      </div>
      <DashBox>
        <span>Pagos</span>
      </DashBox>
      <DashBox>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "10px" }}>
          {(payments ?? []).map(item => (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItem: 'center',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>{item?.desc ?? "--"}</span>
              <span style={{ fontWeight: 'bold' }}>{formatter.format(item?.amount ?? 0)}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItem: 'center',
            paddingTop: "25px",
          }}
        >
          <span style={{ fontWeight: 'bold' }}>CAMBIO</span>
          <span style={{ fontWeight: 'bold' }}>{formatter.format((
            payments.reduce((prev, curr) => prev + curr?.amount, 0) - (+_total.replace("$", "").split(",").join(""))
          ) || 0)}</span>
        </div>
      </DashBox>
    </div>
  );
};

const DashBox = ({ children }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: 'column',
      borderWidth: 1,
      borderColor: "gray",
      borderStyle: 'dashed',
      width: "100%",
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      paddingTop: "10px",
      paddingBottom: "10px"
    }}>
      {children}
    </div>
  )
}

const generateNCF = () => {
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return "E" + code;
}

const generateInvoiceNumber = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 10; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }

  return code;
}

const InvoiceDiscounts = ({ promoCodes = [], items = [], getTotalDiscount = (amount = 0) => { } }) => {
  const [codes, totalDiscount] = useMemo(() => {
    let totalDiscount = 0;
    const _codes = [];

    for (const currentCode of promoCodes) {
      const codeDiscount = items.reduce((prev, curr) => prev + getDiscountFromItem(curr, currentCode), 0);

      _codes.push({ code: currentCode, amount: codeDiscount });

      totalDiscount += codeDiscount;
    }

    if (getTotalDiscount) getTotalDiscount(totalDiscount)

    return [_codes, totalDiscount]
  }, [promoCodes, items])

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <DashBox>
        <span>Descuentos</span>
      </DashBox>
      <DashBox>
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
          <span>PROMO</span>
          <span>MONTO</span>
        </div>
      </DashBox>
      <DashBox>
        <div style={{ width: "100%", display: "flex", flexDirection: 'column', gap: "10px" }}>
          {codes.map((item) => (
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <span>{item.code}</span>
              <span>{formatter.format(-item.amount)}</span>
            </div>
          ))}
        </div>
      </DashBox>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItem: 'center',
          paddingTop: "20px",
          paddingBottom: "20px"
        }}
      >
        <span style={{ fontWeight: 'bold' }}>TOTAL DESCUENTO</span>
        <span style={{ fontWeight: 'bold' }}>{formatter.format(-totalDiscount)}</span>
      </div>
    </div>
  )
}

const InvoiceHeader = ({ business, branch }) => {
  const [date, time] = useMemo(() => {
    return [new Date().toLocaleDateString(), new Date().toLocaleTimeString()]
  }, [])

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", paddingTop: "10px" }}>
      <div style={{ width: "100%", display: "flex", alignItems: 'center', justifyContent: 'start', gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <img src={business?.logo ?? null} alt="Logo IMG" width={"80px"} height={"80px"} style={{ objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontWeight: "bold", fontSize: "1.3em" }}>{business?.name ?? "--"}</span>
          <span>RNC: {business?.rnc ?? '--'}</span>
          <span>Suc: {branch ?? "--"}</span>
        </div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "5px", paddingTop: "10px", paddingBottom: "20px" }}>
        <span>{date} {time}</span>
        <span>e-NCF: {generateNCF()}</span>
      </div>
    </div>
  )
}

const InvoiceFooter = ({ employee, customerSyscode, invoiceNum, register, prodQty }) => {
  const customer = useMemo(() => {
    return customers.find(c => c.syscode === customerSyscode) ?? null
  }, [])

  const invoiceUrl = `https://posybil.com/bill/${invoiceNum}`;

  return (
    <div style={{ display: "flex", flexDirection: 'column', width: "100%", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "20px", alignItems: 'center' }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: 'start', gap: "5px" }}>
          <span>CLIENTE</span>
          <span style={{ fontWeight: "bold" }}>{customer?.name ?? "--"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: 'end', gap: "5px" }}>
          <span>SYSCODE</span>
          <span style={{ fontWeight: "bold" }}>{customer?.syscode ?? "--"}</span>
        </div>
      </div>
      <DashBox>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "20px", alignItems: 'end' }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "5px" }}>
              <span>CAJERO</span>
              <span style={{ fontWeight: "bold", }}>{employee?.name ?? '--'}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "5px" }}>
              <span>CAJERO ID</span>
              <span style={{ fontWeight: "bold", }}>{employee?.id ?? '--'}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "5px", alignItems: 'end' }}>
              <span>CANT ARTS</span>
              <span style={{ fontWeight: "bold", }}>{prodQty ?? '--'}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "5px", alignItems: 'end' }}>
              <span>CAJA NO</span>
              <span style={{ fontWeight: "bold", }}>{register ?? '--'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: 'center', justifyContent: 'center', paddingTop: "20px" }}>
          <DashBox>
            <span>FACTURA NO</span>
            <span style={{ fontWeight: "bold", fontSize: "1.2em" }}>{invoiceNum ?? '--'}</span>
          </DashBox>
          <div style={{ width: "200px", marginTop: "20px" }}>
            <QRCodeSVG value={invoiceUrl ?? null} size={200} width={"200"} fgColor='#1E212B' />
          </div>
          {invoiceUrl && <span style={{ fontSize: '0.2em' }}>{invoiceUrl}</span>}
        </div>
      </DashBox>
    </div>
  )
}

const InvoiceItem = ({ item }) => {
  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", paddingTop: "10px", paddingBottom: "10px", fontSize: '0.8em' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: "150px" }}>
        <span style={{ width: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc ?? "--"}</span>
        <span>{formatter.format(item.qty ?? 0)} X {formatter.format(item.price ?? 0)}</span>
      </div>
      <div style={{ display: 'flex', width: "100%", justifyContent: 'space-between' }}>
        <span style={{ width: "100%", textAlign: "end" }}>{formatter.format(getTaxesFromItem(item))}</span>
        <span style={{ width: "100%", textAlign: "end" }}>{formatter.format(((item.price ?? 0) * (item.qty ?? 0)) + getTaxesFromItem(item))}</span>
      </div>
    </div>
  )
}

const getDiscountFromItem = ({ qty, price, cats }, promoCode) => {
  const sub = (qty * price)

  const promo = existingPromoCodes.find(p => p.code === promoCode);

  if (!promo) return 0;

  if (cats.some(cat => promo.cats.includes(cat))) {
    return sub * promo.persent;
  }

  return 0
}

const getTaxesFromItem = ({ qty, price, tax }) => {
  return qty * price * (taxes.find(t => t.type === tax)?.persent ?? 0);
}

const Invoice = forwardRef(({ items = [], promoCodes = [], businessId, customerSyscode, registerCode, billingType, branchId, payments, getInvoiceNumber }, ref) => {
  const [invoiceNum, setInvoiceNum] = useState("");
  const [business, branch, register, employee] = useMemo(() => {
    const _business = businesses.find(b => b.id === businessId);

    if (!_business) return [null, null, null, null];

    const _branch = _business.branches.find(b => b.id === branchId);

    if (!_branch) return [_business, null, null, null];

    const _register = _branch.currentShift.registers.find(r => r.code === registerCode);

    if (!_register) return [_business, _branch, null, null];

    const _employee = _business.employees.find(e => e.id === _register.employeeId);

    if (!_employee) return [_business, _branch, _register, null];

    return [_business, _branch, _register, _employee];
  }, [])

  useEffect(() => {
    const _invoiceNum = generateInvoiceNumber();
    setInvoiceNum(_invoiceNum);
    if (getInvoiceNumber) getInvoiceNumber(_invoiceNum);
  }, [])

  return (
    <div
      ref={ref}
      style={{
        width: "350px",
        background: "white",
        boxSizing: "border-box",
        fontFamily: "monospace",
        color: "#1E212B",
        padding: "20px",
        paddingBottom: "40px",
        display: "flex",
        flexDirection: "column",
        height: "auto",
        overflow: "hidden"
      }}>
      <div style={{ width: "100%", textAlign: "center" }}>
        <span> *** COPIA DE DOCUMENTO FISCAL ***</span>
      </div>
      <InvoiceHeader
        business={business}
        branch={branch.title ?? null}
      />
      <DashBox>
        <span>{billTypes.find(b => b.type === billingType)?.title}</span>
      </DashBox>
      <DashBox>
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ width: "340px" }}>
            <span>ARTICULO</span>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: "20px" }} >
            <span style={{ width: "100%", textAlign: "end" }}>ITBIS</span>
            <span style={{ width: "100%", textAlign: "end" }}>MONTO</span>
          </div>
        </div>
      </DashBox>
      <DashBox>
        {items.map((item, index) => {
          const itemKey = ("" + item.desc).toLowerCase().split(" ").join("_");
          return (
            <InvoiceItem key={itemKey} index={index} item={item} />
          )
        })}
      </DashBox>
      <DashBox>
        <InvoicePrices payments={payments} items={items} promoCodes={promoCodes} />
      </DashBox>
      <DashBox>
        <InvoiceFooter
          employee={employee ?? null}
          register={register?.code ?? "--"}
          prodQty={items.reduce((prev, curr) => prev + curr.qty, 0) ?? 0}
          customerSyscode={customerSyscode}
          invoiceNum={invoiceNum}
        />
      </DashBox>
      <div style={{ width: "100%", textAlign: "center", marginTop: "20px" }}>
        <span> *** FIN DOCUMENTO NO VENTA ***</span>
      </div>
    </div>
  )
})

export function App(props) {
  const invoiceRef = useRef();
  const [invoiceNum, setInvoiceNum] = useState("page");

  return (
    <div className='App' style={{
      padding: "40px",
      background: "black",
      display: "flex",
      width: "100vw",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    }}>
      <div style={{ padding: "20px", width: "100%", display: "flex", justifyContent: 'end', alignItems: "center" }}>
        <button
          style={{ border: 0, padding: "20px", borderRadius: "10px" }}
          onClick={() => generatePDF(invoiceRef, { filename: `Invoice_${invoiceNum}.pdf` })}
        >Print Invoice</button>
      </div>
      <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
        <Invoice
          getInvoiceNumber={(_invoiceNum) => setInvoiceNum(_invoiceNum)}
          ref={invoiceRef}
          items={invoiceItems}
          promoCodes={["VERDE50", "RON30RD"]}
          branchId={1}
          customerSyscode={"EB-053453"}
          businessId={1}
          registerCode={"G7TR3-00192"}
          billingType={'consumidor_final'}
          payments={[
            // {
            //   methodType: "credit_card",
            //   desc: "TARJETA 5699",
            //   amount: 10500,
            // },
            {
              methodType: "cash",
              desc: "EFECTIVO",
              amount: 600,
            },
          ]}
        />
      </div>

    </div>
  );
}
