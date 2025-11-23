const platformConfig = {
  whatsapp: { feePercent: 2.5, flat: 0 },
  tiktok: { feePercent: 4.0, flat: 10 },
  meta: { feePercent: 5.0, flat: 0 },
  google: { feePercent: 3.0, flat: 0 }
};

function el(id){return document.getElementById(id)}

async function convertCurrency(amount, from, to){
  try{
    const res = await fetch(`/api/convert?amount=${amount}&from=${from}&to=${to}`);
    if(!res.ok) throw new Error('Conversion failed');
    const data = await res.json();
    return data; // {result, rate}
  }catch(e){console.error(e);throw e;}
}

function format(n){return typeof n==='number'?n.toLocaleString(undefined,{maximumFractionDigits:2}):n}

el('calc').addEventListener('click', async ()=>{
  const platform = el('platform').value;
  const rawAmount = parseFloat(el('amount').value||0);
  const currency = el('currency').value;
  const tax = parseFloat(el('tax').value||0);
  const target = el('targetCurrency').value;

  if(!rawAmount || rawAmount<=0){alert('Enter valid amount'); return}

  const cfg = platformConfig[platform];
  const platformFee = rawAmount*(cfg.feePercent/100)+cfg.flat;
  const subtotal = rawAmount + platformFee;
  const taxAmount = subtotal*(tax/100);
  const totalLocal = subtotal + taxAmount;

  try{
    const conv = await convertCurrency(totalLocal,currency,target);
    const totalTarget = conv.result;
    const rate = conv.rate;

    const breakdown = `Amount Original ${format(rawAmount)} ${currency}
Platform Fee ${format(platformFee)} ${currency}
Tax ${format(taxAmount)} ${currency}
Total ${format(totalLocal)} ${currency}

Converted to ${target} rate ${format(rate)}
Final Total ${format(totalTarget)} ${target}`;

    el('breakdown').innerText = breakdown;
    el('result').classList.remove('hidden');

    el('download').onclick = ()=>downloadPDF({platform,rawAmount,currency,platformFee,tax,taxAmount,totalLocal,target,rate,totalTarget});
    el('copy').onclick = ()=>navigator.clipboard.writeText(`${format(totalTarget)} ${target}`).then(()=>alert('Copied total'));
  }catch(e){alert('Error converting currency')}
});

function downloadPDF(data){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt',format:'a4'});
  let y = 40;
  doc.setFontSize(16);
  doc.text('Ad Cost Calculator Receipt',40,y); y+=30;
  doc.setFontSize(12);
  doc.text(`Platform ${data.platform}`,40,y); y+=18;
  doc.text(`Amount ${data.rawAmount} ${data.currency}`,40,y); y+=18;
  doc.text(`Platform Fee ${data.platformFee} ${data.currency}`,40,y); y+=18;
  doc.text(`Tax ${data.taxAmount} ${data.currency}`,40,y); y+=18;
  doc.text(`Total ${data.totalLocal} ${data.currency}`,40,y); y+=18;
  doc.text(`Converted ${data.totalTarget} ${data.target} rate ${data.rate}`,40,y);
  doc.save('receipt.pdf');
}
