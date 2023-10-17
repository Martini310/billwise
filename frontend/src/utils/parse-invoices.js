export const SumAndSortInvoices = (invoices, categories) => {

  const currentYear = new Date().getFullYear();

  // Create an arrays to store the summed invoice amounts for each month
  const currentYearAmounts = Array(12).fill(0);
  const previousYearAmounts = Array(12).fill(0);

  const totalAmountByCategory = {};
  const percentageByCategory = {};
  let totalAmount = 0;
  let paidInvoices = 0;
  let unpaidInvoices = []

  // Assign 0 to each category name
  categories.forEach((category) => {
    totalAmountByCategory[category] = 0;
  });
  

  invoices.forEach((invoice) => {
    const invoiceYear = new Date(invoice.date).getFullYear();

    const invoiceMonth = new Date(invoice.date).getMonth();
    const amount = parseFloat(invoice.amount);

    // Sum the invoice amounts for each month within the specified year
    if (invoiceYear === currentYear) {
      currentYearAmounts[invoiceMonth] += amount;
    }

    // Sum the invoice amounts for each month within the previous year
    if (invoiceYear === currentYear - 1) {
      previousYearAmounts[invoiceMonth] += amount;
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
    percentageByCategory[category] = +percentage.toFixed(2); // Round the percentage to 2 decimal places
  });


  // Calculate monthly percentage difference
  const currentMonth = new Date().getMonth()
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1

  const currentValue = currentYearAmounts[currentMonth]
  const previousValue = previousMonth === 11 ? previousYearAmounts[previousMonth] : currentYearAmounts[previousMonth]

  const monthDifference = currentValue / previousValue * 100 - 100

  console.log(monthDifference, previousValue, currentValue, previousMonth, currentMonth)

  return ([currentYearAmounts, 
          previousYearAmounts, 
          percentageByCategory, 
          paidInvoices, 
          unpaidInvoices, 
          monthDifference])
}

