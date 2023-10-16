import React from "react";

export const SumAndSortInvoices = (invoices, categories) => {

  const currentYear = new Date().getFullYear();
  // Create an array to store the summed invoice amounts for each month
  const monthlyAmounts = Array(12).fill(0);
  const totalAmountByCategory = {};
  const percentageByCategory = {};
  let totalAmount = 0;
  let paidInvoices = 0;
  let unpaidInvoices = []


  categories.forEach((category) => {
    totalAmountByCategory[category] = 0;
  });
  

  invoices.forEach((invoice) => {
    const invoiceYear = new Date(invoice.date).getFullYear();

    // Sum the invoice amounts for each month within the specified year
    if (invoiceYear === currentYear) {
      const month = new Date(invoice.date).getMonth();
      const amount = parseFloat(invoice.amount);
      monthlyAmounts[month] += amount;
    }

    // Sum amounts for each category
    invoice.account && (totalAmountByCategory[invoice.account.category.name] += invoice.amount);
    totalAmount += invoice.amount;
    invoice.is_paid
      ? paidInvoices += 1
      : unpaidInvoices.push(invoice);
  });
  

  // Count percentage of each category
  categories.forEach((category) => {
    const categoryAmount = totalAmountByCategory[category];
    const percentage = (categoryAmount / totalAmount) * 100;
    percentageByCategory[category] = percentage.toFixed(2); // Round the percentage to 2 decimal places
  });


  // Sort the monthly amounts
  const sortedValues = monthlyAmounts
    .map((amount, monthIndex) => ({
    month: monthIndex + 1, // Months are 0-indexed, so add 1 to make them 1-12
    amount: amount,
    }))
    .sort((a, b) => a.month - b.month)
    .map((item) => item.amount);

    
  // Convert month number to string in 01, 02, 03... format
  function formatDateToString(month) {
    let MM = ((month + 1) < 10 ? '0' : '')
        + (month + 1);
    return MM;
  };

  const prevMonth = (month) => {
    if (month === 1) {
      return "12"
    }
    return formatDateToString(month - 2)
  };

  // Percentage difference Year-To-Year
  const monthDiff = (thisYear[formatDateToString(month)] / thisYear[prevMonth(formatDateToString(month))]) * 100 - 100;


  return [sortedValues, monthlyAmounts, totalAmount, totalAmountByCategory, paidInvoices, unpaidInvoices];
}

