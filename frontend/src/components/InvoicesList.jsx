import React from "react";

export const InvoicesList = (props) => {
  const { invoices } = props;
  if (!invoices || invoices.length === 0) return <p>No invoices, sorry</p>;
  return (
    <ul>
      <h2 className='list-head'>Available invoices</h2>
        {invoices.map(invoice => (
            <li key={invoice.id}>{invoice.number}
                <ul>
                    <li>{invoice.supplier} | {invoice.date} | {invoice.amount}zł | {invoice.is_paid? 'Opłacone' : 'Nieopłacone'} </li>
                </ul>
            
            </li>
        ))}
    </ul>
  );
};
